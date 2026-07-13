---
name: create-issue
description: Create GitHub issues with type, Priority, Effort, and custom fields via the REST API. Use when asked to "create an issue", "file an issue", or "open an issue" for the project.
---

# `create-issue` Skill

Create GitHub issues with org-level `issue_type` and `issue_field_values` (Priority, Effort, etc.) via the REST API. Falls back to plain `gh issue create` if no structured fields are needed.

## When to use

Use this skill whenever the user asks to create an issue, file an issue, or open an issue. The skill decides whether a simple `gh issue create` suffices or whether `gh api` with structured fields is needed.

**Trigger phrases:** "create an issue", "file an issue", "open an issue", "add an issue", "create a ticket".

## How it works

### Step 1 — Resolve field IDs (once per org, cached in memory)

The org's `issue_field` IDs are not constant. On first use in a session:

```bash
gh api -H "X-GitHub-Api-Version: 2026-03-10" \
  "https://api.github.com/orgs/{org}/issue-fields"
```

Parse the response to build a map of `{ fieldName → { id, options: { optionName → id } } }`.

**Known gotcha (Windows/Git Bash):** URLs starting with `/` are rewritten as filesystem paths. **Always use the full URL** `https://api.github.com/…`.

### Step 2 — Create the issue

Use `gh issue create` for title, body, labels, and milestone (it handles Markdown rendering, @mention parsing, and label validation).

Then enrich it with `type` + `issue_field_values` via `PATCH`.

### Step 3 — Apply type + fields

`gh api` via `--input -` with a JSON body:

```bash
gh api -X PATCH "https://api.github.com/repos/{owner}/{repo}/issues/{n}" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  --input - <<EOF
{
  "type": "Task",
  "issue_field_values": [
    {"field_id": 43676415, "value": "Medium"},
    {"field_id": 43676418, "value": "Medium"}
  ]
}
EOF
```

**Known gotchas:**
- `-f` and `-F` do NOT work for `issue_field_values` (they send a string, not an array). **Must use `--input -` with a heredoc.**
- `value` for **single-select** fields is the **option name as a string** (e.g. `"Medium"`, `"High"`, `"Low"`). The numeric option ID (`76436510`) is **wrong** — the API rejects it with `"must be a string option name"`. Always use the text name, resolved from the GET above.
- `type` is a **string name** (e.g. `"Task"`, `"Bug"`, `"Feature"`), not an ID.
- Both `type` and `issue_field_values` can be set in the same PATCH call.

## Prompt the user for

Before creating, confirm:

1. **Title** — short, imperative, prefixed with conventional type (`feat:`, `fix:`, `chore:`, `ci:`, `refactor:`, `docs:`).
2. **Body** — structured with at minimum: Description, Why, Acceptance criteria (checkboxes), Related (links to PRs/docs), Risks (if any).
3. **Labels** — from the existing set only (`gh label list`). Do NOT create new labels unless asked.
4. **Type** — `Task`, `Bug`, or `Feature` (org-level, set via `type` in PATCH).
5. **Priority** — `Urgent`, `High`, `Medium`, or `Low` (option name, resolved from org fields via GET).
6. **Effort** — `High`, `Medium`, or `Low` (option name, resolved from org fields via GET).

If the user only provides a title, use reasonable defaults: `Task` / `Medium` / `Medium`.

## Repo context — `deessejs/type-testing`

### Org — `deessejs`

Repo: `github.com/deessejs/type-testing`

**Issue types** (set via `type` in PATCH, by name string):
- `Task` — a specific piece of work
- `Bug` — an unexpected problem or behavior
- `Feature` — a request, idea, or new functionality

**Issue fields** (numeric IDs, set via `issue_field_values`):

| Field | `field_id` | Options |
|---|---|---|
| Priority | `43676415` | Urgent=`76436508`, High=`76436509`, **Medium=`76436510`**, Low=`76436511` |
| Effort | `43676418` | **High=`76436512`**, **Medium=`76436513`**, Low=`76436514` |
| Start date | `43676416` | ISO date string |
| Target date | `43676417` | ISO date string |

### Labels available in this repo

Labels are **repo-level** (set via `--label` in `gh issue create`). Do NOT create new labels unless the user explicitly asks.

**area:\***
- `area:types` — Type utilities (Equal, IsAny, IsNever, …)
- `area:api` — Chainable API (check / assert / expect)
- `area:runtime` — Runtime type guards
- `area:vitest` — Vitest matchers & setup
- `area:web` — Landing site (apps/web)
- `area:docs` — README, JSDoc, docs
- `area:build` — Packaging, exports map, tsconfig
- `area:ci` — Workflows, dependabot, tooling

**status:\***
- `status:needs-triage` — Not yet triaged by a maintainer
- `status:needs-repro` — Waiting for a minimal reproduction
- `status:ready` — Triaged and accepted — ready to be picked up
- `status:in-progress` — Someone is working on it
- `status:blocked` — Blocked by an external dependency (TS, upstream)

**Cross-cutting**
- `breaking-change` — Changes the public API surface
- `dependencies` — Dependency updates (used by Dependabot)
- `github_actions`

**GitHub defaults (keep)**
`bug`, `enhancement`, `documentation`, `duplicate`, `invalid`, `question`, `wontfix`, `good first issue`, `help wanted`

### Templates available

Issue templates live in `.github/ISSUE_TEMPLATE/`:
- `1-bug-report.yml` — preflight checklist, area dropdown, TS/package versions, `render: ts` repro, labels: `bug`
- `2-feature-request.yml` — problem/solution/alternatives, labels: `enhancement`

The `config.yml` disables blank issues and redirects to Discussions. Do NOT create a blank issue; use the templates or the structured `gh api` flow.

### Templates preferred for this repo

When a user asks to create an issue, use this **structured format** (not a blank issue) — it is what contributors will see from the template picker:

- **Bug** → `1-bug-report.yml`
- **Feature request** → `2-feature-request.yml`
- **Anything else** → structured PATCH via `gh api` (see Step 3 above)

### CODEOWNERS

Global owners: `@codewizdave @martyy-code`
Applies to all paths. Branch protection "Require review from Code Owners" must be enabled on `main` for this to be enforced.

### Security / contact

Security vulnerabilities → GitHub Security Advisories (not a public issue).
Questions → GitHub Discussions (linked in `config.yml`).

## Output

After creation, confirm with a one-liner: issue number, title, type, Priority, Effort, and the URL.

## Constraints

- Do NOT use `-f` or `-F` for the `issue_field_values` array — use `--input -`.
- Do NOT shorten the URL (Windows `gh` bug — always use `https://api.github.com/…`).
- Do NOT use label names that don't exist — check `gh label list` first.
- The org must have Issue Fields enabled (GA since 2026-07-02). If the GET returns 404, report it to the user.
- Do NOT open blank issues — always use the template picker or the structured API flow.
