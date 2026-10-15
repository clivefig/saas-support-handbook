# 0009 — Production admin reads/writes via GitHub Contents API

## Status

Accepted

## Context

On Netlify, Articles listed empty and Structure stayed blank while Privacy worked.
The function has no handbook files on disk. Privacy used the GitHub **Contents** API;
Articles listed files via the Git **Data** (trees) API, which failed for the OAuth
user token mode in use (expiring user access tokens). Structure failed silently in
the UI when `/api/nav` errored.

Reset also walked `defaults/` on the Lambda filesystem, which is not bundled into
the function.

## Decision

- List and read handbook files in production only through the GitHub Contents API
  (same path as Privacy).
- Normalize `/api/nav` responses to always include `nav` and `sidebar` arrays.
- Store OAuth `refreshToken` in the session cookie and refresh on GitHub 401.
- Load Reset snapshots from `defaults/` on GitHub, not from disk.
- Surface load errors in the Articles / Structure admin UI instead of failing quiet.

## Consequences

Admin features work against `GITHUB_REPO` in production. Prefer leaving **Expire
user access tokens** off on the OAuth App; refresh support covers the expiring case.
