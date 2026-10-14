# Product runbooks

These pages are **templates**. They ship in git so a team can fill them in. They do **not** ship in the public handbook build.

To preview them:

```bash
npm run docs:dev:private
```

Put real tenant names, table names, hostnames, and aliases in `local/` (gitignored). Copy a template:

```bash
copy docs\product\architecture.md docs\product\local\architecture.md
```

On macOS/Linux: `cp docs/product/architecture.md docs/product/local/architecture.md`.

## What belongs here

| Page | Fill in |
| --- | --- |
| [Architecture](/product/architecture) | How the product is shaped (apps, regions, tenancy) |
| [Request IDs](/product/request-ids) | Header names, where they appear, how to search logs |
| [Data queries](/product/data-queries) | Actual table/collection names for users, tenants, the top 10 ticket types |
| [Known issues](/product/known-issues) | Recurring failures with the error `code` and the workaround |
| [Escalation matrix](/product/escalation) | Who to page, which Slack/Teams alias, vendor status pages |

## Rules

- No secrets in the templates.
- No secrets in git. See `decisions/0005-no-product-secrets.md`.
- Link *out* to this handbook's craft pages (HAR, 401 vs 403) instead of duplicating them.
