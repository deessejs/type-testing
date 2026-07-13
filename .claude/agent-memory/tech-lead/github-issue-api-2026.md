---
name: github-issue-api-2026
description: How to set issue_type and issue_field_values via the GitHub API (REST + GraphQL), mid-2026. Used to programmatically enrich issues with org-level metadata when `gh issue create` doesn't expose those fields.
metadata:
  type: reference
---

GitHub Issue **types** (org-level) and **fields** (org-level structured metadata) are NOT exposed by `gh issue create`. To add them after the fact (or in a script), use the REST API directly with `gh api` (or any HTTP client).

**Why:** I created 9 issues on `deessejs/type-testing` via the CLI and they came out without `type` or `issue_field_values`. The researcher agent confirmed this and gave the exact endpoints.

**How to apply:** When asked to apply issue types/fields to existing or new issues programmatically:

1. Required header on every REST call: `X-GitHub-Api-Version: 2026-03-10`.
2. Discover IDs first (they're not constant across orgs):
   ```bash
   gh api -H "X-GitHub-Api-Version: 2026-03-10" /orgs/{org}/issue-types
   gh api -H "X-GitHub-Api-Version: 2026-03-10" /orgs/{org}/issue-fields
   ```
3. PATCH /repos/{owner}/{repo}/issues/{n} accepts **both** `type` (string, the type NAME not ID) and `issue_field_values` (array of `{field_id, value}`) in one call. `value` is typed by `data_type` (string for text/single_select option name, number, ISO date, or array of option names for multi_select).
4. GraphQL alternative: `createIssue(input)` accepts `issueTypeId: ID` + `issueFields: [IssueFieldCreateOrUpdateInput!]`. `updateIssue(input)` does NOT accept field values — use `updateIssueFieldValue` / `createIssueFieldValue` mutations.
5. Permissions: `admin:org` for defining types/fields; push access on the repo for applying them.
6. Default fields when Issue Fields is enabled on an org: `Priority` (single_select Urgent/High/Medium/Low), `Effort` (single_select High/Medium/Low), `Start date` (date), `Target date` (date). Match by `name`, not ID.
7. Watch out for the secondary rate limit on POST/PATCH (these endpoints send notifications). Honor `Retry-After`.
