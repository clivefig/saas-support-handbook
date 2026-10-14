# Severity and escalation

Severity is a **customer-impact** label, not a measure of how loud the ticket is. Use it to choose response time, who you wake, and whether you keep digging yourself.

## Severity table

Use this unless your company already has a written matrix. If you attach a product later, override it in the private runbook — do not fork this page in the public book.

| Severity | Customer impact | Examples | Support action |
| --- | --- | --- | --- |
| SEV1 | Whole product or login is down for many customers, or data loss / security incident in progress | 500s across `/api/*`, SSO login fails globally, tenant data visible to another tenant | Page on-call. Stay on the bridge. Do not "try one more restart" alone. |
| SEV2 | Core workflow broken for a segment (one region, one plan, one integration) with no acceptable workaround | Billing cannot collect, webhooks stalled for all Enterprise, EU region 504 | Urgent ticket + engineering within minutes. Workaround hunt in parallel. |
| SEV3 | Important feature broken for one customer or a few users; workaround exists | One admin cannot export CSV; 429 on a noisy integration | Diagnose with HAR/SQL. Fix or workaround same day. |
| SEV4 | Cosmetic, how-to, or low-impact defect | Label typo, slow but completing report, feature question | Queue. Teach, document, or file a non-urgent bug. |

If you are unsure between two levels, choose the **higher** one until evidence says otherwise. Downgrade in writing when you learn more.

## Two escalation paths

Keep these separate. Mixing them is how SEV1s die in a feature-request queue.

1. **Incident path** — service is degraded *now*. You need on-call, a status page decision, and a timeline. Evidence: error rate, affected tenants, start time, latest deploy, HAR from a failing request.
2. **Defect path** — behavior is wrong but the platform is up. You need a reproducible report. Evidence: the [evidence standard](/guide/evidence).

If the customer says "everyone is down" and your health checks are green, treat it as SEV2 until you prove it is one tenant, one browser, or one integration.

## What you must include on an escalation

- Severity you assigned and **why** (impact, not emotion)
- Blast radius: one user / one tenant / one region / all
- Start time and whether it is still happening
- What you already ruled out (auth, permissions, client cache, known issue)
- Artifacts: request ID, sanitized HAR, response body
- Customer communication already sent (so engineering does not contradict you)

## What you must not escalate

- A 401 where the token is expired and you have not asked them to re-auth
- A 404 on a resource the user never had
- A how-to question dressed up as a bug
- A production `UPDATE` you want engineering to "just run"

## Decision authority

Until a product-specific matrix exists, use this default:

| Decision | Support may | Must escalate |
| --- | --- | --- |
| Password reset / session revoke | Yes, via the product's official admin tools | Anything that bypasses those tools |
| Read-only data lookup | Yes, if you have access and log the reason | Writes, deletes, impersonation without policy |
| Credits / refunds | Only inside a documented limit | Anything above the limit |
| "It's a bug" to the customer | After you have a request ID and a failed request | Security issues, data loss, SEV1 wording |
| Public status page | No | Incident commander / on-call |

Write the customer-facing sentence **before** you escalate so you and engineering share one story: what is broken, who is affected, what you are doing next, when the next update is.
