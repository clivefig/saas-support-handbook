# Days 8–14 — Supervised tickets

You own low-severity technical tickets with a named reviewer on every HAR interpretation.

## Day 8–9 — Network as a reflex

On every ticket this week, open Network (or the customer's HAR) before you open Slack.

- Practice the [failed API walkthrough](/errors/api#walkthrough-failed-api-call-in-network).
- Read [API error shapes](/errors/api) and [GraphQL](/errors/graphql).
- Tag tickets `http-4xx` / `http-5xx` / `graphql` honestly.

**Check:** You have pasted a redacted JSON body into an internal note at least twice.

## Day 10 — Auth cluster

- Re-read [401 vs 403](/errors/http-4xx) and [OAuth](/errors/oauth).
- Lab: [401 vs 403](/training/scenarios#lab-1--401-vs-403).
- Shadow one SSO ticket. Write the redirect `error=` code in the note.

**Check:** You can explain `invalid_grant` vs `access_denied` to a customer without saying "OAuth is broken."

## Day 11–12 — Timeouts and layers

- Lab: [504 vs slow query](/training/scenarios#lab-3--504-vs-slow-query).
- In observability, find one slow trace. Write: CDN timeout vs app vs DB.
- Read [502 vs 503 vs 504](/errors/http-5xx) again after you have seen a real waterfall.

**Check:** You will not call a 504 "the site is down" when it is one export endpoint.

## Day 13–14 — GraphQL and CORS

- Lab: [GraphQL 200-with-errors](/training/scenarios#lab-2--graphql-200-with-errors).
- Lab: [CORS](/training/scenarios#lab-4--cors-looks-like-an-outage).
- Pair-review two HARs with your lead.

**Week 2 gate:** Lead agrees your last five tickets had usable evidence. You have not leaked a cookie in chat.
