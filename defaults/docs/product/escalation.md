# Escalation matrix (template)

Replace aliases. Severity definitions stay in the public book unless this product truly disagrees — if it disagrees, write the delta here, do not silently fork.

Craft: [Severity and escalation](/guide/severity).

## Who to contact

| Situation | Channel / alias | When |
| --- | --- | --- |
| SEV1 product down | TODO on-call | Now |
| Auth / SSO | TODO | SEV2+ or fleet of `invalid_token` |
| Billing / charges | TODO | Duplicate charge, cannot collect |
| Data / privacy | TODO security | Immediate |
| Vendor IdP (Okta, …) | TODO status page | Their `server_error` |

## Decision authority (this product)

| Decision | Support may | Must escalate |
| --- | --- | --- |
| Impersonate a user | TODO | TODO |
| Credits | TODO amount | Above that |
| Disable SSO for one tenant | TODO | TODO |

## Status page

- Who can post: TODO
- URL: TODO

## After hours

TODO: follow-the-sun, or page, or "office hours only for SEV3."
