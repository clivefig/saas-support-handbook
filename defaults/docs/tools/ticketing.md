# Ticketing

The help desk is the system of record. If it is not in the ticket, it did not happen.

Vendor click-paths (Zendesk, Intercom, Freshdesk, Jira Service Management, Linear, Help Scout) change every year. The craft does not.

## What every ticket must contain

Reuse the [evidence standard](/guide/evidence). In the help desk, that means structured fields, not a novel in the first comment.

Minimum:

- Customer + tenant + region
- Channel (email, chat, in-app, phone)
- Severity ([severity table](/guide/severity))
- One-sentence problem
- Expected vs actual
- Request ID / HAR / console when it is technical
- Next action and owner

## Macros are not a brain

Macros and saved replies are for the **second** message, after you know which problem you are in. A macro that says "try another browser" on a 500 from `/api/billing/charge` wastes a day.

Good macros:

- Ask for a sanitized HAR with a link to [HAR files](/browser/har)
- Ask for tenant, user, timestamp with timezone
- Set expectation on the next update time

Bad macros:

- "Have you tried turning it off and on again" as the first reply to Enterprise
- Asking for a password
- Asking them to paste the full HAR into the comment (attach the file)

## Tags that help later-you

Tag by **symptom and surface**, not by your guess at root cause:

- `auth`, `billing`, `export`, `webhook`, `sso`, `performance`
- `http-401`, `http-403`, `http-429`, `http-5xx`
- `har-attached`, `needs-eng`, `known-issue`

Root-cause tags (`db-lock`, `bad-deploy`) belong on the incident or the bug, after you know.

## Writing to the customer

- Lead with impact and next step, not with your internal theory.
- Do not name other customers.
- Do not paste stack traces or table names.
- Do not promise a code fix unless engineering has accepted the bug.

Internal note vs public reply: put request IDs, HAR analysis, and SQL findings in an **internal note**. The customer gets a translation: "We can see request `req_7f3c91` failed with 403 because this invoice is in dispute."
