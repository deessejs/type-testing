# Pull Request Templates — How They Work

> Learning note captured 2026-07-10. Source: GitHub official docs (`docs.github.com` + `github/docs` repo), via the `researcher` agent.
> Purpose: understand the mechanism before adding a PR template to `deessejs/type-testing`.

## TL;DR

A PR template is a plain **Markdown** file whose content is injected into the PR body. Unlike issues, there is **no YAML "PR forms"** equivalent — no structured/required fields. Put one at `.github/pull_request_template.md`, or use a `PULL_REQUEST_TEMPLATE/` folder for multiple templates selectable via `?template=name.md`.

## 1. Valid locations

- Single template: `pull_request_template.md` at the **repo root**, in **`.github/`**, or in **`docs/`**.
- Multiple templates: a `PULL_REQUEST_TEMPLATE/` subfolder inside any of those three locations (e.g. `.github/PULL_REQUEST_TEMPLATE/feature.md`). Folder name uppercase by convention; inner filenames lowercase.

## 2. Format

- **Plain Markdown, no YAML frontmatter.** Content is injected verbatim into the PR body (use standard Markdown checklists `- [ ]`).
- **No "PR forms".** Issue forms (`.yml` with structured web-form fields) apply to **issues only** — you cannot enforce required fields on a PR. Everything is free Markdown.
- Extensions: `.md` or `.txt` (`.markdown` is not documented — avoid it).
- Filenames are **not case-sensitive**.

## 3. Multiple templates & selection

- One template in a valid location → applied **automatically**.
- Several templates → GitHub shows a **template picker**, or you target one via the `?template=name.md` query param (requires a `PULL_REQUEST_TEMPLATE/` subfolder).

## 4. URL prefill (query parameters)

- `quick_pull=1` — jump straight to "Open a pull request".
- `title=…` — prefilled title (URL-encoded; spaces as `+`).
- `body=…` — prefilled body.
- `labels=label1,label2` — labels (comma-separated).
- `assignees=username` — assignees.
- `milestone=name`, `projects=org/num`.
- `template=name.md` — pick a specific template.
- Each param requires the corresponding permission. Invalid or over-long URL → `404` or `414 URI Too Long`.

## 5. Gotchas & differences vs issue templates

- The template must be on the **default branch** to be visible; one added on another branch isn't available.
- A single root-level template **cannot** be picked via `?template=` — it's only ever the default. Use the subfolder for URL selection.
- Priority order between root / `docs/` / `.github/` when several exist simultaneously is **not clearly documented** → pick a single location to avoid ambiguity.
- Issue side for contrast: issue templates live in `.github/ISSUE_TEMPLATE/`; issue forms (`.yml`) are issue-exclusive; there is no web-form for PRs.

## Applying this to `type-testing`

- A single `.github/pull_request_template.md` in plain Markdown is enough. Suggested sections: **Description**, **Type of change**, **Checklist** (tests pass, changeset added, docs updated).
- Bonus: the repo already has a `pr-review.yml` review bot that consumes the PR body — a clear, sectioned template makes its job easier.
- Only add a `PULL_REQUEST_TEMPLATE/` folder (e.g. `feature.md`, `bugfix.md`) if you want shareable links with a preselected template via `?template=`.

## Open questions / not found

- Exact priority order when `pull_request_template.md` exists at root + `docs/` + `.github/` simultaneously (docs don't resolve it — test empirically or use one location).
- Explicit confirmation that `.markdown` is not recognized (docs mention only `.md` and `.txt`).

## Sources

- <https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository>
- <https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates>
- <https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/using-query-parameters-to-create-a-pull-request>
