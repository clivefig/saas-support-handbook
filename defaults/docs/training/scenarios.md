# Scenario labs

Work these with a lead or another trainee. Write your **next action** before you peek at the answer. The answer is the craft, not a product-specific root cause.

## Lab 1 — 401 vs 403

**Prompt:** Customer: "I can't download the invoice. I'm logged in." Network: `GET /api/invoices/inv_9/pdf` → **403** body `{ "code": "invoice_locked", "message": "Invoice is in dispute" }`. Session refresh works; other invoices 200.

**Your move?**

<details>
<summary>Answer</summary>

This is **403 + business rule**, not 401. Do not reset the password. Confirm invoice status (UI or read-only DB). Explain dispute/lock policy. Escalate only if an admin on a non-disputed invoice still 403s, or if `invoice_locked` is returned for `paid` invoices (bug).

</details>

## Lab 2 — GraphQL 200-with-errors

**Prompt:** Page is blank. Network: `POST /graphql` **200**. Body has `data.invoice: null` and `errors[0].extensions.code: "FORBIDDEN"`. Console has no CORS errors.

**Your move?**

<details>
<summary>Answer</summary>

Treat as authorization on that field, not an outage. HTTP 200 is a trap. Ask role vs invoice ownership. Same playbook as REST 403. Escalate if `FORBIDDEN` on a field the role is documented to read.

</details>

## Lab 3 — 504 vs slow query

**Prompt:** "Exports are down." Only `GET /api/exports/csv` fails. Status **504**. HAR timing: TTFB ~60s. App logs show the request, duration 59.8s, SQL wait on `events`. Login and list endpoints 200 in 120ms. One tenant, large date range.

**Your move?**

<details>
<summary>Answer</summary>

Not a fleet outage. Gateway timed out waiting on a heavy export. SEV3 unless exports are a contractual core path for many tenants. Workaround: smaller date range. Escalate as performance with request id + `EXPLAIN` concern — do not raise the timeout as the "fix" in the customer thread.

</details>

## Lab 4 — CORS looks like an outage

**Prompt:** Customer: "Your API is down from our dashboard." Console: CORS error. Network: `OPTIONS` 204, `GET` 200, status shows `(blocked:cors)` for JS. Your health page is green. They called from `https://dash.partner.example`.

**Your move?**

<details>
<summary>Answer</summary>

The origin is not on the allowlist (or credentials/header mismatch). Not a 5xx incident. Confirm the documented callback/origin. Escalate to engineering as a CORS config change if the partner origin is contracted. Do not tell them "we returned 200 so it works" without explaining the browser.

</details>

## Extra drills (optional)

- HAR with two `POST /oauth/token` and `invalid_grant` — authorization code replay. See [OAuth](/errors/oauth).
- WAF 403 HTML vs app 403 JSON — different owners. See [HTTP](/errors/http).
- GraphQL HTTP 401 from middleware vs HTTP 200 `UNAUTHENTICATED` — still auth, different layer.
