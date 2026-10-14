# GraphQL errors

GraphQL does not use HTTP status the way REST does. **HTTP 200 with a non-empty `errors` array is a failed operation** (or a partial one). Treating 200 as success is the classic support miss.

Spec: [GraphQL response errors](https://spec.graphql.org/October2021/#sec-Errors).

## What the customer sees

The UI looks blank, a spinner never ends, or a toast says "failed to load" while Network shows **200** on `POST /graphql`.

Integrations say "the API is fine" because their HTTP client only checks status codes.

## What it actually means

A GraphQL HTTP response is JSON with some combination of `data` and `errors`.

```json
{
  "data": {
    "invoice": null
  },
  "errors": [
    {
      "message": "Not authorized to view invoice",
      "path": ["invoice"],
      "extensions": {
        "code": "FORBIDDEN",
        "traceId": "a7f3c91"
      }
    }
  ]
}
```

| Pattern | Meaning |
| --- | --- |
| `errors` only, no `data` | Request error (syntax, validation, unknown operation) — nothing executed |
| `data` + `errors` | Execution error on some fields; other fields may be valid |
| `data` with `null` on a non-nullable field | That field (and often its parent) was nulled because of an error |
| HTTP 4xx/5xx on `/graphql` | Transport / gateway / auth middleware — not a GraphQL field error |

`extensions.code` is the searchable application code (`UNAUTHENTICATED`, `FORBIDDEN`, `BAD_USER_INPUT`, `INTERNAL_SERVER_ERROR`, or a custom `INVOICE_LOCKED`).

## 2-minute check

1. Network → the `graphql` request (often all named `graphql`).
2. Open Response. Search for `"errors"`.
3. Read `message`, `path`, `extensions.code`, `extensions.traceId`.
4. If HTTP status is 401/403/500, treat it as [HTTP](/errors/http) first — the GraphQL engine may not have run.
5. If HTTP 200 + `UNAUTHENTICATED`, the session died; it is still an auth ticket.

## What to ask

- Operation name (`InvoiceQuery`) if present in the payload
- Variables (redact PII)
- Whether **some** of the page loaded (partial `data`)

## When to escalate

- `INTERNAL_SERVER_ERROR` with a trace id (app exception)
- HTTP 200, empty `data`, errors that started after a schema deploy
- Schema validation errors (`Cannot query field`) on a documented field — client on old schema vs breaking change

## Transport vs GraphQL

RFC 9457 can still appear when the **HTTP** layer fails (gateway 503 with `application/problem+json`). That is not a GraphQL `errors` array. Do not parse it as one.

Auth middleware often returns REST-like 401 JSON for `/graphql`. That is [401](/errors/http-4xx), not a GraphQL execution error.
