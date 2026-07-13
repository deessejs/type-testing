# GitHub Security & Quality — REST API Reference (mid-2026)

> Learning note captured 2026-07-13 via the `researcher` agent. Sources: docs.github.com/rest (code-scanning, secret-scanning, dependabot, dependency-graph).
> Purpose: complete REST API reference for querying and managing security findings in `deessejs/type-testing`. For all endpoints: header `X-GitHub-Api-Version: 2026-03-10`.

## Global notes

- **GHAS license NOT required** for public repos. All endpoints work on public repos without Advanced Security.
- **Header** required: `X-GitHub-Api-Version: 2026-03-10`
- **Permissions (fine-grained PAT / GitHub App)**:
  - Code scanning → "Code scanning alerts": read / write
  - Secret scanning → "Secret scanning alerts": read / write
  - Dependabot alerts → "Dependabot alerts": read / write
  - SBOM / dependency graph → "Contents": read (repo read access sufficient)
- **Token classic scopes**: `security_events` (all three), or `public_repo` for public-only access.
- **Pagination**: `per_page` (max 100, default 30) + `page`, OR cursor-based via `Link` header (`rel="next"`). Loop while `Link` header contains `rel="next"`.

---

## 1. Code scanning / CodeQL

Docs: `docs.github.com/rest/code-scanning/code-scanning`

### List alerts

```
GET /repos/{owner}/{repo}/code-scanning/alerts
```

**Query params:**
| Param | Values | Notes |
|---|---|---|
| `state` | `open`, `closed`, `dismissed`, `fixed` | |
| `severity` | `critical`, `high`, `medium`, `low`, `warning`, `note`, `error` | |
| `tool_name` | e.g. `CodeQL` | Mutually exclusive with `tool_guid` |
| `tool_guid` | GUID string | |
| `ref` | e.g. `refs/heads/main` | |
| `sort` | `created`, `updated` | |
| `direction` | `asc`, `desc` | |
| `assignees` | GitHub login | |

**Note:** No server-side `rule_id` filter — filter client-side on `rule.id` in response.

**Key response fields:**
```json
{
  "number": 42,
  "state": "open",
  "rule": { "id": "js/insecure-randomness", "severity": "warning", "description": "..." },
  "tool": { "name": "CodeQL", "guid": "..." },
  "most_recent_instance": {
    "location": { "path": "src/crypto.ts", "start_line": 7, "end_line": 7 },
    "message": "..."
  },
  "dismissed_by": "martyy-code",
  "dismissed_reason": "false positive",
  "dismissed_comment": "...",
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-15T10:00:00Z",
  "fixed_at": null,
  "html_url": "https://github.com/deessejs/type-testing/security/code-scanning/42"
}
```

### Get alert detail

```
GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}
```

Returns the same structure as the list item, with full rule + tool detail.

### Get instances (code snippets + locations)

```
GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances
```

Each instance has `location` (path, start/end line/column) and `message`.

### Dismiss / reopen alert

```
PATCH /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}
```

```json
{
  "state": "dismissed",
  "dismissed_reason": "false positive",
  "dismissed_comment": "This is a test-only function"
}
```

Valid `dismissed_reason`: `false positive`, `won't fix`, `used in tests`.

Note: `fixed` is set **automatically** when a rescanned commit removes the vulnerable code. You cannot force `fixed` via API.

### List analysis history (SARIF uploads)

```
GET /repos/{owner}/{repo}/code-scanning/analyses
GET /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}
```

---

## 2. Secret scanning

Docs: `docs.github.com/rest/secret-scanning/secret-scanning`

### List alerts

```
GET /repos/{owner}/{repo}/secret-scanning/alerts
```

**Query params:**
| Param | Values | Notes |
|---|---|---|
| `state` | `open`, `resolved` | |
| `secret_type` | CSV string | e.g. `npm_token,aws_access_key` |
| `resolution` | `false_positive`, `wont_fix`, `revoked`, `pattern_edited`, `pattern_deleted`, `used_in_tests` | Only when `state=resolved` |
| `validity` | `active`, `inactive`, `unknown` | |
| `is_publicly_leaked` | `true`, `false` | |
| `is_bypassed` | `true`, `false` | |
| `sort` | `created`, `updated` | |
| `direction` | `asc`, `desc` | |

**Key response fields:**
```json
{
  "number": 7,
  "state": "open",
  "secret_type": "npm_token",
  "secret_type_display_name": "npm Publishing Token",
  "secret": "**************************",
  "resolution": null,
  "resolved_by": null,
  "validity": "active",
  "push_protection_bypassed": false,
  "created_at": "2026-07-10T08:00:00Z",
  "html_url": "https://github.com/deessejs/type-testing/security/secret-scanning/7"
}
```

Set `hide_secret: false` in the request to see the unmasked value (requires write access).

### Get alert detail

```
GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}
```

### Get secret locations (in git history)

```
GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}/locations
```

Returns each commit + location where the secret appears.

### Resolve / reopen alert

```
PATCH /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}
```

```json
{
  "state": "resolved",
  "resolution": "revoked",
  "resolution_comment": "Token rotated immediately after detection"
}
```

---

## 3. Dependabot alerts

Docs: `docs.github.com/rest/dependabot/dependabot`

> **Status:** Public preview (stable schema, subject to change). Works on public repos.

### List alerts

```
GET /repos/{owner}/{repo}/dependabot/alerts
```

