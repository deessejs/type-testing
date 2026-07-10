# GitHub Issue Forms (YAML) — How They Work

> Learning note captured 2026-07-10. Source: GitHub official docs (`docs.github.com`), via the `researcher` agent.
> Purpose: understand the mechanism before adding structured issue templates to `deessejs/type-testing`.

## TL;DR

GitHub **issue forms** are structured `.yml` files in `.github/ISSUE_TEMPLATE/` that render as forms with typed fields (inputs, dropdowns, checkboxes) and validation — unlike the older free-text Markdown templates. They work on public **and** private repos, and coexist with Markdown templates.

## 1. Location & top-level structure

- Files live in `.github/ISSUE_TEMPLATE/` at the repo root (e.g. `.github/ISSUE_TEMPLATE/bug-report.yml`).
- **Required** top-level keys: `name`, `description`, `body`.
- `name` must be **longer than 3 characters**, otherwise the template is ignored in the picker.
- **Optional** top-level keys: `title` (prefilled title), `labels` (array or comma-separated string), `assignees`, `projects` (`OWNER/NUMBER`), `type` (org-level issue type).
- Picker order follows alphanumeric filename order (YAML before Markdown). Prefix with numbers to control order (`1-bug.yml`, `2-feature.yml`); pad with `0` past ten (`01-`, `02-`, … `11-`).

## 2. Body field types

Field types: `markdown`, `input`, `textarea`, `dropdown`, `checkboxes`, and (version-dependent) `upload`.

Each element accepts: `type` (required), `id` (optional except for `markdown`; only `a-zA-Z0-9-_`, must be unique), `attributes` (required map), `validations` (optional map).

| Type | Key attributes | Notes |
|---|---|---|
| `markdown` | `value` (required) | Static text, **not submitted**. YAML reads `#` as a comment → wrap in `"…"` or use `\|` block scalar. |
| `input` | `label` (required), `description`, `placeholder`, `value` | Single line. |
| `textarea` | same as `input` + `render` (e.g. `bash`, `shell`, `markdown`) | `render` formats content as a code block and disables inline Markdown. File attachments allowed unless `render` is set. |
| `dropdown` | `label` (required), `options` (non-empty array, unique), `multiple` (bool, default `false`), `default` (int index), `description` | Cannot use `None` as an option; quote booleans (`"Yes"`, `"true"`). |
| `checkboxes` | `label`, `description` (Markdown ok), `options` (array of `{label, required?}`) | Each option can be individually `required: true`. |
| `upload` | `label`, `description`, `validations.accept` (CSV of extensions) | Size caps: archives 25 MB, images 10 MB, videos 100 MB. Not on all GHES versions. |

Validation: `validations.required: true|false` on the input-bearing fields.

## 3. Issue forms (YAML) vs Markdown templates

- **YAML forms** = structured fields, validations, URL prefill (`?id=<field-id>`).
- **Markdown templates** = free text with limited frontmatter (`name`, `about`, `title`, `labels`, `assignees`), placed as `.md` in `ISSUE_TEMPLATE/` (or `ISSUE_TEMPLATE.md` at root / `.github/`).
- Both formats coexist. **No visibility restriction** — forms work on public and private repos.
- Issue forms apply to **issues only**, not pull requests (use `pull_request_template.md` for PRs).

## 4. `config.yml`

Path: `.github/ISSUE_TEMPLATE/config.yml`. Two keys:

- `blank_issues_enabled: false` — hides "Blank issue" for Read/Triage roles (Write/Maintain/Admin still see it, labeled "Maintainers only"). `true` = anyone can open a blank issue.
- `contact_links` — array of `{name, url, about}`; shows external links in the picker (Discussions, Discord, security form, etc.).

## 5. Constraints & gotchas

- `body` must contain **at least one input field** — a form with only `markdown` is rejected.
- Every `id` must be unique; user-visible `label`s must be unique (or disambiguated by `id`).
- YAML boolean-like words (`y`, `yes`, `no`, `true`, `false`, `on`, `off`, …) parse as Booleans if used as top-level keys — avoid or quote them.
- Some words are **forbidden in `label`s** (e.g. `password`, `secret`, `token`, `api_key`) to prevent credential leakage; the validation error lists the blocked words.
- No documented numeric limit on the number of fields or YAML size (validate empirically if needed).

## Applying this to `type-testing`

Suggested minimal set for `deessejs/type-testing`:

- `1-bug-report.yml` — `input` for TypeScript + `pnpm` versions, `dropdown` for affected area, `textarea` for a minimal reproduction with `render: bash`.
- `2-feature-request.yml`
- `3-question.yml`
- `config.yml` — `blank_issues_enabled: false` + a `contact_links` entry pointing to GitHub Discussions.

Pre-create the `bug` / `enhancement` / `question` labels in the repo (labels referenced but missing are ignored). Worth mirroring conventions from `vitest`, `tsd`, or `expect-type` issue templates.

## Open questions / not found

- No published numeric limit on fields per form or max YAML size.
- The exhaustive list of forbidden `label` words is not publicly documented (security filter) — discovered by trial and error.
- Issue forms carried a historical "beta / subject to change" note (since 2020) but remain the standard mechanism in 2026 with no deprecation announced.

## Sources

- <https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms>
- <https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema>
- <https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository>
- <https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/common-validation-errors-when-creating-issue-forms>
