# How to use this handbook

This is a **handbook**, not a novel and not a ticket dump. Use it in two modes.

## Train

Follow the [30-day path](/training/) if you are new to SaaS support, new to *technical* support, or rebuilding fundamentals. The path is ordered on purpose: evidence and tools first, then HTTP, then the browser, then data, then independent triage.

Do not skip the [scenario labs](/training/scenarios). Reading error codes is not the same as choosing the next action under time pressure.

## Look up

When you are on a live ticket, search (`Ctrl+K` / `Cmd+K`) or jump from the sidebar:

- [HTTP status codes](/errors/http) — what the number means, who owns it, what to check
- [API error shapes](/errors/api) — when the body disagrees with the status
- [HAR files](/browser/har) — capture, sanitize, import, find the failing call
- [SQL for support](/data/sql) and [MongoDB for support](/data/mongodb) — read-only query patterns

Every reference page follows the same skeleton:

1. **What the customer sees**
2. **What it actually means**
3. **What to check in 2 minutes**
4. **What to ask**
5. **When to escalate**

If a page does not tell you the next action, it is not finished. Open a change against it.

## Public vs private

The public site is **product-agnostic craft**. It must stay useful for any SaaS.

Product-specific runbooks (architecture, where *this* app stores request IDs, known failure modes) live under `docs/product/` and are **excluded from the public build**. Include them locally with:

```bash
npm run docs:dev:private
```

Fill real tenant names, table names, and escalation aliases only in `docs/product/local/`, which is gitignored. The split is recorded in `decisions/0002-public-vs-private.md`.

If you attach a real product later, copy the templates, do not paste secrets into the public chapters.

## How to add a page

1. Create a Markdown file under `docs/`.
2. Add it to the sidebar in `docs/.vitepress/config.ts`.
3. Link it from the training path or a lookup page so people can find it.
4. Run `npm run qa` before you call it done.

## Sources this book trusts

Primary references, not blogs:

- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) and the [IANA HTTP status code registry](https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml)
- [MDN HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)
- [RFC 9457 — Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
- [Chrome DevTools Network features](https://developer.chrome.com/docs/devtools/network/reference)
- [MongoDB `find()`](https://www.mongodb.com/docs/manual/reference/method/db.collection.find/)
