# Turborepo — Senior Patterns (mid-2026)

> Learning note captured 2026-07-10 via the `researcher` agent. Sources: turborepo.dev docs, Vercel/Turborepo blog, vercel/turborepo GitHub.
> Version window: Turborepo 2.3 (Nov 2024) → 2.10.x (Jul 2026).
> Purpose: know what a modern `turbo.json` looks like and what we could adopt in `deessejs/type-testing` (no code change yet).

## TL;DR

`tasks` (not `pipeline`), split every atomic action into its own task, use a **Transit Node** so `typecheck` runs in parallel with `build` while keeping cache invalidation correct, declare `outputs`/`env` properly, keep `.turbo/` gitignored, and use `turbo run` (not `turbo`) in CI. Boundaries, `turbo watch`, `--affected`, and Package Configurations are the newer senior tools.

## `turbo.json` schema (modern)

- Top-level: `tasks` (ex-`pipeline`, still back-compat but deprecated), `extends`, `globalDependencies`, `globalEnv`, `globalPassThroughEnv`.
- `$schema` → prefer `./node_modules/turbo/schema.json` (versioned with the installed turbo). `turbo.jsonc` supports comments (2.5, Apr 2025).
- Per task: `dependsOn`, `inputs`, `outputs`, `cache`, `persistent`, `interruptible`, `interactive`, `env`, `passThroughEnv`, `with`, `outputLogs`, `dotEnv`, `extends: false`.
- `dependsOn` microsyntax: `^task` (deps), `task` (same package), `pkg#task`, `//#task` (root).
- `inputs`: use `$TURBO_DEFAULT$` to keep git-tracked defaults; `$TURBO_ROOT$` (2.5) replaces `../../` to reach workspace-root files.
- `outputs`: e.g. `dist/**`, `.next/**` with negations `!.next/cache/**`, `!.next/dev/**`.
- `env` affects the hash; `passThroughEnv` is runtime-only (no hash impact). Wildcards `PREFIX_*` and negations `!FOO_*` supported. Framework Inference auto-adds `NEXT_PUBLIC_*`, `VITE_*`, etc.
- `outputLogs`: `full` (default), `hash-only`, `new-only`, `errors-only`, `none`.

## What changed 2025-2026

- **Boundaries** (experimental, 2.4 Jan 2025): flags imports outside a package dir + undeclared deps; optional tags with `allow`/`deny` rules. A senior way to lock down that `type-testing` isn't imported by unauthorized packages.
- **Package Configurations**: a `turbo.json` per package with `{ "extends": ["//"] }`. Scalars inherited; arrays replaced by default — use `$TURBO_EXTENDS$` first in a list to append. `extends: false` to exclude a task.
- **`turbo.jsonc`**, **`$TURBO_ROOT$`**, **`with`** (sidecar persistent tasks) — all 2.5 (Apr 2025).
- **Watch Mode** (`turbo watch`, experimental cache behind `--experimental-write-cache`); `interruptible: true` for restartable persistent tasks.
- **`--affected`**: only packages changed vs the branch base; auto-detects `GITHUB_BASE_REF` on PRs. **Requires deep git history** in CI (shallow clone → everything looks affected).
- **`turbo query` / `turbo query affected`**: JSON output for CI scripting.
- **Microfrontends (zones)** GA 2.6 (Oct 2025); **Bun** stable 2.6; **Cargo workspaces** in progress (2.10 canary).
- Roadmap 3.0 removes `--no-cache`, `--remote-only`, `--parallel`, `--daemon`.

## Caching

- Signature = global hash (root `package.json`, lockfile, `globalDependencies`, `globalEnv`, `turbo.json`) + task hash (`inputs` + task `env` + script + `outputs`).
- Local cache in `.turbo/cache` — **must be gitignored**.
- Remote Cache: Vercel (free) via `TURBO_TOKEN` + `TURBO_TEAM`; self-hostable (open OpenAPI spec, 2.5). `--cache=local:rw,remote:r` replaces `--no-cache`/`--remote-only`.
- CI: install `turbo` pinned to the major in `package.json`; call `turbo run …` (not `turbo …`).
- `--summarize` writes `.turbo/runs/<id>.json` — diff two runs to debug cache misses.

## Anti-patterns (from the official gotchas)

- Root scripts that bypass `turbo run` (no cache/parallelism); chaining with `&&` instead of a task graph.
- `globalDependencies` too broad (invalidates everything).
- Forgetting `^` in `dependsOn` (looks in the same package).
- Forgetting `outputs` on file-producing tasks (nothing cached) — omitting is only OK for stdout-only tasks.
- Forgetting `persistent: true` on `dev`/`start` (dependents block).
- Forgetting `cache: false` on side-effecting tasks (`deploy`, `publish`).
- Overriding default `inputs` without `$TURBO_DEFAULT$` (false cache hits).
- Shallow clone + `--affected` in CI.

## Relevance to this repo

- Scripts already align (build/dev/lint/typecheck/test/test:coverage/clean).
- **Adopt a Transit Node for `typecheck`** so it parallelizes with `build` yet stays sensitive to dependency source changes.
- **Verify `.turbo/` is gitignored** and CI installs a pinned `turbo` + uses `turbo run`.
- **Consider Remote Cache** (`TURBO_TOKEN`/`TURBO_TEAM`) + `--affected` on PRs.
- **Boundaries** later to enforce import rules once more packages exist.
- Strict env mode matters for the published lib (an undeclared `PUBLISH_TOKEN`/registry var would cause a bad cache hit).

## Open questions

- Exact inheritance precedence across chained Package Configurations.
- Vercel Remote Cache pricing/limits in 2026 (not verified).

## Sources

- <https://turborepo.dev/docs/reference/configuration>
- <https://turborepo.dev/docs/crafting-your-repository/configuring-tasks>
- <https://turborepo.dev/docs/reference/boundaries>
- <https://turborepo.dev/docs/reference/package-configurations>
- <https://turborepo.dev/docs/reference/run>
- <https://turborepo.dev/docs/guides/ci-vendors/github-actions>
