# 0008 — Netlify function repo root without import.meta.url

## Status

Accepted

## Context

On Netlify, `netlify/functions/api.mjs` is bundled to CommonJS. In that bundle
`import.meta.url` is undefined, so `fileURLToPath(import.meta.url)` in
`lib/content.mjs` crashed the whole `/api/*` function before auth could run.

## Decision

Resolve `REPO_ROOT` from `import.meta.url` when available (local ESM /
`ADMIN_LOCAL`). Otherwise fall back to `LAMBDA_TASK_ROOT` or `process.cwd()`.
Production admin content reads/writes go through the GitHub API; local path
helpers only matter for `ADMIN_LOCAL`.

## Consequences

`/admin/` can load `/api/auth/status` and OAuth on Netlify. Local admin API
behavior is unchanged when scripts run from the repo root.

## Follow-up

Production admin **reads** (file, nav, article list) must use the GitHub API,
not the Lambda filesystem — docs are not available on disk in the function.
See `loadFile` / `loadJson` / `loadArticles` in `lib/api-handler.mjs`.
