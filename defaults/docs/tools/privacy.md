# Privacy and customer data

Support exists because customers trust you with their mess. Treat their data as **hot**.

## Never put these in a ticket, chat, email, or public git repo

- Passwords, OTP codes, session cookies, `Authorization` headers
- Full credit card numbers, bank accounts, government IDs
- Unredacted HAR files that still contain cookies (see [HAR files](/browser/har))
- Database dumps, `pg_dump` files, Mongo exports
- Private keys, `.env` files, connection strings
- Other customers' names in a thread about this customer

Chrome can export **HAR (sanitized)** and drops `Cookie`, `Set-Cookie`, and `Authorization`. Prefer that. If engineering truly needs cookies, use your company's secret-sharing path with an expiry, not the help desk.

## Least data that still solves the ticket

| Need | Collect | Do not collect |
| --- | --- | --- |
| Prove a 403 | URL, status, request ID, redacted body | Entire HAR with cookies |
| Prove a missing row | Count + primary key + status column | `SELECT *` of the users table |
| Prove an email failed | Message id + timestamp + provider code | Full mailbox export |
| Prove SSO broken | IdP error, timestamp, `trace_id` | SAML response with assertions in Slack |

## Impersonation and admin tools

If the product offers impersonation, it must be:

- Audited (who, which user, when, ticket id)
- Time-bounded
- Announced in the ticket

If it is not audited, do not use it. Ask engineering for a safer path.

## Sharing with vendors and AI tools

Do not paste HARs, logs, or tenant data into a public LLM, a random HAR viewer on the internet, or a colleague's personal Gmail.

Prefer:

- Chrome/Edge DevTools import (local)
- Offline HAR viewers
- [triage.tools](https://triage.tools) and similar **client-side** viewers (still strip secrets first; "client-side" is not a license to be careless)

If your company has a contracted AI assistant, it still does not get production connection strings.

## Retention

Delete downloaded HARs and CSV exports from your laptop when the ticket closes, according to policy. "I might need it later" is how laptops become breach reports.
