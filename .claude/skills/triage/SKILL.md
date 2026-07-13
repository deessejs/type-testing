---
name: triage
description: Autonomously review and triage the issue backlog. Verify claims against the codebase, classify with type/area/status/Priority/Effort, update via the GitHub REST API, and post a comment. No user prompting — the agent decides based on triage conventions.
---

# `triage` Skill — Autonomous

Autonomously triage open issues: verify claims against the codebase, decide the triage action, apply metadata, and post a comment — without asking the user.

## When to use

**Trigger phrases:** "triage", "triage the backlog", "review open issues", "triage issues", "look at the open issues", "what needs triage", "triage #N".

**No user prompting.** The agent makes every decision independently.

## How it works — overview

```
1. Fetch open issues (filter out PRs)
2. Verify each issue against the codebase
3. Decide the triage action autonomously (§3)
4. Apply: PATCH → labels → idempotency check → comment
5. Next issue
```

## §1 — Fetch

Always filter out PRs — `GET /issues` returns both issues and PRs.

```bash
# Group 1: needs-triage
gh api --paginate \
  "https://api.github.com/repos/deessejs/type-testing/issues?state=open&per_page=15&labels=status:needs-triage&sort=created&direction=asc" \
  --jq '.[] | select(.pull_request == null)'

# Group 2: never triaged (no status:* label)
gh api --paginate \
  "https://api.github.com/repos/deessejs/type-testing/issues?state=open&per_page=10&sort=created&direction=asc" \
  --jq '.[] | select(.pull_request == null and (.labels | map(.name) | . + [""] | index("status:") | not)'

# Group 3: needs-repro (re-visit these if there's new activity)
gh api --paginate \
  "https://api.github.com/repos/deessejs/type-testing/issues?state=open&per_page=10&labels=status:needs-repro&sort=updated&direction=asc" \
  --jq '.[] | select(.pull_request == null)'
```

Process Group 1 first, then Group 2, then Group 3. Cap at 10 per run.

## §2 — Verify against the codebase

This step is mandatory for every issue before deciding. Read the actual code.

Use `Grep`, `Read`, `Glob` (read-only). Focus on:

| Issue type | What to verify |
|---|---|
| Bug | Trace the type/function against the claimed inputs. Run `pnpm --filter @deessejs/type-testing test` to confirm behavior. |
| Feature | Search `src/` for an existing implementation. Check the `exports` map. |
| How-to / question | Find relevant examples in README, tests, docs. |
| Every issue | Run `gh search issues` to find duplicates. |

Output a one-line finding per issue: `CONFIRMED` / `FALSE` / `PARTIAL` / `NOT FOUND`.

## §3 — Decide autonomously

The agent decides based on verification findings + triage conventions. No prompting.

### Decision rules

| Finding | Action |
|---|---|
| Bug confirmed in code | `type: Bug`, `status: ready`, `Priority: High` or `Medium`, `Effort` from estimate |
| Bug claim FALSE — expected behavior | Close as `not planned`, comment explains what the code actually does |
| Feature already exists | Close as `not planned`, link to the existing API + source file |
| Feature not yet implemented, in scope | `type: Feature`, `status: ready`, `Effort` from estimate |
| Feature out of scope | Close as `not planned`, explain why |
| Bug without reproduction | `status: needs-repro`, comment asks for a minimal repro |
| Blocked by external dependency | `status: blocked`, comment names the blocker |
| Type question / how-to | Close as `not planned`, redirect to Discussions |
| Duplicate of #N | Close as `duplicate`, link to #N |
| Already triaged (triage marker found) | Skip silently |

### Assignees

- Assign to the agent's actor (the logged-in gh user) for `status: ready` / `status: in-progress`.
- Do not assign for `needs-repro`, `blocked`, or closes.
- For external contributors: do not assign — leave it open for them to self-assign.

### Priority / Effort defaults

Use the verification findings to inform the estimate:

| Severity of finding | Priority | Effort |
|---|---|---|
| Real bug, affects published API | `High` | `High` |
| Real bug, DX only | `Medium` | `Low` |
| Feature, straightforward | `Medium` | `Low` |
| Feature, significant work | `Medium` | `High` |
| Maintenance / hygiene | `Low` | `Low` |

### External contributors

Use a warmer tone in comments for authors ≠ `@codewizdave` / `@martyy-code`. Be explicit about what the code check found so they learn something.

## §4 — Apply

One issue at a time. Never parallelize.

### Before starting — set up the reaction helper

Create this gh alias once (not per issue):

```bash
gh alias set issue-react 'api --silent --method POST -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2026-03-10" /repos/deessejs/type-testing/issues/$1/reactions -f content=$2' --local
```

This makes `gh issue-react {n} {reaction}` work like a native command.

Reaction to meaning in this repo:

