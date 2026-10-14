# Console

The Console is the application's diary in the browser. It will lie to you if you do not filter noise, but it is the fastest way to see CORS, mixed content, thrown exceptions, and failed source maps.

## What the customer sees

A blank page, a spinner, a button that does nothing. They may not see an HTTP status at all.

## What it actually means

JavaScript threw, a network call failed before HTTP (CORS, blocked mixed content, extension), or the app logged an error it did not show in the UI.

## Open it

Chrome / Edge: `F12` or right-click → Inspect → **Console**.

Firefox: `F12` → Console.

Safari: enable Develop menu (Settings → Advanced), then Develop → Show Web Inspector → Console.

## 2-minute check

1. Tick **Preserve log** if the page will reload (login and SSO will).
2. Filter to **Errors**. Ignore the 40 warnings from a password manager extension if you can reproduce in a clean profile.
3. Click the first red exception. Read the **first frame in application code**, not `chrome-extension://`.
4. If you see CORS: the Network call is probably `(failed)` / `(blocked:cors)`. The server may have returned 200 that the browser refused to hand to JS. See [Network](/browser/network).
5. Mixed content: HTTPS page calling `http://` API — browser blocks it. Looks like "the API is down."
6. Right-click the console → **Save as** (Chrome/Edge) or **Save all Messages to File** (Firefox). Attach that file with the HAR.

HubSpot documents the same console-save step their support asks customers for; the mechanic is browser-native: [Collect a HAR file for troubleshooting](https://knowledge.hubspot.com/help-and-resources/collect-a-har-file-for-troubleshooting).

## Messages that look like your bug and are not

| Console text | Usually |
| --- | --- |
| `Extension context invalidated` | Browser extension, not your app |
| `Failed to load resource: net::ERR_BLOCKED_BY_CLIENT` | Ad blocker |
| `Download the React DevTools` | Noise |
| `Violation: 'setTimeout' handler took 50ms` | Performance hint, not a functional break |
| Sourcemap 404 | Harder debugging; not the customer-facing failure |

Ask for a reproduce in a **guest profile** or incognito with extensions disabled when the only errors are extension-shaped.

## CORS in one paragraph

The browser made the request (or a preflight `OPTIONS`). The response did not allow this origin. JavaScript sees a network error; the Console screams CORS; the HTTP status on the **preflight or GET** might still be 200 or 204. Do not tell the customer "we returned 200 so it works." Read Access-Control headers on the preflight. Escalate to engineering with the origin, the method, and whether OPTIONS succeeded.

## What to ask

- Console export plus HAR
- Browser and version
- Whether it happens in a clean profile

## When to escalate

- Uncaught exception in first-party code on a supported browser
- CORS that started after a domain or CDN change
- Blank page with no Network failures (boot-time JS throw)
