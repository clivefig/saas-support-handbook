# HTTP status codes

HTTP status codes are a **signal**, not a diagnosis. They tell you which side of the request to inspect first. They do not tell you the business reason.

Authoritative sources: [RFC 9110 §15](https://www.rfc-editor.org/rfc/rfc9110.html#name-status-codes), [IANA registry](https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml), [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status).

## Classes

| Range | Class | Support translation |
| --- | --- | --- |
| 1xx | Informational | Rare in SaaS tickets. Ignore unless a proxy is misbehaving. |
| 2xx | Success | The HTTP layer accepted the request. GraphQL and some RPC APIs still hide errors here — see [API error shapes](/errors/api). |
| 3xx | Redirect | Follow the `Location`. Common with SSO, trailing slashes, HTTP→HTTPS, and CDN rules. |
| 4xx | Client error | The request, as sent, will not succeed until something about **this caller or this payload** changes. |
| 5xx | Server error | Something on **our** side or an upstream we own failed. Still check that the client is not hammering a dead URL. |

## Who emitted the code?

In modern SaaS the number often comes from a layer that is not the application:

| Layer | Typical codes | Hint |
| --- | --- | --- |
| Browser extension / client | (no HTTP) | Console CORS / mixed-content / blocked by client |
| CDN / WAF | 403, 429, 502, 503, 504 | `cf-ray`, `x-cache`, `server: cloudflare` |
| Load balancer / gateway | 502, 503, 504 | No application log line for the request ID |
| App server | 400, 401, 403, 404, 409, 422, 500 | JSON body with your error shape |
| Auth provider | 302, 401, 400 | Redirect to IdP; OAuth `error=` query param — [OAuth](/errors/oauth) |

A 403 from the WAF ("bot fight", geo, missing header) is a different ticket from a 403 from the app ("role cannot download invoices"). Read **headers and body**, not only the number.

## Lookup

Deep pages for the codes that show up in real queues:

- [Client errors (4xx)](/errors/http-4xx) — 400, 401 vs 403, 404, 405, 408, 409, 410, 413, 415, 422, 429
- [Server errors (5xx)](/errors/http-5xx) — 500, 502 vs 503 vs 504, 501, 505

Memorize this short list first: `200`, `201`, `204`, `301`, `302`, `304`, `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`, `502`, `503`, `504`.

## 2xx that still mean failure

| Status | Meaning | Trap |
| --- | --- | --- |
| 200 | OK | GraphQL `errors` array; REST `{ success: false }`; download of an error HTML page |
| 201 | Created | Duplicate create if the client retried without idempotency |
| 202 | Accepted | Async job later failed — the HTTP call is not the job |
| 204 | No Content | UI expected a body and looks "blank" |

Always open the response body. Always. See [API error shapes](/errors/api).

## Redirects (3xx) in two minutes

1. Is `Location` still on your domain, or did they bounce to an IdP?
2. Is it HTTP→HTTPS or `www` vs apex? Bookmark / mixed-content issues follow.
3. 304 Not Modified: the client used a cached version. "Disable cache" in Network when reproducing.

If SSO loops (302 → 302 → 302), capture a HAR with **Preserve log** on. See [HAR files](/browser/har).
