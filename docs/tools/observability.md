# Observability

Observability is how you join the customer's HAR to *your* systems. Support does not need to administer Datadog. You need to **search, correlate, and not over-claim**.

## What you are looking for

Given a request ID from the HAR or response headers:

1. The application log line for that request (status, route, user, tenant, duration).
2. The exception or error object, if any (Sentry, Rollbar, Bugsnag, CloudWatch).
3. Upstream timing (DB, Redis, HTTP client) if traces exist.
4. Whether a deploy, feature flag, or incident window overlaps the timestamp.

If you cannot search by request ID, say so in the ticket. That is a product gap, not a personal failure. The private runbook is where you record *this* product's header names.

## Reading an error tracker

Open the event. Write down:

- Exception class and message
- First frame that is **your** application, not `node_modules`
- Release / SHA
- User and tenant tags
- Count: first seen vs exploding now

A single Sentry event is not a SEV1. A spike that matches "login is broken" is.

## Logs vs metrics vs traces

| Signal | Use it for |
| --- | --- |
| Logs | Exact request, exact user, exact error string |
| Metrics | Is this one tenant or 8% of traffic? |
| Traces | Where the 1.8s went (gateway vs app vs DB) |

504 in the browser + 50ms app trace = the timeout is **in front of** the app (CDN, load balancer, or customer network). 504 + 59s DB span = you have a query problem. See [502 vs 503 vs 504](/errors/http-5xx).

## Deploys

Always check: did we ship in the hour before the first report? If yes, say "correlates with deploy `abc123`" — not "the deploy caused it" until you have a reverting fact (error class new in that SHA, flag flipped, migration).

## What not to do

- Do not paste full log lines with Authorization headers into the customer thread.
- Do not restart production because a graph looked spiky.
- Do not use observability access to browse unrelated tenants "to learn the product."