**Query params:**
| Param | Values | Notes |
|---|---|---|
| `state` | CSV: `auto_dismissed`, `dismissed`, `fixed`, `open` | |
| `severity` | `low`, `medium`, `high`, `critical` | |
| `ecosystem` | `npm`, `pip`, `go`, `maven`, `composer`, `nuget`, `pub`, `rubygems`, `rust` | |
| `package` | CSV package names | |
| `scope` | `development`, `runtime` | |
| `epss_percentage` | 0–100 | Exploitability score threshold |
| `has` | `patch` | Alert has a patch available |
| `sort` | `created`, `updated`, `epss_percentage` | |
| `direction` | `asc`, `desc` | |

**Key response fields:**
```json
{
  "number": 12,
  "state": "open",
  "dependency": {
    "package": { "ecosystem": "npm", "name": "lodash" },
    "manifest_path": "packages/type-testing/package.json",
    "scope": "runtime"
  },
  "security_advisory": {
    "ghsa_id": "GHSA-xxxx",
    "cve_id": "CVE-2026-12345",
    "severity": "high",
    "cvss": { "score": 7.5, "vector_string": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N" }
  },
  "security_vulnerability": {
    "package": { "name": "lodash", "ecosystem": "npm" },
    "vulnerable_version_range": ">= 0.0.0 < 4.17.21",
    "first_patched_version": { "identifier": "4.17.21" }
  },
  "dismissed_reason": null,
  "dismissed_by": null,
  "auto_dismissed_at": null,
  "created_at": "2026-06-01T00:00:00Z",
  "updated_at": "2026-06-01T00:00:00Z",
  "html_url": "https://github.com/deessejs/type-testing/security/dependabot/12"
}
```

### `auto_dismissed` vs `dismissed` — how to distinguish

| State | Distinguishing field |
|---|---|
| `dismissed` | `dismissed_by`, `dismissed_reason`, `dismissed_comment` are populated |
| `auto_dismissed` | `state: "auto_dismissed"` + `auto_dismissed_at` is set |

Auto-dismissal happens when GitHub's rule determines the dependency is not reachable in production (e.g., dev-only scope, unreachable in the lockfile).

### Get alert detail

```
GET /repos/{owner}/{repo}/dependabot/alerts/{alert_number}
```

### Dismiss / reopen alert

```
PATCH /repos/{owner}/{repo}/dependabot/alerts/{alert_number}
```

```json
{
  "state": "dismissed",
  "dismissed_reason": "not_used",
  "dismissed_comment": "lodash is only imported in test helpers not shipped to consumers"
}
```

Valid `dismissed_reason`: `fix_started`, `inaccurate`, `no_bandwidth`, `not_used`, `tolerable_risk`.

---

## 4. Dependency graph / SBOM / Dependency review

Docs: `docs.github.com/rest/dependency-graph`

### Export SBOM (SPDX JSON)

```
GET /repos/{owner}/{repo}/dependency-graph/sbom
```

Returns SPDX 2.3 JSON. Requires only repo read access (no GHAS). No query params.

```json
{
  "sbom": {
    "SPDXID": "SPDXRef-DOCUMENT",
    "spdxVersion": "SPDX-2.3",
    "packages": [
      {
        "name": "lodash",
        "versionInfo": "4.17.21",
        "licenseConcluded": "MIT"
      }
    ],
    "relationships": [...]
  }
}
```

### Compare dependencies between two refs (dependency review)

```
GET /repos/{owner}/{repo}/dependency-graph/compare/{basehead}
```

`basehead` format: `{before}...{after}`, e.g. `main...feat-new-dep`.

Returns the diff of dependencies between two commits, including `vulnerabilities` per changed package. This is the API powering the inline "Dependency review" check on PRs.

**Note:** There is **no separate API** for the inline PR comments. The `compare/{basehead}` endpoint is the source; GitHub's UI renders it inline.

---

## 5. Quick reference — all endpoints

| Feature | List | Detail | Update |
|---|---|---|---|
| **Code scanning** | `GET /repos/{owner}/{repo}/code-scanning/alerts` | `GET /repos/{owner}/{repo}/code-scanning/alerts/{n}` | `PATCH /repos/{owner}/{repo}/code-scanning/alerts/{n}` |
| **Secret scanning** | `GET /repos/{owner}/{repo}/secret-scanning/alerts` | `GET /repos/{owner}/{repo}/secret-scanning/alerts/{n}` | `PATCH /repos/{owner}/{repo}/secret-scanning/alerts/{n}` |
| **Dependabot alerts** | `GET /repos/{owner}/{repo}/dependabot/alerts` | `GET /repos/{owner}/{repo}/dependabot/alerts/{n}` | `PATCH /repos/{owner}/{repo}/dependabot/alerts/{n}` |
| **SBOM export** | `GET /repos/{owner}/{repo}/dependency-graph/sbom` | — | — |
| **Dependency review diff** | `GET /repos/{owner}/{repo}/dependency-graph/compare/{basehead}` | — | — |

---

## Gaps / caveats

- No server-side `rule_id` filter on code scanning list — filter on `rule.id` in response client-side.
- `dependency-graph/summary` endpoint does not exist under that name — use SBOM or `compare/{basehead}`.
- No dedicated API for inline dependency review comments — rendered by GitHub UI from `compare/{basehead}`.
- Dependabot alerts API is public preview (marked subject to change).
- `auto_dismissed_at` field semantics not double-confirmed on a second source (enum `state` confirmed with high confidence).

## Sources

- <https://docs.github.com/en/rest/code-scanning/code-scanning> (list, detail, dismiss, analysis history)
- <https://docs.github.com/en/rest/secret-scanning/secret-scanning> (list, detail, locations, resolve)
- <https://docs.github.com/en/rest/dependabot/alerts> (list, detail, dismiss, auto_dismissed vs dismissed)
- <https://docs.github.com/en/rest/dependency-graph/sboms> (SBOM SPDX export)
- <https://docs.github.com/en/rest/dependency-graph/dependency-review> (compare/basehead for dependency review diff)
