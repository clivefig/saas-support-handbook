# API error shapes

In a browser, HTTP status is visible in the Network panel. In an API, **the body often carries the real code**, and sometimes the status is lying.

This page is the map. GraphQL and OAuth have their own pages because their contracts are different: [GraphQL errors](/errors/graphql), [OAuth errors](/errors/oauth).

## Rule

> Read **status + `Content-Type` + body + request ID headers** together. Never close a ticket on status alone.

## Ad-hoc JSON (`{ "error": ... }`)

Most SaaS APIs invented a shape before they read a spec. You will see variants of:

```json
{
  "error": "invoice_locked",
  "message": "Invoice is in dispute",
  "code": "INV_LOCKED",
  "status": 403
}
```

or:

```json
{
  "success": false,
  "errors": [{ "field": "email", "message": "taken" }]
}
```

**What the customer sees:** UI toast using `message`, or an integration that only logs HTTP 400.

**What it actually means:** Application-level code. `error` / `code` is what you search in logs and in this handbook's product runbook.

**2-minute check:** Does `status` inside the JSON match the HTTP status? If HTTP 200 and `success: false`, the HTTP layer is lying — treat it as a 4xx for triage.

**Ask:** Raw body, not a paraphrase. HAR proves it.

**Escalate:** Documented `code` missing from the body after a deploy; clients cannot branch.

## RFC 9457 Problem Details

[RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) (obsoletes RFC 7807) is the standard error document for HTTP APIs.

`Content-Type: application/problem+json`

```json
{
  "type": "https://api.example.com/errors/validation",
  "title": "Request Validation Failed",
  "status": 422,
  "detail": "email is not a valid address",
  "instance": "/invoices/inv_9",
  "traceId": "a7f3c91"
}
```

| Field | Support use |
| --- | --- |
| `type` | Stable URL-ish identifier — search this, not the prose |
| `title` | Short class of problem |
| `status` | Must match the HTTP status. If it does not, say so in the ticket; that is a bug |
| `detail` | This occurrence. Safe-ish for customers if the API is well written |
| `instance` | Which resource |
| extensions (`traceId`, `errors[]`) | Join key for logs; field-level validation |

**2-minute check:** `Content-Type` really `application/problem+json`? `status` member equals HTTP status? `type` documented?

**Escalate:** HTML 500 page from the gateway with no problem document on an API route — clients cannot parse it.

## JSON:API errors

Some APIs use [JSON:API](https://jsonapi.org/format/#error-objects):

```json
{
  "errors": [
    {
      "status": "422",
      "code": "invalid",
      "title": "Invalid Attribute",
      "detail": "First name must contain at least three characters.",
      "source": { "pointer": "/data/attributes/firstName" }
    }
  ]
}
```

Triage like RFC 9457: `code` + `source.pointer` + HTTP status.

## Headers that matter more than the slogan on the error page

| Header | Why |
| --- | --- |
| `x-request-id` / `x-correlation-id` / `cf-ray` / `traceparent` | Join HAR → logs |
| `www-authenticate` | 401 — scheme (`Bearer`, `Basic`) and sometimes `error="invalid_token"` |
| `retry-after` | 429 / 503 — seconds or HTTP date |
| `allow` | 405 — legal methods |
| `content-type` | JSON vs HTML error page vs `application/problem+json` |

## Idempotency and retries

Clients retry. Support must know whether the first call **succeeded**.

- First `POST /charges` → 201. Retry without `Idempotency-Key` → duplicate charge (not a 4xx).
- First `POST` → 201. Retry with same key → 200/201 same resource.
- First `POST` → timeout (client saw 504). Retry with same key → safe. Retry with new key → duplicate.

If a customer says "it charged twice," pull both request IDs and both bodies before refunding.

## Rate limits

See [429](/errors/http-4xx). Document in the ticket:

- Which limiter (per-key, per-IP, per-tenant)
- Remaining / reset headers
- Whether their integration is a hot loop

## Walkthrough: failed API call in Network

1. Filter Fetch/XHR. Sort by status. See [Network](/browser/network).
2. Click the red row. Headers → copy URL, method, status, request ID.
3. Response → copy the JSON (redact tokens). Identify the shape (ad-hoc / 9457 / JSON:API / GraphQL).
4. Request → confirm body and query. Do not copy `Authorization` into the ticket.
5. Translate: HTTP 403 + `code: invoice_locked` is a **business rule**, not an outage.

That five-step loop is the job. Everything else is commentary.
