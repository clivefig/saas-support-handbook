# ADR 0007: Branding via code, not admin runtime themes

## Status

Accepted

## Context

An admin “Simple / Advanced” theme with CSS variable injection and a `MutationObserver` on `document.documentElement` caused client-side navigations to hang (URL changed, content did not).

## Decision

- Keep the default VitePress theme for the public handbook.
- Document branding changes in `docs/setup/BRANDING.md` (config title, `docs/public` logo/favicon, optional `custom.css`).
- Admin Branding page only points developers at that guide.

## Consequences

- Faster, stable SPA navigation.
- Forks customize branding with a rebuild, not an admin color picker.
