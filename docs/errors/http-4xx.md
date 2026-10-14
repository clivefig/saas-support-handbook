# Client errors (4xx)

4xx means: **the server understood that this request should not succeed as sent.** The next step is almost always "inspect the request," not "restart the app."

Template on every code: what the customer sees → what it means → 2-minute check → what to ask → when to escalate.

## 400 Bad Request

**What the customer sees:** Generic "something went wrong," a form that will not submit, or an integration that "cannot connect."

**What it actually means:** The request is malformed: invalid JSON, wrong types, missing required query/body fields, bad encoding, illegal characters in the URL.

**What to check in 2 minutes:** Network → the call → Request payload. Is the JSON valid? Content-Type `application/json`? Any proxy injecting a body?

**What to ask:** Exact payload (redacted). Which client sent it (UI vs Zapier vs their script)?

**When to escalate:** Payload matches the documented schema and still 400s — possible server-side parser bug or a gateway rejecting HTTP/2.

## 401 Unauthorized vs 403 Forbidden

These two are the most expensive mix-up in SaaS support.

| | **401 Unauthorized** | **403 Forbidden** |
| --- | --- | --- |
| RFC meaning | You are not authenticated (or the credentials are not accepted) | You are authenticated, and still not allowed |
| Typical cause | Missing/expired/invalid token, bad API key, session cookie gone | Role, plan, tenant isolation, WAF, feature flag, resource policy |
| Customer language | "Logged out," "invalid API key," SSO bounce | "You don't have access," button missing, 403 JSON |
| First check | `Authorization` header / session cookie present and not expired | User role, resource ownership, WAF headers |
| Do not | Reset their password because of a 403 | Tell them to "log in again" as the only step for a 403 |

**401 — 2-minute check:** Is there a `WWW-Authenticate` header? Did the token expire (`exp` in a JWT — decode locally, do not paste secrets into public websites)? Clock skew?

**403 — 2-minute check:** Same user, different resource — does it work? Same resource, admin user — does it work? Body `code` (example: `invoice_locked`, `sso_enforced`). WAF 403 often has no app JSON body.

**Escalate 401** when tokens issued in the last five minutes are rejected (auth service or signing key).

**Escalate 403** when an admin on the correct tenant is denied a documented capability, or when WAF 403s spike.

## 404 Not Found

**What the customer sees:** Blank page, "not found," a deep link from email that dies.

**What it actually means:** No resource at this URL *for this caller*. Could be a typo, a deleted object, a tenant-scoped hide (some apps 404 instead of 403 to avoid leaking IDs), or a front-end route that does not exist.

**What to check in 2 minutes:** URL path vs the API docs. Trailing slash. Case. Object still in DB? SPA: is the 404 from `index.html` or from `/api/...`?

**What to ask:** How they got the link (email, bookmark, in-app). Was the object deleted?

**When to escalate:** Documented public URL 404s for everyone after a deploy (routing).

## 405 Method Not Allowed

**What it means:** URL exists, method does not (`POST` to a GET-only route). Look at `Allow` header.

**2-minute check:** UI calling `PUT` vs API expecting `PATCH`. Integration following outdated docs.

**Escalate:** Official SDK using a method the gateway now blocks.

## 408 Request Timeout

**What it means:** The server timed out waiting for the *client* to send the full request. Different from [504](/errors/http-5xx) (we timed out waiting on upstream).

**2-minute check:** Giant upload? Flaky mobile network? Customer VPN inspecting HTTPS?

## 409 Conflict

**What it means:** The current state of the resource refuses this change: duplicate email, stale `If-Match` / version, idempotency key replay with a different body.

**2-minute check:** Are they retrying a POST? Is there an `Idempotency-Key`? Unique constraint in DB (email already taken)?

**Ask:** Did the first attempt actually succeed? (202/201 then a retry that 409s)

**Escalate:** Two clients racing and corrupting state; unique index missing.

## 410 Gone

**What it means:** The resource used to exist and is deliberately removed. Treat as a product decision, not a misspelled 404.

## 413 Content Too Large

**What it means:** Body bigger than the gateway or app allows (file upload, JSON batch).

**2-minute check:** Limit in docs vs actual file size. CDN/body buffer smaller than the app.

**Ask:** File size and type. Are they uploading via the UI or a script?

## 415 Unsupported Media Type

**What it means:** `Content-Type` is wrong (`text/plain` instead of `application/json`, or `multipart` expected).

**2-minute check:** Request headers. GraphQL clients forgetting `application/json`.

## 422 Unprocessable Content

**What it means:** JSON parsed, types may even match, but **business validation** failed (RFC 9110). Distinct from 400 (syntax) in well-behaved APIs. Many frameworks still use 400 for this.

**2-minute check:** Field-level errors in the body (`errors.email`, RFC 9457 extensions). Required field null.

**Ask:** The validation message. Which field they changed.

**Escalate:** Validation rejects values the UI itself sends.

## 429 Too Many Requests

**What it means:** Rate limit. Look for `Retry-After`, `X-RateLimit-Remaining`, `RateLimit-*`.

**2-minute check:** Which client is looping (integration, webhook replay, open tab)? Burst vs sustained.

**Ask:** Script or Zapier? How many workers?

**Escalate:** Limit too low for a documented workflow; 429s with no headers after a gateway change.

Customer-facing: they need backoff, not a new API key — unless the key is leaked and someone else is burning the quota.

## Other 4xx you will see occasionally

| Code | Meaning | Support note |
| --- | --- | --- |
| 402 | Payment Required | Rare as HTTP; many SaaS use 403 + `past_due` instead |
| 406 | Not Acceptable | `Accept` header vs what the server can produce |
| 407 | Proxy Authentication Required | Customer's proxy, not your app |
| 412 | Precondition Failed | `If-Match` / ETag; concurrent edit |
| 414 | URI Too Long | Filters crammed into GET query; use POST search |
| 421 | Misdirected Request | HTTP/2 connection reused against the wrong host — TLS/SNI |
| 426 | Upgrade Required | Client speaking HTTP/1.0 at a modern gateway |

If the code is not in this table, look it up in [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status) and still inspect the **body and the layer** that produced it.
