# Evidence standard

If the ticket does not contain this list, you are guessing. Guessing creates reopen loops and angry engineering handoffs.

Collect these on **every** technical ticket before you say "it's a bug" or "it's working as designed."

## Required fields

| Field | Why it matters | Example |
| --- | --- | --- |
| Timestamp with timezone | Logs are useless without a window | `2026-09-17 11:04:22 UTC` (not "this morning") |
| Tenant / workspace / org | SaaS bugs are almost always scoped | `acme-prod`, region `eu-west-1` |
| User identity | Distinguishes "one user" from "the app is down" | email or user id, plus role (`admin` vs `member`) |
| Request / trace / correlation ID | The join key across browser, API, and logs | `trace_id`, `x-request-id`, `cf-ray` |
| Expected vs actual | Stops "it's broken" from meaning five different things | Expected: invoice PDF downloads. Actual: 403 |
| Environment | Staging bugs are not production bugs | production / sandbox / EU pod |
| Client | Front-end vs API vs mobile vs integration | Chrome 140 on Windows 11, or `AcmeSync/2.4` |
| Artifact | Proof, not a screenshot of the whole desktop | HAR (sanitized), console log, response body, query |

## The 2-minute evidence pass

1. Ask for the exact URL and the action they took (button name, API route).
2. Open DevTools → Network. Reproduce, or coach them to. See [Network](/browser/network).
3. Find the failing request. Copy status, URL, `x-request-id` / `traceparent` / `cf-ray`.
4. Save a **sanitized** HAR. See [HAR files](/browser/har).
5. Copy Console errors that are not extension noise. See [Console](/browser/console).
6. Write expected vs actual in one sentence each.

If you cannot reproduce, you still need their HAR, their timestamp, and their tenant. "Works for me" is not a resolution; it is a scope statement.

## What a good engineering handoff looks like

```text
Summary: Admin cannot download invoice PDF (HTTP 403 on GET /api/invoices/inv_9/pdf)

Customer: Acme (tenant acme-prod, US)
User:  user_01H8 (role: billing_admin)
When:  2026-09-17 11:04:22 UTC
What they did: Invoices → row inv_9 → Download PDF
Expected: PDF download
Actual: UI toast "You don't have access" + Network 403

Request: GET https://app.example.com/api/invoices/inv_9/pdf
Status: 403
Request-ID: req_7f3c91
Response body: {"code":"invoice_locked","message":"Invoice is in dispute"}

HAR: attached, sanitized (no cookies / Authorization)
Also checked: other invoices for this user succeed; this invoice status = disputed
```

That is enough for an engineer to start. A screenshot of a red toast is not.

## What never counts as evidence

- A cropped screenshot with the URL bar missing
- "Tried in incognito" with no HAR
- A password, session cookie, or full `Authorization` header pasted into the ticket
- A production database dump "for context"
- Five paragraphs of product theory before the status code

Privacy rules: [Privacy and customer data](/tools/privacy).
