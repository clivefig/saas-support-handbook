# Network

The Network panel is the source of truth for "what did the browser send, and what came back?" If you are not looking at it, you are supporting from folklore.

Primary reference: [Chrome DevTools Network features](https://developer.chrome.com/docs/devtools/network/reference).

## Open it and set it up

1. Open DevTools → **Network**.
2. Check **Preserve log** (login, SSO, and multi-step wizards navigate).
3. Check **Disable cache** while DevTools is open (avoids 304 confusion).
4. Clear the log, then reproduce **once**.

If you opened DevTools after the failure, you missed the calls. Reload and reproduce again.

## What to look at, in order

1. Filter: `Fetch/XHR` (Chrome) / `XHR` (Firefox). HTML/CSS/img noise hides the API.
2. Status column. Red is 4xx/5xx. **Also look at 200s** if the UI still failed — [GraphQL](/errors/graphql) and `{ success: false }`.
3. Name / URL. Match it to the button the customer clicked.
4. Click the row:
   - **Headers** — method, status, request ID, `www-authenticate`, `retry-after`, CORS
   - **Payload / Request** — JSON body (redact)
   - **Response** — error shape ([API error shapes](/errors/api))
   - **Timing / waterfall** — queued vs stalled vs TTFB vs download. 60s TTFB + 504 = server/gateway. 0.2s TTFB + 20s download = huge payload or slow client.
5. **Initiator** — which script fired the call. Useful when a third-party snippet is the one 429ing.

## Copy without leaking secrets

From the request's context menu Chrome can Copy as cURL, PowerShell, or fetch. **Strip `Cookie` and `Authorization` before the ticket.** Prefer Copy as cURL then redact, or rebuild in [API clients](/tools/api-clients) with a test token.

## Waterfall reading

| Pattern | Meaning |
| --- | --- |
| Long **stalled** / **queueing** | Browser connection limit or waiting on an earlier script |
| Long **TTFB** | Server or anything in front of it thinking |
| Long **content download** | Large payload, slow last mile |
| Many tiny calls in series | Chatty API; not always a bug, but explains "the page is slow" |
| Blocked / CORS | Console will agree; response may be opaque |

Throttle only when the ticket is about slow networks. Do not throttle while capturing a HAR for a functional 403 — you will add noise.

## Failed vs red vs `(canceled)`

- `(canceled)`: navigation left the page, or `AbortController`, or the user hit stop. Not always an incident.
- `(blocked:cors)` / `(failed)`: never treat as a successful 200 even if the server logged 200.
- Service worker: the Application panel may show a worker serving stale errors. Hard refresh or unregister in a test profile.

## Safari and Firefox notes

Safari Web Inspector → Network: similar columns; export HAR from the context menu or the export button depending on version.

Firefox: Preserve log is a setting; Copy as cURL exists; HAR export is **Save All As HAR**.

Always prefer the **customer's** browser when the bug is browser-specific; use Chrome yourself to *analyze* a HAR they captured.

## 2-minute check

Reproduce → Fetch/XHR → failing row → status + request id + body → decide 4xx vs 5xx vs GraphQL 200 vs CORS.

Then save a sanitized HAR: [HAR files](/browser/har).
