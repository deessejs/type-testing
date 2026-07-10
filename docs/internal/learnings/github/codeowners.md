# CODEOWNERS — How It Works

> Learning note captured 2026-07-10. Source: GitHub official docs (`docs.github.com`), via the `researcher` agent.
> Purpose: understand the mechanism before adding a `CODEOWNERS` file to `deessejs/type-testing` (no CODEOWNERS exists yet).

## TL;DR

A `CODEOWNERS` file maps path patterns to owners (users, teams, or emails) who are automatically requested for review on matching PRs. Combined with "Require review from Code Owners" branch protection, it enforces owner approval before merge. **Last matching pattern wins** — order matters.

## 1. Location & format

- Valid locations: `.github/`, repo root, or `docs/`. GitHub searches them in that order and uses the **first** file found.
- Evaluated against the **base branch** of the PR.
- One line = one gitignore-style pattern + one or more owners, separated by a space.
- Comments start with `#` (inline comments supported).
- **Precedence: the last matching pattern takes priority** (last match wins).

## 2. Who can be an owner

- `@username`, `@org/team-name`, or an email attached to a GitHub account.
- Emails do **not** work with managed user accounts (EMU).
- Every owner (user or team) must have **explicit write access** to the repo — even if team members already have individual access. Teams must be **visible** in the org.
- Without an organization, only `@username` and email work (no `@org/team`).

## 3. Branch protection & reviews

- The "Require review from Code Owners" rule (branch protection rules or rulesets) requires an approving review from a listed owner before merge.
- **A single approval from any one of the listed owners is enough** (not all of them).
- Code owners are **auto-requested for review** when a PR opens — **not** on draft PRs; they're notified when it moves to ready-for-review.
- If a listed user/team doesn't exist or lacks access, **no owner is assigned — silently**.
- To protect the CODEOWNERS file itself: add `/.github/CODEOWNERS @owner` or `/.github/ @owner`.

## 4. Supported patterns & limits

Gitignore-style patterns:

| Pattern | Matches |
|---|---|
| `*` | any file (wildcard within a segment) |
| `**` | recursively across segments |
| `/build/logs/` | root folder only (leading slash) |
| `apps/` | any `apps` directory anywhere in the repo |
| `**/logs` | any `logs` directory at any depth |
| `*.ts` | files by extension |

**NOT supported** (unlike gitignore):
- Negation with `!` — does not work.
- Escaping a leading `#` with `\` — does not work.
- Character ranges with `[ ]` — do not work.
- Paths are **case-sensitive**.

Because there's no negation, you can't exclude a subfolder from a broad pattern directly — **override it with a more specific rule below** (an empty owner = "anyone can merge", or a different owner via last-match precedence).

## 5. Gotchas & limits

- File must be **under 3 MB**. Above that it is **not loaded at all** — no ownership shown, no owners notified. Consolidate with wildcards.
- Any line with invalid syntax is **silently ignored**. Errors surface in the UI when viewing the file, and via the REST API: `GET /repos/{owner}/{repo}/codeowners/errors`.
- **Forks**: the PR uses the base branch's CODEOWNERS. If the base is upstream, upstream's file applies; if the base is the fork, the fork's file applies — but only triggers reviews if those owners have explicit write access on the fork.
- No documented difference in behavior by repo visibility or plan for CODEOWNERS itself. Related features (teams, branch protection rules) are the org-level constraints.

## Applying this to `type-testing`

- Place the file at `.github/CODEOWNERS` (standard location) and self-protect with `/.github/ @owner`.
- Per-package ownership in the monorepo: `packages/*/ @owner`, `apps/web/ @owner`.
- Validate syntax in CI via the `codeowners/errors` REST endpoint to catch silently-ignored lines.
- Remember: owners need explicit write access, and a Code Owners branch-protection rule is what actually *enforces* review — the file alone only auto-requests reviewers.

## Open questions / not found

- No specifics on GitHub Enterprise vs Free/Team behavior (beyond EMU disallowing emails).
- No documented max number of patterns/lines (only the 3 MB total-size limit).
- No confirmation of a cache/delay between editing CODEOWNERS and it taking effect on open PRs.

## Sources

- <https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners>
