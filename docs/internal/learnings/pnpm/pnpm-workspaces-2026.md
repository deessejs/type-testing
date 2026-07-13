# pnpm Workspaces — Senior Patterns (mid-2026)

> Learning note captured 2026-07-10 via the `researcher` agent. Sources: pnpm.io docs/blog, pnpm GitHub releases, syncpack.dev.
> Purpose: know modern pnpm workspace patterns and the upgrade landscape for `deessejs/type-testing` (currently `pnpm@9`, no code change yet).

## TL;DR

Keep `packages` as the only required workspace field; use **catalogs** to centralize shared external versions and `workspace:` for internal deps. **pnpm 10 (Jan 2025) is the mid-2026 sweet spot** for a Node-20 repo (security-by-default, `minimumReleaseAge`, `trustPolicy`); **pnpm 11 (Apr 2026) requires Node 22**. Clean up the phantom `examples` workspace entry.

## `pnpm-workspace.yaml`

- `packages` globs with `!` exclusions; root package always included. Prefer `packages/*` (single level) over `packages/**` (captures `dist/`, fixtures).
- **Non-existent entries don't fail install** — a glob matching nothing is silent noise. Lint in CI that each entry points to a real dir. (Our `examples` entry is exactly this.)
- Catalogs, settings and overrides live in their own top-level keys.

## Catalogs

- Purpose: single source of truth for versions → dedupe + fewer git conflicts across packages.
- Syntax: top-level `catalog:` (default) or `catalogs:` (named). Reference in `package.json` as `"react": "catalog:"` or `"react": "catalog:react18"`. Works for deps/devDeps/peerDeps/optionalDeps + `overrides`.
- **GA** since pnpm 9.x (named catalogs finalized in 9.5). At publish, `catalog:` is replaced by the real semver range (like `workspace:`).
- Settings (v10.12+): `catalogMode: manual | strict | prefer`; `cleanupUnusedCatalogs` (v10.15).
- `workspace:*` / `workspace:^` for internal deps; `catalog:` for external versions to keep consistent.

## pnpm 10 vs 11 (mid-2026)

- **pnpm 10.0 (Jan 7 2025)** — "Security by Default": lifecycle scripts (`preinstall`/`postinstall`) no longer run by default → allowlist via `pnpm.onlyBuiltDependencies`. SHA256 store, empty `public-hoist-pattern`.
  - `minimumReleaseAge` (v10.16, minutes) — block just-published versions; `minimumReleaseAgeExclude` for scopes/pins.
  - `trustPolicy: no-downgrade` (v10.21); `blockExoticSubdeps` (v10.26); `allowBuilds` map (v10.26) replaces `onlyBuiltDependencies`.
- **pnpm 11.0 (Apr 28 2026)** — Node 22+ required, pure ESM. SQLite store, `pnpm audit` → bulk advisories (`ignoreCves` → `ignoreGhsas`), `pnpm ci`, `pnpm sbom`, `pnpm peers check`, `registries`/`namedRegistries` in `pnpm-workspace.yaml` (replaces `.npmrc` `@scope:registry`), `packageConfigs` (per-package `.npmrc` replacement), `allowBuilds` mandatory. Codemod: `pnpx codemod run pnpm-v10-to-v11`.
- **Migration for this repo**: 9 → 10 keeps Node 20 and buys the security features cheaply. 9 → 11 forces Node 22 + `onlyBuiltDependencies`→`allowBuilds` + `.npmrc`→`pnpm-workspace.yaml` moves + `ignoreCves`→`ignoreGhsas`.

## Monorepo best practices

- Internal deps via `workspace:` protocol (`workspace:*`/`^`/`~`/relative). Keep `saveWorkspaceProtocol` at its rolling default — turning it off silently breaks the workspace link (you edit a package but the old one is used).
- `sharedWorkspaceLockfile: true` (default) → single root `pnpm-lock.yaml`.
- `publishConfig` (npm-standard) to override `registry`/`access` at publish.
- `-r` / `--filter <pkg>` / `--filter ...<pkg>` (deps) / `--filter ...^<pkg>` (dependents); `-F` short alias in v11. Use `failIfNoMatch: true` in CI.
- `node-linker`: keep `isolated` (default). `hoisted`/`shamefully-hoist` disable phantom-dep detection — use only for RN/Lambda/`bundledDependencies`.
- `.npmrc` in v11 only reads auth/registry — everything else (hoist, save-exact, node-linker) moves to `pnpm-workspace.yaml`.

## Dependency-hygiene tools

- `pnpm dedupe`, `pnpm outdated -r`, `pnpm audit` (`--fix=update` in v11).
- **`syncpack` v14 (Jun 2026)**: native pnpm-catalog support (auto-migrate literals → `catalog:`). (Note: a Rust rewrite is underway — check stability.)
- **`@manypkg/cli`**: `manypkg check` / `fix` for package.json consistency.
- `pnpm dlx` (ex `pnpx`) for one-off tools.

## Anti-patterns

- Overly broad `packages/**` globs.
- `shamefully-hoist: true` globally (masks phantom/peer bugs).
- Migrating 9 → 10 without listing build deps (breaks `postinstall`-dependent packages: esbuild, node-gyp).
- `saveWorkspaceProtocol: false` (breaks internal linking).
- `nodeLinker: hoisted` without a hard reason.
- Forgetting `.npmrc` settings must move to `pnpm-workspace.yaml` in v11; `npm_config_*` env → `pnpm_config_*`.

## Relevance to this repo

- On `pnpm@9` today → **target pnpm 10** (keeps Node 20; gains `minimumReleaseAge`, `blockExoticSubdeps`, `trustPolicy`, `allowBuilds`). Hold off on 11 until you move to Node 22.
- **Clean up the `examples` entry** in `pnpm-workspace.yaml` (phantom glob) — add a `.gitkeep`'d dir or remove the line.
- **Adopt `catalog:`** for shared versions (`typescript`, `vitest`, `react`) across lib + Next app; keep `workspace:^` for internal deps. `sherif`/`syncpack` can auto-migrate.

## Open questions / known bugs

- `dedupePeerDependents: true` cyclic peer bug (#11834, open mid-2026).
- No pnpm 12 / post-v11 roadmap found.

## Sources

- <https://pnpm.io/pnpm-workspace_yaml>
- <https://pnpm.io/catalogs>
- <https://pnpm.io/workspaces>
- <https://pnpm.io/settings>
- <https://github.com/pnpm/pnpm/releases/tag/v10.0.0>
- <https://pnpm.io/blog/releases/11.0>
- <https://pnpm.io/supply-chain-security>
- <https://syncpack.dev/version-groups/catalog/>