| Action | Reaction | Emoji |
|---|---|---|
| `status: ready` | "taking this" | `eyes` |
| `status: in-progress` | "actively working" | `rocket` |
| `status: needs-repro` | "need more info" | `confused` |
| `status: blocked` | "blocked" | `-1` |
| Closing as duplicate | "dup" | `rocket` |
| Closing as not planned | "not the right fit" | `-1` |
| Good first issue | warmth | `heart` |

React immediately after PATCH, before the comment. Skip if the reaction already exists.

### Step 4a — PATCH type + fields + assignees

```bash
gh api -X PATCH \
  "https://api.github.com/repos/deessejs/type-testing/issues/{n}" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  --input - <<EOF
{
  "type": "Task",
  "assignees": ["martyy-code"],
  "issue_field_values": [
    {"field_id": 43676415, "value": "Medium"},
    {"field_id": 43676418, "value": "Medium"}
  ]
}
EOF
```

Omit `assignees` if closing, or for external contributors.

### Step 4b — Labels

```bash
gh issue edit {n} \
  --remove-label status:needs-triage \
  --add-label status:ready,area:build
```

### Step 4c — React

```bash
# eyes = "taking this"
gh issue-react {n} eyes
```

### Step 4d — Close (if applicable)

```bash
gh issue close {n} --reason "not planned"   # or "duplicate", "resolved"
gh issue-react {n} rocket   # dup
gh issue-react {n} -1       # not planned
```

### Step 4e — Idempotency check

Always check before commenting.

```bash
gh api --paginate \
  "https://api.github.com/repos/deessejs/type-testing/issues/{n}/comments" \
  --jq '[.[] | select(.body | contains("<!-- triage-skill:v1 -->"))] | length'
```

If result > 0, skip the comment. If 0, post it.

### Step 4f — Comment (only if step 4e returned 0)

All comments start with `<!-- triage-skill:v1 -->`.

**`status: ready`:**
```markdown
<!-- triage-skill:v1 -->
## Triage complete

- **Type:** {type}
- **Area:** {area}
- **Status:** ready
- **Priority:** {priority}
- **Effort:** {effort}

**Verification:** {CONFIRMED / FALSE / PARTIAL — one line: what you found in the code}

**Next steps:** This issue is ready to be picked up. I've reacted 👀 to signal I'm looking at it.

{related: See also #N for context.}

_Triage by @{actor}._
```

**`status: needs-repro`:**
```markdown
<!-- triage-skill:v1 -->
## Triage: needs reproduction

Thank you for the report. To move forward, could you please provide:

- The minimal code snippet that reproduces the issue
- Your TypeScript version (`tsc --version`)
- Your package version of `@deessejs/type-testing`
- A `tsc --noEmit` output showing the error (if applicable)

**Verification so far:** {what the code check found}

Without a minimal reproduction, it's difficult to confirm and fix the issue. I've reacted 🤔 to signal we need more from your side — we'll revisit when the repro is added.

{related: e.g. "See #42 for a similar case."}

_Triage by @{actor}._
```

**`status: blocked`:**
```markdown
<!-- triage-skill:v1 -->
## Triage: blocked

This issue is currently blocked by: **{reason}**. See also #{n} for the upstream tracking.

**Verification:** {what the code check found}

I've reacted 👎 to signal the blocker. We'll revisit once it's resolved.

_Triage by @{actor}._
```

**Close as duplicate:**
```markdown
<!-- triage-skill:v1 -->
## Closed as duplicate

This issue is a duplicate of #{n}. Follow the discussion there.

**Verification:** {what the code check found}

I've reacted 🚀 to point to the right place.

_Triage by @{actor}._
```

**Close as not planned:**
```markdown
<!-- triage-skill:v1 -->
## Closed

**Verification:** {what the code check found}

{reason: e.g. "this is expected behavior", "the described API already exists at src/api/check.ts", "outside the scope of the library"}

I've reacted 👎 to signal this isn't the right fit right now — happy to revisit if you can share more context.

{related: e.g. "See #42 for the recommended approach."}

_Triage by @{actor}._
```

In GitHub, `#N` is automatically a link to issue/PR #N.

## §5 — Org field IDs

| Field | `field_id` | Options (string names) |
|---|---|---|
| Priority | `43676415` | `Urgent`, `High`, `Medium`, `Low` |
| Effort | `43676418` | `High`, `Medium`, `Low` |

## Output

After the run: "Triaged N issues: M set to ready, K closed, J skipped (already triaged)."

## Constraints

- **Verify every issue** against the codebase before deciding — not optional.
- **Filter out PRs** on every fetch with `--jq '.[] | select(.pull_request == null)'`.
- **Idempotency check** before every comment** — skip if `<!-- triage-skill:v1 -->` already present.
- **Always react** after PATCH (Step 4c) — reactions are the warm signal before the comment.
- Do NOT use `-f`/`-F` for `issue_field_values` — use `--input -`.
- Never create new labels.
- Never close without a reason.
- Process one issue at a time — never parallelize.
- Assign only for `ready` / `in-progress` — never for external contributors.
