# Server errors (5xx)

5xx means: **the server (or a proxy in front of it) failed to fulfill a request that looked valid.** Start with blast radius, then layer, then logs.

## 500 Internal Server Error

**What the customer sees:** "Something went wrong," a blank page after submit, a toast with no details.

**What it actually means:** Unhandled exception or a generic catch-all. The *real* reason is in logs/Sentry, not in the HTML.

**What to check in 2 minutes:**

1. One user or many? One route or all of `/api`?
2. Request ID in the response headers or body.
3. Exception tracker at that timestamp.
4. Deploy in the last hour?

**What to ask:** Exact action, HAR, whether refresh retries succeed (intermittent vs solid).

**When to escalate:** More than a handful of tenants, or a payment/auth path, or you already have the exception and it is new in the latest SHA. This is the default "page engineering" code when it is not isolated.

Do not tell the customer to "clear cache" as the first 500 response.

## 501 Not Implemented

**What it means:** Method or feature the server refuses to support. Rare. Often a gateway default for `TRACE`/`CONNECT`, or an API version stub.

**Escalate** if an advertised endpoint returns 501 after a release.

## 502 Bad Gateway vs 503 Service Unavailable vs 504 Gateway Timeout

These three are mixed up constantly. They are not synonyms.

| Code | RFC idea | In a SaaS stack | First check |
| --- | --- | --- | --- |
| **502** | Proxy got an **invalid** response from upstream | Origin crashed mid-response, TLS error to origin, empty reply, nginx `upstream prematurely closed connection` | Origin process alive? App logs for that second? Recent deploy / OOM? |
| **503** | Origin (or proxy) **refuses** the request right now | Overloaded, draining, maintenance, no healthy targets in the load balancer, scale-to-zero cold failure | Health checks, target group, status page, feature "read-only mode" |
| **504** | Proxy **did not get a response in time** | App or DB slower than the gateway timeout (often 15s/30s/60s) | Trace duration vs timeout. Slow query? Lock? Customer sending huge export? |

**What the customer sees:** Spinner, then error; "bad gateway" page from nginx/CloudFront; CDN branded 504.

**2-minute check (all three):**

1. Headers: `x-cache`, `cf-ray`, `via`, `server`. Did the CDN generate the page (`Error from cloudfront`) or the app?
2. Is there an **application** log line for the request ID?
   - No log line + 502/504 → died in front of the app or the app never accepted the connection.
   - Log line with duration 59.9s + 504 → gateway timed out waiting on the app.
3. Scope: one URL (export, report) vs everything.

**Ask:** Started after a deploy? Only large reports? VPN?

**Escalate:**

- 502/503 **across the fleet** → incident path ([severity](/guide/severity))
- 504 on one heavy endpoint → bug/perf ticket with trace and query, not a SEV1 unless it is login/checkout

### CDN-specific reading

A 502 at the CDN: origin returned something that is not valid HTTP (crash, connection reset).

A 504 at the CDN: origin did not answer before the CDN timeout. Raising the timeout without fixing the query just makes customers wait longer.

A 403 at the CDN is **not** a 5xx; see [401 vs 403](/errors/http-4xx).

## 505 HTTP Version Not Supported

Client speaking a version the gateway will not serve. Unusual; capture `curl -v` output.

## 507 / 508 / 511

| Code | Meaning | Support note |
| --- | --- | --- |
| 507 Insufficient Storage | WebDAV / disk | Origin disk or quota |
| 508 Loop Detected | Redirect or rewrite loop | Check gateway redirects |
| 511 Network Authentication Required | Captive portal | Customer's hotel Wi-Fi, not your SaaS |

## Customer communication for 5xx

- SEV1/SEV2: acknowledge impact, do not speculate about root cause in public, give the next update time.
- Single-tenant 500: "We have the request ID and the error class; engineering is investigating that specific failure."
- Never blame "the database" on the public thread unless you are sure and allowed to say it.
