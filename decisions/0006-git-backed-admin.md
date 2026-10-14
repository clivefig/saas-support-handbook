# ADR 0006: Git-backed admin with GitHub OAuth

## Status

Accepted

## Context

Operators need a UI to edit branding, articles, navigation, and privacy copy without hand-editing Markdown. Options included Supabase-backed CMS, DecapCMS, or a custom git-backed admin. The handbook is open source and already Markdown-in-git; adding a required database would raise the bar for every deployer.

## Decision

- Ship a Vue admin SPA at `/admin` that commits changes into the repo (or writes to disk when `ADMIN_LOCAL=true`).
- Authenticate with **GitHub OAuth**. Allow access when the user has write permission on `GITHUB_REPO`, or when listed in `ADMIN_GITHUB_USERS`.
- Persist navigation in `docs/nav.json` and articles as Markdown under `docs/`.
- Use Netlify Functions (or the local API server) as the write gateway. Netlify rebuilds the VitePress site after each commit.
- Branding is **not** runtime-admin: developers customize logo/colors in code (`docs/setup/BRANDING.md`). Runtime theme switching was removed because it stalled client-side navigation.
- Editor: EasyMDE. Tours: Shepherd.js (credited on the privacy page).

## Consequences

- Deployers must create a GitHub OAuth App and set env vars (documented in `docs/setup/ADMIN_AND_DEPLOY.md`).
- Content remains reviewable in git history; reset restores from `defaults/`.
- No Supabase dependency for v1.
- Admin build output is generated into `docs/public/admin/` at build time and published with the static site.
