# Labels vs Issue Types vs Issue Fields

> Learning note captured 2026-07-10. Source: GitHub official docs + GitHub changelog (`github.blog/changelog`), via the `researcher` agent.
> Purpose: understand the three issue-metadata mechanisms before configuring triage for `deessejs/type-testing`.

## TL;DR

Three complementary layers, oldest to newest: **labels** (free-text tags, per repo, many per issue), **issue types** (org-level classification, one per issue, GA Apr 2025), and **issue fields** (org-level structured/typed metadata, GA **Jul 2026** — the recent feature). Labels stay for ad-hoc taxonomy; types classify; fields replace encoding data in labels (`priority/p0`).

## 1. Labels

- Text tags (name + hex color + description) on issues/PRs/discussions. **Strictly per-repo** — editing a label in one repo doesn't affect others.
- 9 defaults created per new repo: `bug`, `documentation`, `duplicate`, `enhancement`, `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`.
- **Org-level default labels**: configurable in org settings, but apply **only to newly created repos** — existing repos are never retroactively updated.
- Permissions: **write** to create/edit/delete; **triage** to apply/remove.
- Automation: referenced in issue forms (`labels:`), the `actions/labeler` Action (auto-label by changed paths), search filters (`label:bug`), and the REST/GraphQL API.
- **Structural limit**: free text, no type, no validation, no cross-repo consistency, no native reporting → the pain that issue types and fields address.

## 2. Issue Types

- A category classifying an issue (`Bug`, `Feature`, `Task`…), defined at the **organization** level and shared across all repos in the org.
- **One issue type per issue** (vs many labels). It's a structured attribute — native badge/column, filterable via `type:Bug` / `is:type`, auto-propagated to all org repos.
- Defaults: **Bug, Feature, Task** (editable, disableable, deletable). Up to **25 issue types per org** (name, description, color).
- **Timeline**: public beta 30 Sep 2024 → **GA 9 Apr 2025**. REST API support since Mar 2025.
- Plan/visibility: GA announced without documented plan restriction (assume all cloud plans; confirm on pricing page if critical; GHES timing unverified).

## 3. Issue Fields (the recent feature)

- **Structured, typed fields** in the issue sidebar, beyond labels — explicitly designed to replace `priority/p0`-style data encoded in labels.
- **Timeline**: public preview **12 Mar 2026** (select orgs) → all orgs **21 May 2026** → **GA 2 Jul 2026** (Free, Team, Enterprise, Enterprise Cloud w/ data residency; ships in GHES 3.23).
- **Field types (4)**: `single-select` (named options + color), `text` (auto-detects URLs), `number` (decimals ok), `date` (date picker).
- **Scope**: defined at the **org** level (`Settings → Planning → Issue fields`), applied across all repos.
- **Default fields (4)**: `Priority` (Urgent/High/Medium/Low), `Effort` (High/Medium/Low), `Start date`, `Target date` — auto-pinned to Bug/Feature/Task.
- **Pinning to issue types**: a field pinned to one or more types (or "Issues without a type") shows automatically in the sidebar; otherwise reachable via "Add field" or in Projects.
- **Visibility**: each field is `Organization only` (default) or `Public`. Org-only fields are hidden from non-members in sidebar, timeline, search, and API.
- **Search**: `field.priority:high`, `field."target date":>=2026-03-01`, `field.priority:high,medium`.
- **Projects integration**: usable as project-view columns (group/filter/sort). Limit: 50 total fields per project.
- **API/webhooks**: full REST + GraphQL; webhook events `field_added` / `field_removed` on the `issues` event. Org endpoint: `/orgs/{org}/issue-fields`.
- **Known limits**: 25 fields/org; 100 options per single-select; 10 pinned fields max per issue type; 50 total fields per project; **no URL prefill**; **not supported in issue templates** (set via sidebar/API/Actions); **PRs don't support issue fields**.

## How the three fit together

- **Complementary, not a full replacement.** Labels = ad-hoc, multi-axis taxonomy (many per issue). Issue type = single classification. Issue fields = typed structured metadata. The issue-fields announcement explicitly says labels remain — but should no longer encode structured data.
- **Recency order**: labels (historical) < issue types (beta 2024 / GA 2025) < **issue fields (preview 2026 / GA Jul 2026)**.

## Applying this to `deessejs/type-testing`

- Both issue types (GA Apr 2025) and issue fields (GA Jul 2026) are available on Free/Team/Enterprise — confirm the org's plan if it turns out to be a blocker.
- Suggested triage design:
  - **Issue types** — coarse, org-wide classification: `Bug`, `Feature`, `Docs`, `Chore`. Filterable in advanced search and Projects.
  - **Labels** — multi-axis facets: component (`area:parser`, `area:api`, `area:web`), status (`status:blocked`), audience (`good first issue`) — plus `actions/labeler` auto-labelling by changed paths.
  - **Issue fields** — adopt the defaults `Priority` and `Effort` to replace `priority/p0` hacks and make reports queryable.

## Open questions / not found

- Exact plan gating for issue types (no explicit restriction found; assume all cloud plans, confirm on pricing).
- GHES availability date for issue types.
- Interaction between YAML issue forms and auto-assigning an issue type / prefilling a field at creation — docs say templates can't prefill fields; type auto-assignment unconfirmed.
- Admin/custom-role requirements to create org-level types/fields.

## Sources

- <https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels>
- <https://docs.github.com/en/organizations/managing-organization-settings/managing-default-labels-for-repositories-in-your-organization>
- <https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/managing-issue-types-in-an-organization>
- <https://github.blog/changelog/2024-09-30-evolving-github-issues-public-beta/>
- <https://github.blog/changelog/2025-04-09-evolving-github-issues-and-projects/>
- <https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/managing-issue-fields-in-your-organization>
- <https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-and-managing-issue-fields>
- <https://github.blog/changelog/2026-03-12-issue-fields-structured-issue-metadata-is-in-public-preview/>
- <https://github.blog/changelog/2026-07-02-issue-fields-are-now-generally-available/>
