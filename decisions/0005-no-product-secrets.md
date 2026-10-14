# ADR 0005: No product secrets in the public tree

## Status

Accepted

## Context

Git history is forever. A "quick example" with a real tenant id, connection string, or webhook secret in `docs/` will be cloned, forked, and published with the handbook.

## Decision

The public tree may contain:

- Fictional tenants (`acme-prod`, `tnt_acme`, `inv_9`, `user_01H8`)
- Public specifications (RFC 9110, RFC 9457, MDN, Chrome docs)
- Empty product templates

The public tree may **not** contain:

- Real customer names, tenant ids, or emails
- Connection strings, API keys, JWTs
- Internal hostnames that are not already public
- Unredacted HAR fixtures with cookies

Filled runbooks live in `docs/product/local/` (gitignored). CI builds the public site without that folder.

## Consequences

- Code review should reject real-looking secrets in Markdown.
- Training HARs, if added later under `tests/fixtures/`, must be sanitized before commit.
- `npm run qa` is the gate before merge.
