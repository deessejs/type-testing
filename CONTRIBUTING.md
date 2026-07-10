# Contributing

Thank you for your interest in contributing to **@deessejs/type-testing**! This
guide covers everything you need to get a change merged.

By participating in this project you agree to abide by our
[Code of Conduct](./CODE_OF_CONDUCT.md).

## Prerequisites

- **Node.js >= 20**
- **pnpm 9** (`corepack enable` will pick up the `packageManager` field)

## Project structure

This is a pnpm + turbo monorepo:

- `packages/type-testing/` — the published library (`@deessejs/type-testing`)
- `apps/web/` — the landing site (Next.js)

## Development setup

```bash
# Install dependencies
pnpm install

# Enable husky git hooks
pnpm prepare
```

## Making a change

1. **Fork** the repository and create a feature branch off `main`.
2. Make your change in the relevant workspace (`packages/type-testing/src/...`).
3. **Add or update tests.** For type-level utilities, cover both directions:
   the passing case *and* the "should fail" case (e.g. with `@ts-expect-error`).
   A green test suite that never exercises a failure proves nothing.
4. Run the full check suite locally (see below).
5. **Add a changeset** if your change affects the published package (see
   [Changesets](#changesets)).
6. Open a pull request. The PR template will prompt you for a description, the
   type of change, and a checklist — please fill it in.

## Code quality

All checks must pass before a PR can be merged (they also run in CI and via the
pre-commit hook):

```bash
pnpm lint        # ESLint across all packages
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest
```

Run a single workspace's tests while iterating:

```bash
pnpm --filter @deessejs/type-testing test
```

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — a new feature
- `fix:` — a bug fix
- `docs:` — documentation only
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `test:` — adding or updating tests
- `chore:` — tooling, dependencies, or maintenance

## Changesets

Versioning and changelogs are managed by [changesets](https://github.com/changesets/changesets).
**If your change affects the published package, add a changeset:**

```bash
pnpm changeset add
```

Pick the appropriate semver bump (patch / minor / major) and write a short,
user-facing summary. Changes that don't affect the published output (CI, docs,
the web app) don't need one.

Maintainers handle the actual release: `pnpm release` bumps versions, and
pushing a `v*` tag triggers the release workflow which builds and publishes to
npm.

## Reporting bugs & requesting features

Please use the issue forms (Bug report / Feature request) rather than a blank
issue. For usage questions, open a
[Discussion](https://github.com/deessejs/type-testing/discussions) instead.
Security vulnerabilities should be reported privately — see
[SECURITY.md](./SECURITY.md).
