# ADR 0004: HAR sanitization by default

## Status

Accepted

## Context

HAR files are the best evidence for browser/API tickets. They also commonly contain `Cookie`, `Set-Cookie`, and `Authorization` headers. Chrome can export a **sanitized** HAR that drops those fields. Asking customers for "a HAR" without saying sanitized causes preventable secret leaks in help desks and Slack.

## Decision

- Teach **Export HAR (sanitized)** as the default (Chrome/Edge).
- Sensitive HAR export requires an explicit security-approved vault path, never the ticket thread.
- Firefox/Safari exports are treated as potentially sensitive until proven otherwise.
- Analysis happens in DevTools import or a client-side viewer; public LLM paste is forbidden.

Documented in `docs/browser/har.md` and `docs/tools/privacy.md`.

## Consequences

- Macros should link the sanitized steps.
- Engineering asking for cookies must use the vault path, not "just re-export."
- Support laptops delete downloaded HARs when the ticket closes (policy reminder, not enforced in code).
