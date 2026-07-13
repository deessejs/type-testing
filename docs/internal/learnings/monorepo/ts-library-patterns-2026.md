# TS Library Monorepo Architecture — Senior Patterns (mid-2026)

> Learning note captured 2026-07-10 via the `researcher` agent. Sources: TypeScript handbook, docs.npmjs.com, changesets, tool docs.
> Purpose: cross-cutting build/publish/release/CI/hygiene patterns for `@deessejs/type-testing` beyond turbo/eslint/pnpm (no code change yet).

## TL;DR

For a "pure types + a few runtime guards" library, **`tsc -b` is enough** — no bundler needed. The high-ROI additions are: validate packaging with **`publint` + `attw`**, adopt **npm Trusted Publishing (OIDC)** to drop `NPM_TOKEN`, and add **`knip` + `sherif`** for hygiene. Keep `moduleResolution: nodenext` on the lib, `bundler` on the Next app.

## 1. Library build

- **`tsc` alone** suffices when output is ~1:1 JS (typical for type libs); it loses tree-shaking/bundling/minification.
- Bundlers (only if the lib grows assets/deps to tree-shake): **tsdown** (Oxc + Rolldown, integrates `publint`+`attw` as lint), **bunup** (Bun-native, easy dual ESM/CJS + `--exports`), **unbuild** (unjs), **tsup** (now "legacy"; official tsup→tsdown migration exists).
- **ESM-only** is the 2025-2026 default for new libs (Node ≥20, Bun, Deno, edge). Dual ESM/CJS only if a CJS bundler must consume it.
- **`exports` map**: conditioned form with `"types"` **before** `"import"`/`"require"` (attw flags inversions).
- **`publint`** validates `package.json`/`exports`/`files`/`main`/`types`. **`@arethetypeswrong/cli` (attw)** resolves types against node16/nodenext/bundler and catches "types-only exports vanishing in CJS", missing defaults, bad module syntax. → **Add both as CI jobs** to guard the existing packaging (would have caught the missing `.js` import in `special.ts`).

## 2. TypeScript / tsconfig in a monorepo

- **Project references** (`composite: true`, `references`, `tsc -b`): incremental builds, load `.d.ts` of referenced projects instead of re-reading `.ts`. Solution `tsconfig.json` at root with `files: []` + `references`, shared `compilerOptions` via `extends`.
- **`moduleResolution`**: `nodenext` (or the new stable `node20` from TS 5.9) for the **lib** (matches the runtime); `bundler` only for the **bundled app**.
- Shared base tsconfig as a private `@repo/tsconfig` workspace package (`workspace:*`).
- **`verbatimModuleSyntax: true`** (default in TS 5.9 `tsc --init`): forces `import type`, avoids tree-shaking bugs, preps ESM output.
- For this repo: `tsc -b` + one composite tsconfig per package is enough; no bundler until there are assets/deps to bundle.

## 3. Release with changesets

- `@changesets/cli` v3 + `changesets/action` (v1.9.0 stable on `maintenance/v1`; v2 in dev on main).
- **npm Trusted Publishing (OIDC)** — GA 2025-07-31: no `NPM_TOKEN`, short-lived OIDC tokens. Workflow needs `permissions: { id-token: write, contents: write }` + `NPM_CONFIG_PROVENANCE: true`. Requires npm CLI ≥11.5.1 + Node ≥22.14 in the release job; **self-hosted runners unsupported**; 1 trusted publisher per package.
- **`--provenance`** automatic when publishing via trusted publishing from GitHub Actions on a public repo.
- **Snapshot releases**: `changeset version --snapshot <tag>` → `0.0.0-<tag>-<timestamp>`; publish with `changeset publish --tag <tag>` (never plain — would hit `latest`). Don't merge the snapshot commit.
- **Pre-releases**: `changeset pre enter/exit` for alpha/beta/rc trains.
- `createGithubReleases: true` (default) generates GitHub Releases on publish.

## 4. CI (GitHub Actions)

- pnpm cache via `actions/setup-node` (`cache: 'pnpm'`) + `pnpm/action-setup`.
- Turbo remote cache: `TURBO_TOKEN` (secret) + `TURBO_TEAM` (variable). Fallback: `actions/cache@v4` on `.turbo/`.
- `turbo run build --affected` on PRs (needs deep git history); or rely on a warm remote cache.
- Split jobs for Node matrix (20/22/24) + billing; `concurrency: ${{ github.workflow }}-${{ github.ref }}`; `fetch-depth: 2` so changesets/turbo see the previous commit.

## 5. Hygiene / quality

- **`knip`** — dead files/exports/deps via static analysis, native pnpm-workspace + Next/Vitest/Turbo plugins. Very high ROI on a monorepo. (Adopted by Vercel, TanStack, Microsoft.)
- **`sherif`** — zero-dep version-consistency check (misplaced `@types/*`, out-of-sync `next`/`eslint-config-next`, inconsistent versions), `--fix`. Prefer over `syncpack` (Rust rewrite in progress).
- **`publint` + `attw`** — see §1.
- **commitlint + conventional commits** (`@commitlint/config-conventional` + Husky `commit-msg`) as a layer over changesets.
- **Husky + lint-staged** (`eslint --fix` + `prettier --write` on staged files).
- **`.editorconfig`** — expected of any serious OSS lib.
- Renovate (config-as-code, monorepo-aware, groups) vs Dependabot (already set up here).

## 6. Notable 2025-2026

- **TS 5.9** (Jul 2025): stable `--module node20`, minimal prescriptive `tsc --init` (`verbatimModuleSyntax`, `noUncheckedSideEffectImports`, `exactOptionalPropertyTypes`), instantiation cache (big wins on type-heavy libs).
- **npm Trusted Publishing OIDC** GA (Jul 2025), "allowed actions" + staged publish (May 2026).
- **tsdown/bunup** redefined lib bundling ahead of tsup.
- **knip** v5+ framework auto-detection.

## Relevance to this repo (priorities)

1. **High**: add `publint` + `attw` CI jobs to validate the existing `exports` map (`.`/`./vitest`/`./vitest/setup`).
2. **High**: migrate `release.yml` to npm Trusted Publishing OIDC (drop `NPM_TOKEN`, auto provenance; bump the release job to Node 22).
3. **Medium**: add `knip` (audit `apps/web` bloat) and `sherif` (version consistency) as fast CI checks.
4. Ensure `verbatimModuleSyntax` is on in the lib tsconfig; keep `nodenext` on the lib, `bundler` on the app.
5. **Do NOT** swap `tsc` for a bundler yet — unnecessary for a pure-types + guards lib.

## Gaps / caveats

- Bundler benchmarks are vendor-declared (low confidence on the real perf hierarchy).
- `changesets/action` v2 GA date unclear (v1.9.0 is prod).
- syncpack Rust-rewrite stable date unknown.

## Sources

- <https://www.typescriptlang.org/docs/handbook/project-references>
- <https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html>
- <https://arethetypeswrong.github.io/>
- <https://docs.npmjs.com/trusted-publishers/>
- <https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/>
- <https://github.com/changesets/action>
- <https://knip.dev/>
- <https://www.tengis.dev/blog/monorepo-dependencies-sherif>
- <https://tsdown.dev/>
