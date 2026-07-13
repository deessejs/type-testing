# ESLint in a TS Monorepo — State of the Art (mid-2026)

> Learning note captured 2026-07-10 via the `researcher` agent. Sources: eslint.org, typescript-eslint.io, nextjs.org, eslint.style.
> Snapshot: ESLint v10.6.0 (Jun 2026); **v9.x EOL 2026-08-06**.
> Purpose: know the modern flat-config setup and what to migrate in `deessejs/type-testing` (no code change yet).

## TL;DR

Flat config is the only game now. Start from `defineConfig()` + `globalIgnores()` (from `eslint/config`), use `typescript-eslint` v8 with `parserOptions.projectService: true`, share config as a `@repo/eslint-config` package. **Delete the leftover `.eslintrc.cjs`** — ESLint v10 removed eslintrc entirely, and v9 is EOL in August 2026.

## Flat config essentials

- File: `eslint.config.js|mjs|ts` (v10 supports `.ts` by default). Linter looks for `eslint.config.*`, not `.eslintrc.*`.
- Official helpers from `eslint/config` (Mar 2025, in v9.18+/v10):
  - `defineConfig([...])` — type-safe, flattens nested arrays, supports a per-block `extends` field.
  - `globalIgnores([...])` — unambiguous global ignores (vs a lone `{ ignores: [...] }`).
  - Backport: `@eslint/config-helpers`.
- typescript-eslint v8: `tseslint.configs.recommended | recommendedTypeChecked | strict | strictTypeChecked | stylistic | stylisticTypeChecked`.
- **`parserOptions.projectService: true`** is the recommended default: uses the TS Language Service, no need to list `tsconfig`s or a `tsconfig.eslint.json`, faster, matches the IDE.
  - If sticking with `parserOptions.project`: avoid broad globs `**/tsconfig.json` (perf); use `packages/*/tsconfig.json`. >~10 packages → documented OOM; the fix is `projectService`.

## eslintrc legacy — status

- ESLint v9 (Apr 2024): flat config default, eslintrc deprecated (`ESLINT_USE_FLAT_CONFIG=false` still worked with a warning).
- **ESLint v10 (Feb 2026): eslintrc removed entirely** — `LegacyESLint`/`FlatESLint` gone, `ESLINT_USE_FLAT_CONFIG` ignored, several `context.*` methods removed (use `context.languageOptions`, `context.sourceCode`, `context.filename`).
- Config lookup in v10 is **per linted file's directory** (not cwd) → multiple configs in one run.
- **Consequence for this repo**: the root `.eslintrc.cjs` is obsolete. Under v10 it's simply ignored. Remove it and migrate to `eslint.config.*`.

## Monorepo patterns

- Turborepo-recommended: a `@repo/eslint-config` package exporting `base.js`, `next.js`, etc.; each package's `eslint.config.js` imports and spreads it. Declare all ESLint deps inside that package.
- `extends` at block level (via `defineConfig`) resolves the historical "config shape" mess of plugins.
- Typed-linting perf: `projectService: true` reuses the TS service; the default single-run heuristic saves 10–20% in CI.

## Next.js integration

- **`next lint` removed in Next.js 16** — use `eslint .` directly (Next ships a codemod). The `eslint` option in `next.config` no longer has effect.
- `eslint-config-next` is flat-config-ready: `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`.
- Monorepo: `@next/eslint-plugin-next` accepts `settings.next.rootDir` when the app isn't at the repo root.

## 2025-2026 timeline

- v9.0.0 (Apr 2024): flat config default, dropped Node <18.18.
- v9.18+ (Mar 2025): `defineConfig`, `globalIgnores`, `extends` reintroduced.
- v10.0.0 (Feb 2026): eslintrc removed, per-file lookup, Node ≥20.19, bundled TS types (no more `@types/eslint`).
- typescript-eslint v8 (May 2024→): unified `tseslint.configs.*`, `projectService` happy path.
- Stylistic rules deprecated in core (v8.53, Oct 2023) and in typescript-eslint v8 → moved to `@stylistic/*` (`@stylistic/eslint-plugin` v4+, ESM + flat-config only). Keep `eslint-config-prettier/flat` **after** presets if using Prettier.

## Best practices / pitfalls

- Always start with `defineConfig(...)`; always use `globalIgnores(...)` for `dist`, `.next`, `node_modules`, `coverage`, `.turbo`.
- Prefer `projectService: true`; reserve `parserOptions.project` for edge cases; never use `**` globs there.
- Turbo: give the `lint` task `dependsOn: ["^lint"]` so it invalidates when `@repo/eslint-config` changes.
- v10 requires Node ≥20.19 / 22.13 / 24+ — check CI.

## Relevance to this repo (priorities)

1. **High**: remove the residual root `.eslintrc.cjs`, migrate to `eslint.config.*`.
2. **High**: plan the ESLint 9 → 10 upgrade (v9 EOL Aug 2026).
3. Extract a shared `packages/eslint-config` with `defineConfig`.
4. Use `parserOptions.projectService: true` for typed linting.
5. If Next is bumped to 16 in `apps/web`, drop `next lint`, switch to `eslint .`.

## Open questions

- Exact `eslint-config-next` compatibility with ESLint v10 (may need a bump).
- Next.js 16 release date / the app's current Next version (verify in `apps/web/package.json`).

## Sources

- <https://eslint.org/blog/2026/02/eslint-v10.0.0-released/>
- <https://eslint.org/blog/2025/03/flat-config-extends-define-config-global-ignores/>
- <https://typescript-eslint.io/getting-started/typed-linting>
- <https://typescript-eslint.io/packages/parser>
- <https://typescript-eslint.io/troubleshooting/typed-linting/monorepos/>
- <https://nextjs.org/docs/app/api-reference/config/eslint>
- <https://turborepo.dev/docs/guides/tools/eslint>
