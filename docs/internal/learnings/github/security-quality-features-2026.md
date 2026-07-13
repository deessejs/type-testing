# GitHub Security & Quality Features — Feature Overview + REST API (mid-2026)

> Learning note captured 2026-07-13 via the `researcher` agent. Sources: docs.github.com (code-security, billing, advanced-security, repository-rules, merge-queue, dependency-graph, secret-scanning, code-scanning, dependabot).
> Purpose: what GitHub security/quality features are available for a public OSS TypeScript monorepo, which are active by default vs require setup, and how to query them via REST API.

## TL;DR

For a public repo, everything is **free**. CodeQL, secret scanning, Dependabot alerts, dependency graph — no GitHub Advanced Security license needed. High ROI actions: enable CodeQL default setup, push protection, private vulnerability reporting, and move branch protection to rulesets.

## 1. Feature overview — what's active by default

| Feature | Default | Plan | Key action needed |
|---|---|---|---|
| **Dependency graph** | ✅ Auto | Free | None — verify in Insights |
| **Secret scanning (alerts)** | ✅ Auto | Free | Enable push protection in Settings |
| **Dependency review (inline PR)** | ✅ Auto (via graph) | Free | None |
| **CodeQL code scanning** | ❌ Manual | Free (public) | One-click Setup in Settings |
| **Push protection** | ❌ Manual | Free (public) | Toggle in Settings |
| **Dependabot security updates** | ❌ Manual | Free | Toggle in Settings + `dependabot.yml` |
| **Private vulnerability reporting** | ❌ Manual | Free | Toggle in Settings |
| **Rulesets** | N/A | Free (public) | Create in Settings → Rules |
| **Merge queue** | N/A | Team+ | Skip for now |

**GHAS (Advanced Security license) is NOT required** for public repositories. It is only needed for private/internal repos.

## 2. Code scanning (CodeQL)

**"Default setup"** is the right entry point for a TypeScript repo:
- Settings → Security → Advanced Security → CodeQL analysis → **Set up → Default**
- No YAML file written to `.github/workflows/`. No `query-filters.yml` or `extraction-js.yml` needed.
- GitHub picks languages automatically (JS/TS detected via `package.json`, `tsconfig.json`, `.ts` files).
- `autobuild` mode handles the build — no special config for TypeScript.
- Runs: weekly on schedule + on every PR. Free on public repos.
- Cost: **$0 — unlimited minutes on public repos with standard GitHub-hosted runners.**

### Advanced setup (optional)
Only if default setup produces too many false positives. Requires writing `.github/workflows/codeql.yml`. Skip for now.

## 3. Secret scanning

**Two distinct features:**

### Secret scanning alerts (always-on)
- Scans entire git history, issues, PRs, discussions, gists.
- Free on public repos. No setup.
- List via: `GET /repos/{owner}/{repo}/secret-scanning/alerts`
- Dismiss via: `PATCH .../secret-scanning/alerts/{alert_number}`

### Push protection (opt-in)
- **Free on public repos** since May 2023.
- Blocks a push if a secret matching a partner pattern (AWS keys, npm tokens, etc.) is detected.
- Enable: Settings → Code Security → **Push protection** → Enable.
- One-time toggle. No YAML or workflow needed.

### Custom patterns + validity checks (optional)
`.github/secret-scanning.yml` enables:
- **Custom patterns** (e.g., internal token formats)
- **Validity checks** — pings the issuer to confirm the token is still active. For an OSS lib publishing to npm, this is high ROI.

## 4. Dependabot — security updates vs version updates

They are **independent and complementary:**

| Feature | Trigger | Config needed |
|---|---|---|
| **Version updates** | `dependabot.yml` with `package-ecosystem` + `schedule` | `.github/dependabot.yml` (already present) |
| **Security updates** | GitHub Advisory Database flags a vuln | Settings → Dependabot → Enable (no `dependabot.yml` required) |

Both can be active simultaneously. Security updates create targeted PRs that fix the specific vulnerability; version updates handle all bumps.

### Grouped security updates
`dependabot.yml` can group multiple security updates into one PR:
```yaml
groups:
  security-updates:
    dependency-type: "all"
    update-types: ["security"]
```

### Compatibility scores
Heuristic based on past CI runs. Available in Dependabot settings.

## 5. Dependency graph

**Automatically enabled on public repos.** pnpm is supported via `pnpm-lock.yaml`.

Provides:
- Transitive dependency path display
- "Used by" badge (threshold: 100 dependents)
- SBOM export (SPDX CycloneDX) via API
- Powers Dependabot + dependency review inline comments

Verify: Insights → Dependency graph.

## 6. Dependency review (inline PR diff)

