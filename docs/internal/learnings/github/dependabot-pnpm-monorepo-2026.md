# Dependabot in a pnpm Monorepo — Behavior, Pitfalls, Patterns (mid-2026)

> Learning note captured 2026-07-13 via the `researcher` agent. Sources: docs.github.com (dependabot options reference + how-tos).
> Purpose: what Dependabot actually does (and doesn't) in a pnpm-workspace monorepo, with the `.github/dependabot.yml` patterns that work here and the ones that silently generate duplicate PRs. No code change yet — config proposal only.

## TL;DR

In a pnpm monorepo, Dependabot's `npm` ecosystem **does not recursively walk `pnpm-workspace.yaml`** — it treats each entry of `directories` as the literal location of a `package.json`. So you **must** list each workspace (or use globs). The real cause of "I keep getting duplicate PRs for the same dependency" is **not** the `directories` list — it's that `groups` lack `group-by: dependency-name`. Without that flag, even a `production-dependencies` group opens **one PR per workspace** for each bumped dep. Add `group-by: dependency-name` to collapse them.

## 1. The mental model Dependabot uses

- Each `directory` (or matched glob under `directories`) is a root. Dependabot parses the `package.json` it finds there and updates the lockfile it finds there.
- The `npm` ecosystem is **not** pnpm-workspace-aware. It will not auto-discover `packages/*/package.json` from a single `directories: ["/"]` even though `pnpm-lock.yaml` lists every workspace.
- `directories` supports globs: `*` (single segment) and `**` (recursive). The singular `directory:` field does **not** accept globs.
- Glob expansion produces N roots — but `group-by: dependency-name` (inside `groups`) collapses them back into one PR per dep.

## 2. The duplication trap

### Symptom
For a dep that exists in both root and a workspace (e.g. `typescript` declared in `apps/web/package.json` and used transitively via the root lockfile), Dependabot opens:
- one PR scoped to `apps/web` that updates `apps/web/package.json` + `pnpm-lock.yaml`
- one PR from the `/` root that touches only `pnpm-lock.yaml` (or a root `package.json` it doesn't really need to touch)

Result: 2× PR per bump, lockfile conflicts between the two branches.

### Root cause
The config has `groups` (good — bundles minor/patch) but **no `group-by`** inside them:

```yaml
# ❌ generates dup PRs
production-dependencies:
  dependency-type: "production"
  update-types: ["minor", "patch"]
```

Per the docs, "if directories have incompatible version constraints for a dependency, Dependabot will create separate pull requests" — and absent `group-by`, the default is per-directory.

### Fix (one-line)
```yaml
# ✅ collapses to one PR per dep across workspaces
groups:
  production-dependencies:
    dependency-type: "production"
    update-types: ["minor", "patch"]
    group-by: dependency-name          # <-- the magic line
  development-dependencies:
    dependency-type: "development"
    update-types: ["minor", "patch"]
    group-by: dependency-name
```

## 3. Major-version strategy

The current `.github/dependabot.yml` left majors **ungrouped by design** ("Major bumps are intentionally left ungrouped so each gets its own reviewable PR"). That is the correct choice for a type-testing library — each TS/Vitest major is a reviewable event, not a churn item. Don't change it.

## 4. `versioning-strategy` — the hidden risk for **published** libs

`versioning-strategy: "increase"` rewrites `^1.0.0 → ^1.2.0` (caret stays, lower bound lifted). It is:
- **Fine for apps** (internal consumers, no published interface)
- **Risky for published libraries** — every bump narrows what `npm install` will resolve to, and `^1.2.0` published means downstream consumers see a narrower peer range over time

**For `packages/type-testing/` (the published `@deessejs/type-testing`) consider `auto`** (default), which widens ranges. The current "global `increase`" config is fine for `apps/web` but suspicious for the lib. Options to fix:
- Split the entry by `directory` (different `versioning-strategy` per workspace)
- Or rely on `ignore` patterns per published package

## 5. Auto-merge for the safe bumps

To avoid re-piling-up of grouped minor/patch PRs once `group-by` is in place:

**Repo pre-requisites**
- Settings → General → Pull Requests → **Allow auto-merge** = enabled
- Branch protection on `main` → **Require status checks to pass before merging**

**Workflow** (`.github/workflows/dependabot-auto-merge.yml`)
```yaml
name: Dependabot auto-merge
on: pull_request
permissions:
  contents: write
  pull-requests: write
jobs:
  dependabot:
    runs-on: ubuntu-latest
    if: github.event.pull_request.user.login == 'dependabot[bot]'
    steps:
      - uses: dependabot/fetch-metadata@d7267f607e9d3fb96fc2fbe83e0af444713e90b7
        id: metadata
      - run: gh pr merge --auto --merge "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        if: steps.metadata.outputs.update-type != 'version-update:semver-major'
```

Caveat from the docs: if `main` uses a **merge queue**, the built-in `GITHUB_TOKEN` cannot enqueue — use a PAT. This repo is not on a merge queue today, so the recipe applies as-is.

## 6. Recommended corrected `dependabot.yml` for this repo

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directories:
      - "/"
      - "/packages/*"
      - "/apps/*"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "Europe/Paris"
    open-pull-requests-limit: 10
    versioning-strategy: "increase"   # OK for the app; revisit for the lib (see §4)
    commit-message:
      prefix: "chore(deps)"
      prefix-development: "chore(deps-dev)"
      include: "scope"
    groups:
      production-dependencies:
        dependency-type: "production"
        update-types: ["minor", "patch"]
        group-by: dependency-name
      development-dependencies:
        dependency-type: "development"
        update-types: ["minor", "patch"]
        group-by: dependency-name
    # Majors left ungrouped by design — reviewable one at a time

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "Europe/Paris"
    open-pull-requests-limit: 5
    commit-message:
      prefix: "chore(ci)"
    groups:
      github-actions:
        patterns: ["*"]
```

## 7. Open-pulls-limit mechanics

`open-pull-requests-limit` (default 5) caps how many Dependabot PRs are open at once. If we hit the cap, Dependabot pauses opening new ones until some close — silently. So reducing noise via `group-by` matters not just for review hygiene but to stay under the cap.

## 8. Relevance to this repo (priorities)

1. **Immediate**: add `group-by: dependency-name` to both `groups` entries → next weekly run collapses the 17 duplicate "root" PRs already open into ~8.
2. **Immediate**: dry-run by commenting `@dependabot rebase` on one open dup PR (or merging the config change alone) to verify behavior before applying auto-merge.
3. **Soon**: enable `Allow auto-merge` + add the auto-merge workflow above, gated on `update-type != 'version-update:semver-major'`.
4. **Soon**: clean up current pile manually — `apps/web` PRs first (the actual bumps), then close the root dup PRs since the workspace PRs regenerate the lockfile correctly.
5. **Higher leverage for the lib** (`packages/type-testing/`):
   - For majors there (TypeScript 5→7, Vitest 2→4), do **not** just merge the Dependabot PR — apply the diff on a feature branch, run `pnpm test` + `pnpm typecheck` + `pnpm build`, then merge only if the type-level tests pass.
   - Switch the published lib to `versioning-strategy: "auto"` (or per-workspace override) so the declared ranges don't shrink over time.

## Gaps / caveats

- **Confidence: medium** — the interaction between `group-by: dependency-name` and `dependabot/fetch-metadata`'s `update-type` output for PRs that span multiple directories is not explicitly documented. Worth one real-world observation round before relying on auto-merge to gate majors out.
- **Confidence: high** — no canonical "GitHub-recommended pnpm monorepo" recipe exists in the docs; the patterns above come from general "Defining multiple locations for manifest files" examples.
- **Confidence: high** — `@types/*` and pure type packages are handled identically to runtime deps by Dependabot; `versioning-strategy` affects them the same way.

## Sources

- <https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference> (sections: `directories`, `groups`, `group-by`, `versioning-strategy`)
- <https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/controlling-dependencies-updated> ("Defining multiple locations for manifest files", `ignore`/`allow`)
- <https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/customizing-dependency-updates> (group syntax)
- <https://docs.github.com/en/code-security/dependabot/working-with-dependabot/automating-dependabot-with-github-actions> ("Enabling automerge on a pull request" with `dependabot/fetch-metadata` + `gh pr merge --auto` recipe, plus the merge-queue caveat)
