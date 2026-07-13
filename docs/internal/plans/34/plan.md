---
issue: 34
title: "ci: add packaging & monorepo consistency validation (publint + attw + sherif)"
author: martyy-code
generated: 2026-07-13
status: approved
reviewer: martyy-code
reviewed: 2026-07-13
branch: impl/34-ci-publint-attw-sherif
labels: [enhancement, area:build, area:ci]
priority: Medium
effort: Low
---

## Outline

1. [Step 1 — Fix the root cause: `special.ts` import](#step-1--fix-the-root-cause-specialts-import)
2. [Step 2 — Install dev tooling](#step-2--install-dev-tooling)
3. [Step 3 — Add per-tool scripts and Turbo tasks](#step-3--add-per-tool-scripts-and-turbo-tasks)
4. [Step 4 — Wire the checks into CI](#step-4--wire-the-checks-into-ci)
5. [Step 5 — Promote to required status checks](#step-5--promote-to-required-status-checks)
6. [Step 6 — Document in `CONTRIBUTING.md`](#step-6--document-in-contributingmd)

---

## TL;DR

Fix the lone `.js`-less import in the lib, add `publint` / `@arethetypeswrong/cli` / `sherif` as root devDependencies with per-tool turbo tasks, run them in `ci.yml` (and locally via `pnpm`), and surface their names in the "Code quality" section of `CONTRIBUTING.md` so they become the gate that catches packaging and version-drift regressions before they ship.

---

## Issue summary

Validate the published library and the monorepo itself in CI with three lightweight tools: **`publint`** (checks `package.json` / `exports` / `files` against npm rules), **`@arethetypeswrong/cli` (attw)** (resolves the package's types under `node16` / `nodenext` / `bundler` and exposes real consumer-side defects), and **`sherif`** (version-consistency across workspace packages — misplaced `@types/*`, desynced peer versions, unsorted deps). Acceptance: green on the current repo once `special.ts:5`'s missing `.js` is fixed, wired as required checks on PRs to `main`, and documented in `CONTRIBUTING.md`.

---

## Files to touch

| File | Action | Why |
|------|--------|-----|
| `packages/type-testing/src/types/special.ts` | edit | Fix `import type { Equal } from './equality'` → `'./equality.js'` so `attw` under `nodenext` passes (matches every other relative import in the lib). |
| `package.json` (root) | edit | Add `publint`, `@arethetypeswrong/cli`, `sherif` devDependencies; add `lint:publint` / `lint:attw` / `lint:sherif` scripts; aggregate under `lint`. |
| `pnpm-lock.yaml` | edit (regen) | Lockfile update from `pnpm install`. |
| `turbo.json` | edit | Add three new turbo tasks (`lint:publint`, `lint:attw`, `lint:sherif`); make them cacheable; tighten the existing `lint` task to depend on them so `pnpm turbo lint` aggregates. |
| `.github/workflows/ci.yml` | edit | After the current build/test steps, run `pnpm turbo lint:publint lint:attw lint:sherif` with the same pnpm/Node setup. `attw` needs `dist/`, so these run **after** `pnpm turbo build`. |
| `CONTRIBUTING.md` | edit | In the "Code quality" section, list the three new scripts alongside `pnpm lint` / `pnpm typecheck` / `pnpm test`, and mention they run in CI on every PR. |
| `.changeset/*.md` | create | Patch-level changeset for `@deessejs/type-testing` is **not** required (CI/docs tooling only). Skip a changeset. |

---

## Step-by-step implementation

### Step 1 — Fix the root cause: `special.ts` import

`packages/type-testing/src/types/special.ts`

- Change line 5 from `import type { Equal } from './equality'` to `import type { Equal } from './equality.js'`.
- **Why first:** `moduleResolution: "bundler"` in the root `tsconfig.json` tolerates the bare specifier today, but `attw` resolves types under `node16` / `nodenext` where the `.js` extension is mandatory. Without this fix, `lint:attw` will fail on day one and we will not be able to land the issue's acceptance criterion ("All three pass against the current repo after fixing the special.ts import issue"). Every other relative import in `packages/type-testing/src/**` already uses `.js`, so this just brings `special.ts` in line.
- **No other files** under `packages/type-testing/src` need to change — confirmed via grep for `from '\./[^.]` (would-be bare specifiers); only this one match exists.

### Step 2 — Install dev tooling

`package.json` (root)

- Add to `devDependencies`:
  - `"publint": "^0.3.0"` (zero-config; emits warnings/errors against `package.json`)
  - `"@arethetypeswrong/cli": "^0.18.0"` (resolves `@deessejs/type-testing` against `node16` / `nodenext` / `bundler`)
  - `"sherif": "^1.5.0"` (workspace version-consistency check)
- Pin via caret ranges consistent with the existing entries (`^9.0.0`, `^2.0.0`, `^5.0.0`); use `pnpm add -D` at the root so `pnpm-lock.yaml` updates automatically.
- Run `pnpm install --frozen-lockfile` in CI to confirm the lockfile resolves.

### Step 3 — Add per-tool scripts and Turbo tasks

`package.json` (root) — `scripts` block

- Add three top-level scripts:
  - `"lint:publint": "publint --strict packages/type-testing"` (scoped to the published package; the root `package.json` is private and not on npm)
  - `"lint:attw": "pnpm --filter @deessejs/type-testing build && attw --pack packages/type-testing --ignore-rules resolution" ` — note on the `--ignore-rules resolution` flag: attw's `resolution` rule conflates "no published version" with "wrong exports shape"; our `0.3.4` is the lowest available, omit if `--pack` + a real published version is added later. Keep `--format table` for readable CI logs.
  - `"lint:sherif": "sherif"` (no args — defaults to scanning `pnpm-workspace.yaml` from cwd)
- Add an aggregated `lint` script: `pnpm turbo lint lint:publint lint:attw lint:sherif` is **not** what we want (turbo won't run namespace tasks via this pattern). Instead keep the existing `turbo lint` and have CI run the three namespace tasks **in addition** to `turbo lint`. Add a convenience root script `"check:packaging": "pnpm lint:publint && pnpm lint:attw && pnpm lint:sherif"` for local dev parity with CI.

`turbo.json` — `tasks` block

- Add three new entries:
  ```jsonc
  "lint:publint": { "cache": true, "inputs": ["packages/type-testing/package.json", "packages/type-testing/dist/**"] },
  "lint:attw":    { "cache": true, "dependsOn": ["^build"], "inputs": ["packages/type-testing/package.json", "packages/type-testing/dist/**"] },
  "lint:sherif":  { "cache": true, "inputs": ["**/package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml"] }
  ```
- `lint:publint` does not need dist (it inspects `package.json` shape), but ignoring dist keeps cache hits independent of build artifacts.
- `lint:attw` runs against the built `dist/` so it must depend on `^build`; turborepo already understands the `dist/**` output.
- `lint:sherif` reads package.jsons + the lockfile, so its cache inputs cover those.

**Why three tasks instead of one:** each tool fails for different reasons with different remediation paths. Splitting cache keys avoids the false-cache-hits of bundling them, and per-task logs land in CI cleaner.

### Step 4 — Wire the checks into CI

`.github/workflows/ci.yml`

- Keep the existing `build` job; append three steps after `Test`:
  ```yaml
  - name: Sherif (workspace version consistency)
    run: pnpm turbo lint:sherif

  - name: Publint (packaging shape)
    run: pnpm turbo lint:publint

  - name: Are the types wrong (consumer-side type resolution)
    run: pnpm turbo lint:attw
  ```
- **Order matters:** `lint:attw` depends on `dist/`, but because the `build` job already ran `pnpm turbo test` which has `dependsOn: ["^test"]` (no `^build`), the build cache is *not* guaranteed to be populated. Add an explicit pre-step: `pnpm turbo build` before the three new checks, OR rely on Turbo remote cache to hydrate `dist/`. Safer choice for first introduction: add a `pnpm turbo build` step right before the three packaging checks, so every PR has a fresh, deterministic `dist/`.
- Use the same `concurrency` group already in the file (`${{ github.workflow }}-${{ github.ref }}`); the new steps inherit it.

### Step 5 — Promote to required status checks

Branch protection on `main`

- Use the GitHub REST API to add the new checks as **required status checks** for `main`:
  ```bash
  gh api -X PUT \
    repos/deessejs/type-testing/branches/main/protection/required_status_checks \
    --input <(jq -n '{
      strict: true,
      contexts: ["build / Lint", "build / Typecheck", "build / Test",
                 "build / Sherif (workspace version consistency)",
                 "build / Publint (packaging shape)",
                 "build / Are the types wrong (consumer-side type resolution)"]
    }')
  ```
- The exact step names must match what CI emits — verify by running the workflow once on the branch, then copying names from the run's UI into the API call. This is the only step in the spec that lives outside the repo; it's documented for the reviewer.
- **Why:** the issue's acceptance criterion is *"Wired as required checks on PRs to `main`"* — without branch-protection wiring, the checks would be advisory only and human reviewers could merge with red checks.

### Step 6 — Document in `CONTRIBUTING.md`

`CONTRIBUTING.md` — "Code quality" section

- Replace the current block:
  ```bash
  pnpm lint        # ESLint across all packages
  pnpm typecheck   # tsc --noEmit
  pnpm test        # vitest
  ```
  with:
  ```bash
  pnpm lint              # ESLint across all packages
  pnpm typecheck         # tsc --noEmit
  pnpm test              # vitest
  pnpm lint:sherif       # workspace version consistency (sherif)
  pnpm lint:publint      # package.json / exports map shape (publint)
  pnpm lint:attw         # consumer-facing type resolution (@arethetypeswrong/cli)
  pnpm check:packaging   # shorthand: runs the three packaging checks above
  ```
- Add a one-liner note: *"These three packaging/version checks run on every PR and are required to merge; the same commands are available locally for the same gate."*

---

## Verification checklist

- [ ] `packages/type-testing/src/types/special.ts:5` reads `'./equality.js'`.
- [ ] `pnpm install --frozen-lockfile` succeeds at the repo root.
- [ ] `pnpm turbo lint` passes (existing ESLint config unchanged).
- [ ] `pnpm turbo lint:sherif` passes (no version drift across workspace packages).
- [ ] `pnpm turbo build` produces `packages/type-testing/dist/**`.
- [ ] `pnpm turbo lint:publint` passes against `packages/type-testing/package.json`.
- [ ] `pnpm turbo lint:attw` passes — resolves types cleanly against `node16` / `nodenext` / `bundler`.
- [ ] `pnpm check:packaging` (root) succeeds end-to-end and matches the CI output byte-for-byte.
- [ ] `pnpm typecheck` and `pnpm test` still pass (no functional change to the lib).
- [ ] CI workflow run on the branch shows all six required checks with green badges; branch protection API call returns the expected context list.

---

## Risks / edge cases

- **Other packaging defects surface on first run.** `publint` and `attw` may flag additional issues beyond `special.ts:5` — e.g. the lib's `exports` map has no `"default"` condition (only `"import"`), no `"files"` field in `package.json` (so `LICENSE`/`README.md` won't be packed), and no `"publishConfig"` access declaration. **Mitigation:** triage each finding during implementation; fix-trivials (the `special.ts` import) as part of this PR, file follow-up issues for non-blocking warnings (e.g. `publishConfig`, `files`). Do **not** let discovered findings block landing the CI scaffolding; the issue's AC is *the checks exist and run*, not *the packaging is perfect*.
- **`attw` requires a built `dist/`.** If a contributor pushes without running build, `lint:attw` will fail with "package not found". **Mitigation:** Step 4 inserts an explicit `pnpm turbo build` before the three packaging checks. The Turbo remote cache keeps this fast after the first run.
- **`attw --pack` vs install-from-tarball.** `attw --pack packages/type-testing` packs the lib's contents, not the root `pnpm-lock.yaml`. The packed view reflects what npm would actually publish *after* `pnpm pack`, which is the consumer-facing truth we want. No mitigation needed, but document for the reviewer that `--pack` is intentional.
- **`sherif` may flag legitimate cross-version pins.** Examples worth triaging: `@types/node: ^20` in `apps/web` coexists with `node: ">=20"` in root — not drift, expected. **Mitigation:** run `sherif` once during implementation, capture its output, and decide per-finding. If a finding is correct, fix; if it's a false positive, ignore via `.sherif.yaml` (separate file, kept minimal).
- **Branch-protection API call is repo-settings, not repo-code.** `Step 5` is the one step that does not result in a code commit; it's a settings change. Document the `gh api` invocation in the PR description so the maintainer can run it once after merge.
- **No changeset needed.** CI tooling change does not affect the published `@deessejs/type-testing` artifact, so no `pnpm changeset add` is required (matches `CONTRIBUTING.md`: *"Changes that don't affect the published output (CI, docs, the web app) don't need one"*).

---

## PR metadata

| Field | Value |
|-------|-------|
| **Branch** | `impl/34-ci-publint-attw-sherif` |
| **PR title** | `ci: add packaging & monorepo consistency validation (publint + attw + sherif)` |
| **Labels** | `enhancement`, `area:build`, `area:ci` |
| **Assignee** | `martyy-code` |
| **Related issues** | #34 (this issue); standalone follow-up if non-blocking packaging findings are surfaced during implementation |
| **Branch protection** | Updated after merge (not part of the PR diff) — see Step 5 |