Powered by the dependency graph. **No separate API** — the same data is available via `GET /repos/{owner}/{repo}/dependency-graph/compare/{base...head}` (the diff between two commits). This endpoint is what GitHub uses to render the inline "dependency review" check on PRs.

## 7. Private vulnerability reporting

- Adds a "Report a vulnerability" button on the Security Advisories tab.
- Reports arrive as private draft security advisories — only visible to maintainers.
- **Free on public repos.** Enable: Settings → Security → Advanced Security → **Private vulnerability reporting** → Enable.
- For an OSS library, this is a standard expectation from security-conscious consumers.

## 8. Rulesets (replacing branch protection)

**Rulesets are the modern replacement for branch protection rules** (deprecated in favor of rulesets over time).

Available on free public repos for per-repo rulesets. Org-level rulesets require Team or Enterprise.

### Recommended rulesets for this repo

**Ruleset 1 — `main`:**
- ✅ Require a pull request before merging (1 approval + CODEOWNERS)
- ✅ Require status checks to pass (lint, typecheck, test)
- ✅ Require linear history (prevents merge commits on main)
- ✅ Block force pushes

**Ruleset 2 — `v*` tags (release tags):**
- ✅ Restrict tag updates (prevent overwriting a release tag)
- ✅ Restrict tag creations (prevent accidental `git push --tags`)
- ✅ Restrict deletions

Note: Tag protection via the classic "Protected tags" UI is deprecated since Oct 2023. Use tag rulesets instead.

### Rulesets vs branch protection rules
- Rulesets support **layering** (multiple rulesets can target the same branch; most-restrictive wins).
- Rulesets expose rules to read-only viewers.
- Rulesets support **metadata restrictions** unavailable in classic branch protection.

## 9. GitHub Actions cache for pnpm (native)

`actions/setup-node@v6` supports `cache: 'pnpm'` out of the box:

```yaml
- uses: actions/setup-node@v6
  with:
    node-version: "22"
    cache: "pnpm"         # uses pnpm-lock.yaml automatically
```

Even better: if `package.json` has `"packageManager": "pnpm@9.0.0"` (Corepack), `setup-node` enables pnpm cache **without** the `cache:` input:

```yaml
# In package.json:
"packageManager": "pnpm@9.0.0"
```

This repo already has `"packageManager": "pnpm@9.0.0"` — the native cache works with zero config.

Turbo `.turbo/` cache is independent — combine both.

## 10. Actions Performance Metrics (CI insights)

Native since March 2025 (GA). Available at **Insights → Actions Usage Metrics** and **Actions Performance Metrics**.

Provides:
- Success rate, p50/p95 duration, queue time, failure rate per workflow
- Exportable to CSV
- No config needed — data is collected automatically

## 11. Merge queue — skip for now

Designed for repos with **high PR volume from many contributors**. Requires handling the `merge_group` event in CI. For a small OSS monorepo with low PR throughput, the ruleset option "Require branches to be up to date before merging" achieves the same correctness without the complexity.

## 12. HIGH ROI summary for this repo

| # | Action | Effort | Where |
|---|---|---|---|
| 1 | **Enable push protection** (secret scanning) | 1 toggle | Settings → Code Security |
| 2 | **Enable CodeQL default setup** | 1 toggle | Settings → Security → Advanced Security |
| 3 | **Enable private vulnerability reporting** | 1 toggle | Settings → Security → Advanced Security |
| 4 | **Migrate to rulesets** (`main` + `v*` tags) | ~15 min | Settings → Rules |
| 5 | **Enable Dependabot security updates** | 1 toggle | Settings → Dependabot |
| 6 | **Verify dependency graph populated** | 2 min | Insights → Dependency graph |
| 7 | **Check Actions Performance Metrics** | 2 min | Insights → Actions Performance |

## Sources

- <https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/configure-code-scanning/configure-code-scanning> (CodeQL default setup)
- <https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning> (secret scanning)
- <https://docs.github.com/en/code-security/concepts/secret-security/push-protection> (push protection)
- <https://docs.github.com/en/code-security/concepts/supply-chain-security/about-the-dependabot-yml-file> (version vs security updates)
- <https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-security-updates> (security updates + grouped)
- <https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository> (private vulnerability reporting)
- <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets> (rulesets)
- <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets> (tag rulesets)
- <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets> (rulesets vs branch protection)
- <https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-graph> (dependency graph + SBOM)
- <https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md> (pnpm cache native)
- <https://github.blog/changelog/2025-03-14-actions-performance-metrics-are-generally-available-and-enterprise-level-metrics-are-in-public-preview/> (Actions Performance Metrics GA)
- <https://github.blog/changelog/2023-05-09-secret-scannings-push-protection-is-available-on-public-repositories-for-free/> (push protection free)
