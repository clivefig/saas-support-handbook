# ADR 0002: Public craft vs private product runbooks

## Status

Accepted

## Context

The handbook is **product-agnostic** so any SaaS support team can train on it. Teams still need a place for *this* product's architecture, request-id headers, table names, and escalation aliases. Putting those on a public site leaks internals. Omitting them makes the book incomplete on the job.

## Decision

- Public VitePress build **excludes** `docs/product/**` unless `INCLUDE_PRODUCT_RUNBOOKS=true`.
- Templates in `docs/product/` are fill-in-the-blank and contain no real tenants.
- Filled-in runbooks go in `docs/product/local/` and are gitignored.
- Public chapters must not deep-link to product pages (those URLs 404 on the public site).

Local/private preview:

```bash
npm run docs:dev:private
```

## Consequences

- Playwright asserts the public dist has no `product/` output.
- Training path mentions private templates in prose without depending on those routes.
- A later product-specific fork can set `INCLUDE_PRODUCT_RUNBOOKS=true` in its own CI if the site is private.
