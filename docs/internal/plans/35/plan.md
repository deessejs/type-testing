---
issue: 35
title: "chore: cleanup root template leftovers"
author: martyy-code
generated: 2026-07-13
status: approved
reviewer: martyy-code
reviewed: 2026-07-13
branch: impl/35-cleanup-root-template-leftovers
labels: [enhancement, area:docs, area:build]
priority: Medium
effort: Medium
---

## Outline

1. [Step 1 — Rename the root `package.json`](#step-1--rename-the-root-packagejson)
2. [Step 2 — Rewrite `CLAUDE.md` to describe the real project](#step-2--rewrite-claudemd-to-describe-the-real-project)
3. [Step 3 — Verify / clean the `examples` workspace entry](#step-3--verify--clean-the-examples-workspace-entry)
4. [Step 4 — Sweep tracked files for residual template references](#step-4--sweep-tracked-files-for-residual-template-references)
5. [Step 5 — Verify a clean `pnpm install`](#step-5--verify-a-clean-pnpm-install)

---

## TL;DR

Replace the template's fingerprints at the repo root — `package.json` named `@repo/package-template`, `CLAUDE.md` describing a generic template, and any residual `@repo/*` references — so the repo reads as the real project (a `@deessejs/type-testing` lib + a `apps/web` Next.js landing site + an `examples/` working set) and a fresh `pnpm install` runs without workspace warnings.

---

## Issue summary

The repo was forked from a generic pnpm + turbo template and still carries three artifacts that no longer match the real project: a root `package.json` named `@repo/package-template` with a template description; a `CLAUDE.md` describing a `@repo/example` / `@repo/package-name` template workflow; and a `pnpm-workspace.yaml` `examples` glob historically pointed at a non-existent directory. Acceptance criteria: rename the root package with an accurate description; rewrite `CLAUDE.md`; clean the workspace entry; remove all `@repo/package-template` / `@repo/package-name` / `@repo/example` references from tracked files; and `pnpm install` runs cleanly.

---

## Files to touch

| File | Action | Why |
|------|--------|-----|
| `package.json` (root) | edit | Rename `name` from `@repo/package-template` to a real monorepo root name and rewrite `description`. |
| `CLAUDE.md` | rewrite | The current 100% template narrative (`# Package Template`, `packages/example/`, `@repo/package-name`) is misleading for AI agents and humans alike. |
| `pnpm-workspace.yaml` | edit (or leave) | Re-verify the `examples` entry — see Step 3 for the call. |
| `pnpm-lock.yaml` | edit (regen) | Renaming the root package will shift lockfile metadata; `pnpm install --no-frozen-lockfile` to capture. |
| `examples/.gitkeep` | create (only if Step 3 makes `examples/` empty) | Belt-and-braces if the directory loses content. |
| `README.md` | review (no edit planned) | The "Add a new package" example block still references the template workflow; flag for follow-up if it's outside the issue's stated AC. |

---

## Step-by-step implementation

### Step 1 — Rename the root `package.json`

`package.json` (root)

- Change `name` from `@repo/package-template` to a real monorepo root name. The issue example is `deessejs-type-testing-monorepo`; that fits and avoids the scope-confusion risk of an `@deessejs/*` root (the published lib already owns the `@deessejs/type-testing` scope — the root should not look like a sibling package). Keep `"private": true`, `"version": "0.0.0"`.
- Rewrite `description` from `"TypeScript monorepo template with vitest, turbo, husky, and changesets"` to something factual like `"Monorepo root for the @deessejs/type-testing lib, apps/web landing site, and examples/."`.
- Leave `scripts`, `devDependencies`, `packageManager`, `engines`, and the `changesets` block untouched — they're all already correct for this repo. **`engines.node: ">=20"` must stay** (matches Node 20 CI matrix).
- **Why first:** the root name leaks into the lockfile and any process that reads the manifest; renaming first means subsequent steps don't operate against a stale label.

### Step 2 — Rewrite `CLAUDE.md` to describe the real project

`CLAUDE.md` — full rewrite

Replace the 143-line template narrative with a project-specific version that describes the actual shape of the repo:

- **Header / project shape**
  - One-paragraph framing: *"`@deessejs/type-testing` — a TypeScript monorepo. The published library lives at `packages/type-testing/`; the Next.js landing site lives at `apps/web/`; example test cases live at `examples/`. pnpm 9 workspaces, turbo 2, vitest, ESLint 9 (flat config), changesets for versioning."*
  - Real `## Project Structure` tree:
    ```
    .
    ├── packages/type-testing/    # @deessejs/type-testing — published lib (ESM)
    ├── apps/web/                # Next.js 16 landing site (private)
    ├── examples/                # @deessejs/type-testing-examples (private, demo cases)
    ├── docs/internal/           # Architecture, learnings, plans
    ├── .github/workflows/       # ci.yml + release.yml
    ├── turbo.json               # Turbo configuration
    ├── pnpm-workspace.yaml      # pnpm workspace config
    └── tsconfig.json            # Root TypeScript config
    ```
- **Development workflow** — keep the "Local development" bash block but adjust the "Add a new package" guidance: new packages go under `packages/<name>/` (the lib is published) or `apps/<name>/` (apps are private). Mention that `examples/` already exists and adding to it is a workspace decision, not a template default.
- **CI / hooks** — keep the existing `ci.yml` (`install → lint → typecheck → test`) and husky-driven pre-commit (`turbo lint` / `turbo typecheck` / `turbo test`) listing accurate to the workflow file.
- **GitHub Actions workflows** — drop the `pr-review.yml` paragraph: that workflow file was deleted as part of PR #12 (`docs:` chore) — the current `.github/workflows/` has only `ci.yml`, `coverage.yml`, `release.yml`. Reference only what is on disk.
- **Package structure** example — **drop the entire "Each package should have" JSON example block that contains `@repo/package-name`** (this is the line flagged at `CLAUDE.md:110` in the issue). Replace with a one-liner: *"Per-package `package.json` shape follows the published `@deessejs/type-testing` layout: see `packages/type-testing/package.json`."*
- **Notes** — keep the ESLint flat-config, tsconfig extends, turbo cache, changesets hints (all already correct).

**Order rationale:** CLAUDE.md is what AI agents load first; it should reflect reality before we touch workspace globs. Leaving a stale `CLAUDE.md` while we rename manifests gives a window where the doc and the code disagree on which is authoritative.

### Step 3 — Verify / clean the `examples` workspace entry

`pnpm-workspace.yaml`

- The issue body says the third entry `- "examples"` "points to a non-existent directory." That was true when the issue was filed. **The directory now exists** at the repo root with real content: `examples/{basic,complex,normal}/` full of TS demo files and `examples/package.json` declaring `@deessejs/type-testing-examples@0.0.0` (private). pnpm resolves the entry correctly today (see `pnpm install` output below in Step 5).
- Two equally valid outcomes — pick whichever the reviewer prefers; default to **keep the entry and add a one-line comment** so future readers know it's intentional:
  ```yaml
  packages:
    - "packages/*"
    - "apps/*"
    - "examples"   # @deessejs/type-testing-examples — demo cases for the lib
  ```
- The alternative (strip the entry, leave `examples/` as untracked junk) would lose the `examples` workspace from turborepo's view, which the existing `turbo build` output already enumerates.
- **Why this step is its own thing:** the issue's AC says "*no longer lists a missing examples entry*" — and the entry is no longer missing. Logging the decision (with a comment) closes the AC item without churn.

### Step 4 — Sweep tracked files for residual template references

Run from the repo root:

```bash
grep -rEn '@repo/(package-template|package-name|example)\b' \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.cjs' --include='*.mjs' \
  --include='*.json' --include='*.md' --include='*.yaml' --include='*.yml' \
  . 2>/dev/null | grep -v node_modules | grep -v '/dist/' | grep -v '\.turbo'
```

Expected hits **after** Steps 1 + 2:

- `package.json` — `name` was `@repo/package-template` → rewritten in Step 1. ✅
- `CLAUDE.md:110` — example package.json block contained `@repo/package-name` → rewritten in Step 2. ✅
- `.claude/agents/reviewer/README.md:72` — phrased as a description of the cleanup goal: *"`CLAUDE.md` describes the real packages… not a leftover 'package template' / `@repo/example` narrative."* This is **meta** — it documents the success criterion, not a leftover. **Leave it**, but consider tightening to `(@deessejs/type-testing, apps/web)` if a follow-up reviewer pass wants it.

Do **not** touch the matches in `docs/internal/learnings/{monorepo,eslint}/...`: those reference `@repo/eslint-config` and `@repo/tsconfig` as **examples of common monorepo patterns** the research surveyed, not template leftovers of this repo. They are out of scope for the AC's `@repo/{package-template,package-name,example}` filter.

If any hits remain after the rewrite, address them per-file — but the spec's stated grep should leave zero AC-violating matches.

### Step 5 — Verify a clean `pnpm install`

- Run `pnpm install --no-frozen-lockfile` from the repo root after Steps 1–4.
- Confirm:
  - No `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` or any "workspace globs matched 0 packages" warning.
  - `pnpm ls -r --depth=-1` enumerates exactly the three real workspaces: `@deessejs/type-testing`, `web`, `@deessejs/type-testing-examples`.
  - No template references in `.pnpm-store/...` (sanity, not a check).
- **Note on lockfile regeneration:** the root `package.json` `name` field is recorded in `pnpm-lock.yaml` under `importers.'.'.name`. After renaming, `pnpm install --no-frozen-lockfile` rewrites the importer block; committing the regenerated lockfile is part of the PR.

---

## Verification checklist

- [ ] `git grep -nE '@repo/(package-template|package-name|example)\b' -- ':!node_modules' ':!dist' ':!.turbo'` returns zero hits in tracked files.
- [ ] `cat package.json | jq -r .name` prints the new monorepo root name (not `@repo/package-template`).
- [ ] `cat package.json | jq -r .description` prints a real-project description (not the template one).
- [ ] `cat pnpm-workspace.yaml` shows a clean `packages:` list with the decided `examples` handling.
- [ ] `cat CLAUDE.md` opens on `# @deessejs/type-testing` (or equivalent) and describes `packages/type-testing/` + `apps/web/` + `examples/` — no `packages/example/`, no `Package Template`, no `@repo/package-name`.
- [ ] `pnpm install --no-frozen-lockfile` exits 0 with no workspace warnings.
- [ ] `pnpm turbo build` runs across the three real workspaces and exits 0.
- [ ] `pnpm turbo lint`, `pnpm turbo typecheck`, `pnpm turbo test` all pass.
- [ ] `pnpm-lock.yaml` is regenerated and committed.

---

## Risks / edge cases

- **Lockfile churn.** Renaming the root package rewrites the `importers.'.'` block in `pnpm-lock.yaml`. With `--no-frozen-lockfile` the diff is usually small (~ a dozen lines), but reviewers should expect the lockfile to appear in the PR. **Mitigation:** call this out explicitly in the PR description.
- **Renaming breaks `changesets/action` if it pinned on the old name.** `release.yml` doesn't reference the root package name; it calls `pnpm changeset publish` from each package, and the only published package is `@deessejs/type-testing` (its own name). **Mitigation:** none required, but verify by re-reading `release.yml` before merge — if it accidentally referenced `GITHUB_REPOSITORY` or a hard-coded root name, the release path could regress.
- **CLAUDE.md rewrite is broader than the AC.** The minimal fix is `sed 's/# Package Template/# @deessejs\/type-testing/'` plus a few one-line updates. Going wider (replacing the entire 143-line file) is more accurate but increases reviewer surface. **Mitigation:** Step 2 documents what gets removed vs. retained; reviewer can ask for the minimal version if they prefer.
- **`README.md` also has template-leftover flavor** ("Add a new package" block) but the issue's AC does not list `README.md` as in-scope. **Mitigation:** flag in the Risks section; do not touch in this PR; consider a separate issue for README accuracy.
- **`README.md` and `apps/web/landing-page` content is outside this issue.** Don't be tempted to refactor adjacent template-style text in those files during implementation — keep the diff narrow.
- **`@repo/eslint-config` and `@repo/tsconfig` references in learnings stay.** They are not part of the AC's three forbidden `@repo/*` substrings, and they are not template leftovers; they describe a common pattern. Reviewers can push back if they disagree.
- **The `pr-review.yml` paragraph in `CLAUDE.md` must NOT be carried over** even though it's just documentation. The workflow file does not exist on `main` (it was removed in PR #12). Carrying the paragraph forward would advertise a workflow that would silently 404 when referenced.

---

## PR metadata

| Field | Value |
|-------|-------|
| **Branch** | `impl/35-cleanup-root-template-leftovers` |
| **PR title** | `chore: cleanup root template leftovers` |
| **Labels** | `enhancement`, `area:docs`, `area:build` |
| **Assignee** | `martyy-code` |
| **Related issues** | #35 (this issue); possibly README accuracy as a follow-up |
| **No changeset** | Cleanup does not affect the published `@deessejs/type-testing` artifact — `CONTRIBUTING.md` explicitly states CI/docs/web-only changes don't need one. |
