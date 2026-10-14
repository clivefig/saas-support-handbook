# 30-day training path

This path turns the handbook into a job. Read in order. Check items off in your notes, not in git.

You are ramped when you can, without a senior sitting next to you:

- Assign a severity that a lead would not immediately change
- Produce an [evidence](/guide/evidence) block an engineer can use
- Capture and interpret a sanitized HAR
- Distinguish 401 vs 403, 502 vs 504, and GraphQL 200-with-errors
- Run a tenant-scoped read-only SQL **or** MongoDB lookup
- Escalate without dumping secrets

## How the month is structured

| Window | Goal | Pages |
| --- | --- | --- |
| [Days 1–7](/training/days-1-7) | Foundations: evidence, severity, tools, HTTP map | Start + Toolbelt + HTTP overview |
| [Days 8–14](/training/days-8-14) | Supervised tickets: HAR, API bodies, 4xx/5xx | Browser + Errors deep pages |
| [Days 15–30](/training/days-15-30) | Independent triage + certification | Data + scenarios + private product templates |

[Scenario labs](/training/scenarios) can be started from day 8. Do all of them before you call yourself certified.

## Daily habit

Every ticket you touch, even a how-to:

1. Timestamp with timezone
2. Tenant
3. Expected vs actual

If it is technical, add request id or a HAR. No exceptions for "it looked simple."
