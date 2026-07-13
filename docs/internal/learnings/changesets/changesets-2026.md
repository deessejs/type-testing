# Changesets — Status, Versions, and Migration Path (mid-2026)

> Learning note captured 2026-07-13 via the `researcher` agent. Sources: GitHub changelogs, releases, issues, and docs.
> Purpose: current state of the changesets ecosystem for `@deessejs/type-testing`, what to upgrade, what to defer, and what to prepare for.

## TL;DR

**v2 stable + `changesets/action@v1` = production safe today.** v3 CLI and Action v2 are in prerelease (`3.0.0-next.*` / `2.0.0-next.*`) — do not use in prod unless explicitly testing. The current setup (`@changesets/cli@2.27.0`) is outdated in the v2 series but functional. The immediate action is: bump `@changesets/cli` to latest v2, keep `changesets/action@v1`, configure npm Trusted Publishing via the workflow, and plan the pnpm 10 → v3 migration for later.

## 1. Current version status

| Package | Current in this repo | Latest stable | Status |
|---|---|---|---|
| `@changesets/cli` | `2.27.0` | v2 latest patch | **Outdated in v2** — v3 is prerelease only |
| `changesets/action` | (in `release.yml`) | `v1.9.0` | **v1 is stable; v2 is prerelease** |

**v3 CLI is NOT GA.** Published as `3.0.0-next.*` (latest observed: `3.0.0-next.6`). The v3 plan ([#1945](https://github.com/changesets/changesets/issues/1945)) still has open tasks. Do not use `3.0.0-next.*` in production without explicit testing.

**Action v2 is NOT GA.** The README on `main` shows `changesets/action@v2` examples but the Latest release is still `v1.9.0`. `v2.0.0-next.*` is prerelease. Stay on `v1` until both v3 CLI and v2 action are marked stable.

## 2. What changed recently (v2 patch releases)

### `@changesets/cli` v2 recent

The changelog is large; key recent additions in the v2 series:
- `changeset version --snapshot [tag]` syntax confirmed stable (unchanged in v3 from v2)
- `changeset publish-plan` (new in `3.0.0-next.*`, not yet in v2)

### `changesets/action` v1 recent (v1.6.0 → v1.9.0)

| Version | Notable changes |
|---|---|
| `v1.9.0` | Added sub-actions `pr-comment` and `pr-status`; fixed GitHub Release creation when some packages fail to publish; improved custom version/publish command handling; better force-push behavior in `github-api` mode |
| `v1.8.0` | Version PRs now created as drafts |
| `v1.7.0` | Fixed `.npmrc` generation to not write an `undefined` token when using npm Trusted Publishing; `GITHUB_TOKEN` handling improvements |
| `v1.6.0` | Internal runtime migrated to Node 24 |

**Immediate action**: pin `changesets/action` to `v1.9.0` (or its SHA) rather than `v1` floating — the `v1.7.0` fix for Trusted Publishing is directly relevant here.

## 3. npm Trusted Publishing / OIDC

**How it works with changesets**: not a changesets-native feature — it is configured in npm (register the GitHub Actions workflow as a trusted publisher) and in the workflow file (`permissions: id-token: write`). Changesets does not have a `--provenance` flag; the `--provenance` flag goes to `npm publish` directly.

**Setup for this repo** (`release.yml`):

1. Register the GitHub Actions workflow as a trusted publisher on npm for `@deessejs/type-testing`
2. In the release job: `permissions: { id-token: write, contents: write }` + `NPM_CONFIG_PROVENANCE: true`
3. Remove `NPM_TOKEN` from secrets once validated
4. `v1.7.0` of the action fixed the `.npmrc` generation bug that wrote `undefined` tokens for OIDC — ensure the action is at `v1.7.0+`

**Note**: npm CLI ≥ 11.5.1 + Node ≥ 22.14 in the release job is required for OIDC. Verify the current `release.yml` uses a compatible runtime.

## 4. Snapshot releases

Syntax unchanged from docs:
```bash
changeset version --snapshot [tag]   # e.g. --snapshot canary
changeset publish --tag canary       # --no-git-tag for CI-only without tags
```

## 5. v3 CLI breaking changes (preparation, not action)

When v3 CLI goes GA, these are the breaking changes to handle:

- **pnpm minimum: `>=10.0.0`** — current repo uses `pnpm@9.0.0`. Must bump first before touching CLI v3.
- **npm minimum: `>=10.9.0`**
- **Yarn minimum: `>=4.5.2`**
- **New interactive CLI**: `@clack/prompts`-based UI (non-breaking for CI-only usage)
- **`@manypkg/get-packages` v3** — internal dep upgrade
- **Prettier decoupled**: if you run `changeset version` with a custom Prettier setup, check the output
- **Default exports deprecated**: prefer named exports in programmatic usage
- **CLI parsing refactored**: any scripts that call `changesets` programmatically may need updates

**Migration steps when v3 goes GA**:
1. Bump pnpm to 10+ (separate PR, test build/test first)
2. Pin `changesets/action` to `v2.x` stable
3. Check `cwd` usage in the workflow (removed in Action v2)
4. Rename action inputs: `publish` → `publish-script`, `version` → `version-script` (kebab-case in Action v2)
5. Check custom `version`/`publish` scripts for named-export compatibility

## 6. `changeset publish-plan` (v3, not yet in v2)

New in `3.0.0-next.6`: `changeset publish-plan` outputs a JSON plan of what would be published or tagged. Useful for:
- Auditing that only `packages/type-testing/` would be published (excluding `apps/web` which is `"private": true`)
- CI gating: fail if unexpected packages appear in the plan

This is a v3 feature. Once v3 is stable, it would be a good addition to the release workflow.

## 7. Relevance to this repo (priorities)

1. **High (now)**: Bump `@changesets/cli` to latest v2 patch — low risk, keeps you current in the stable series.
2. **High (now)**: Pin `changesets/action` to `v1.9.0` in `release.yml`.
3. **High (now)**: Verify `release.yml` runtime uses Node 22+ for OIDC support; add `id-token: write` + `NPM_CONFIG_PROVENANCE` if not present; remove `NPM_TOKEN` once OIDC is validated.
4. **Medium (now)**: Check if the action still uses `cwd` (deprecated in v2) — currently v1, so OK, but note the deprecation.
5. **Deferred**: Plan pnpm 9 → 10 upgrade before v3 migration.
6. **Deferred**: Track v3 GA and action v2 stabilization; prepare migration branch.

## Gaps / caveats

- Latest v2 patch version number not isolated from the changelog — recommend checking `npm view @changesets/cli version` to confirm.
- No official v2 → v3 migration guide exists yet — track [#1945](https://github.com/changesets/changesets/issues/1945) for when it drops.
- OIDC provenance may become automatic in future npm versions without the `--provenance` flag; monitor.

## Sources

- <https://github.com/changesets/changesets/issues/1945> — v3 plan and status
- <https://github.com/changesets/changesets/blob/main/packages/cli/CHANGELOG.md>
- <https://github.com/changesets/action/releases> — action releases (v1.6.0 through v1.9.0)
- <https://github.com/changesets/action/blob/main/README.md>
- <https://github.com/changesets/changesets/blob/main/docs/snapshot-releases.md>
- <https://docs.github.com/en/actions/tutorials/publish-packages/publish-nodejs-packages> — OIDC / Trusted Publishing
