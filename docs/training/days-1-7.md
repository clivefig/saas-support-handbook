# Days 1–7 — Foundations

Do not take independent technical tickets yet. Shadow, write internal notes, and fail cheaply.

## Day 1–2 — How this team works

- Read [How to use this handbook](/guide/how-to-use), [Evidence](/guide/evidence), [Severity](/guide/severity).
- Sit with the help desk: [Ticketing](/tools/ticketing). Find severity field, internal notes, macros for HAR.
- Write one **practice** evidence block from a closed ticket (redact it). Compare to the template.

**Check:** You can recite the required evidence fields without looking.

## Day 3 — Toolbelt and privacy

- Read the [toolbelt overview](/tools/), [privacy](/tools/privacy), [API clients](/tools/api-clients), [observability](/tools/observability).
- Get access: help desk, error tracker (read), log search (read), **read-only** DB if policy allows.
- Confirm you do **not** have production write credentials.

**Check:** You know where a request id is pasted internally vs what the customer sees.

## Day 4–5 — HTTP map

- Read [HTTP status codes](/errors/http), [4xx](/errors/http-4xx), [5xx](/errors/http-5xx).
- For each of `401`, `403`, `404`, `429`, `500`, `502`, `504`: write one sentence "first check."
- Watch a senior classify three live tickets. Note where they used the body, not the status.

**Check:** You will not tell a 403 user to "log in again" as the only step.

## Day 6–7 — Browser without a customer

- Read [Console](/browser/console), [Network](/browser/network), [HAR](/browser/har).
- On a staging app (or any web app you own): capture a sanitized HAR of a login plus one API call. Import it back. Find the request id.
- Save Console to a file once so the muscle memory exists.

**Check:** You can export HAR (sanitized) from Chrome without opening a tutorial.

## End of week 1 gate

Your lead signs off that you:

- Know SEV1 vs SEV3
- Have working read access
- Produced one clean evidence block
- Captured one sanitized HAR
