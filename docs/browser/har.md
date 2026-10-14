# HAR files

A HAR (HTTP Archive) is a JSON snapshot of the browser's network log. It is the single most useful artifact you can attach to a SaaS ticket — and one of the easiest ways to leak session cookies if you are sloppy.

Chrome documents save/load here: [Save all network requests to a HAR file](https://developer.chrome.com/docs/devtools/network/reference#save-as-har).

## What the customer sees

You asked them for "a HAR file" and they send a screenshot. This page is what you send instead: short steps, then what you will do with the file.

## Capture (Chrome / Edge) — customer-safe

1. Open the page **where the issue happens**.
2. Right-click → Inspect → **Network**.
3. Confirm recording is on (red dot).
4. Check **Preserve log** and **Disable cache**.
5. Click the clear-log icon.
6. Reproduce the problem once. Wait until the failing request appears.
7. Click **Export HAR (sanitized)** in the Network toolbar (down-arrow / export). Save the `.har`.
8. Also save Console: right-click in Console → **Save as**. See [Console](/browser/console).

Sanitized export **drops `Cookie`, `Set-Cookie`, and `Authorization`**. That is the default you want. See [privacy](/tools/privacy).

To export **with** sensitive data, Chrome requires enabling **Allow to generate HAR with sensitive data** in DevTools settings. Do not ask a customer to do that unless your security team has a vault path. Prefer sanitized + a short-lived support session.

## Capture (Firefox)

Network → reproduce → toolbar **HAR** / right-click → **Save All As HAR**. Warn the customer that Firefox HARs may still contain cookies; treat them as secret.

## Capture (Safari)

Web Inspector → Network → export HAR (menu varies by Safari version). Same cookie warning as Firefox.

## Load a HAR in Chrome

1. Open DevTools → Network on any page.
2. Drag the `.har` onto the request table, **or** click **Import HAR**.
3. Filter Fetch/XHR, find non-2xx and interesting 200s, proceed as in [Network](/browser/network).

Imported HARs still show waterfalls and initiators. You can analyze a customer's capture without reproducing the product state.

## What to find in under a minute

1. Sort by Status or filter `status-code:4xx status-code:5xx`.
2. Search the HAR panel for the API host or `/api/`.
3. Open the failing call: method, URL, status, time, response body.
4. Copy request id headers into the ticket.
5. Note the **first** failing call, not the cascade of cancels after it.

If nothing failed over HTTP, go back to [Console](/browser/console) (JS exception, CORS, extension).

## Offline / privacy-friendly viewers

- Chrome/Edge import (best default)
- [triage.tools](https://triage.tools) (client-side HAR viewer)
- Other local viewers

Still sanitize first. Client-side is not a reason to keep cookies in the file you received; delete the original from your Downloads folder after analysis ([privacy](/tools/privacy)).

## What a HAR must never contain in the help desk

- `Cookie` / `Set-Cookie` values
- `Authorization: Bearer ...`
- Password form fields
- Full payment payloads

If a customer already uploaded a sensitive HAR, download it into the vault path, **remove it from the ticket attachments**, and rotate the session if policy says so.

## 2-minute check (you, after they attach it)

File opens in DevTools. You can name the failing URL and status. You have a request id. You have not pasted secrets into Slack.

## What to ask

"Please attach a sanitized HAR from Chrome or Edge using the steps in this article, plus a Console save. Reproduce once with Preserve log checked."

Link them this page or a one-pager your team maintains. Do not ask them to paste the JSON into the message body.

## When to escalate

- HAR shows a 5xx with a request id and you have the matching exception
- HAR shows a 2xx GraphQL `errors` array with `INTERNAL_SERVER_ERROR`
- You cannot interpret a waterfall that is clearly a gateway timeout — send the HAR (sanitized) with the timing screenshot to engineering
