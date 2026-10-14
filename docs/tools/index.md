# Toolbelt overview

A SaaS support engineer does not need fifty apps. You need a **small stack you can operate under time pressure**, plus the discipline to keep customer secrets out of it.

This chapter is product-agnostic. Prefer principles over brand names. If your company standardized on Zendesk instead of Intercom, the job does not change: capture evidence, classify, resolve or escalate.

## The six jobs of the stack

| Job | What it is for | Typical tools |
| --- | --- | --- |
| Conversation | Talk to the customer, keep a record, hit SLAs | Help desk / ticketing |
| Browser truth | See what the client actually sent and received | Chrome/Edge DevTools, Firefox, Safari Web Inspector |
| API truth | Replay a call without the UI in the way | Postman, Bruno, Insomnia, `curl` |
| Data truth | Confirm what is stored (read-only) | DBeaver, TablePlus, `psql`, `mongosh` |
| System truth | Logs, traces, exceptions, deploy markers | Sentry, Datadog, CloudWatch, Grafana, your log search |
| Hygiene | Decode tokens, inspect JSON, convert timezones | jwt.io alternatives you run locally, JSON formatter, timezone converter |

If a tool does not serve one of those jobs, it is a distraction.

## Default order of operations

1. Ticket context: who, tenant, plan, when it started.
2. Browser Network + Console on a reproduce (or their HAR). See [Network](/browser/network) and [HAR files](/browser/har).
3. Replay the failing API call in an API client if you have a safe environment. See [API clients](/tools/api-clients).
4. Confirm state in the database only if Network + logs are not enough. See [Database clients](/tools/database-clients) and [SQL](/data/sql).
5. Correlate by request ID in observability. See [Observability](/tools/observability).

Skipping to SQL because it feels powerful is how people leak PII and miss a 401 sitting in the HAR.

## What "best" means here

Best for support is not "most features." It is:

- Works offline or with a local file (HAR, console dump) when the customer's VPN is a mess
- Makes status, headers, and bodies obvious
- Does not upload customer data to a random website by default
- Has a clear audit trail (you can say who looked up which tenant)

Privacy constraints for every tool: [Privacy and customer data](/tools/privacy).
