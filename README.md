# The SaaS Support Handbook

Definitive training and desk-side reference for SaaS support teams. Product-agnostic craft first: HTTP and API errors, browser Network/Console, HAR files, SQL, MongoDB, and how to take evidence that engineering can actually use.

**Free and open source.** Includes an optional git-backed **Admin** UI (GitHub OAuth) for articles, navigation, and privacy copy. Branding (logo, colors) is customized in code — see [docs/setup/BRANDING.md](docs/setup/BRANDING.md).

## Two ways to read it

| Mode | Use when | Start here |
| --- | --- | --- |
| Train | You are ramping, or rebuilding fundamentals | [30-day path](docs/training/index.md) |
| Look up | You are on a ticket | [HTTP status codes](docs/errors/http.md), [HAR files](docs/browser/har.md), [SQL](docs/data/sql.md) |

## Run locally

Requires Node.js 22 or newer.

```bash
npm install
npm run docs:dev
```

Open the URL VitePress prints (usually `http://localhost:5173`).

### Admin (local, no OAuth)

```bash
npm run admin:api
npm run admin:dev
```

Open [http://localhost:5174/admin/](http://localhost:5174/admin/) and choose **Enter admin**.

Full production setup (Netlify + GitHub OAuth): **[docs/setup/ADMIN_AND_DEPLOY.md](docs/setup/ADMIN_AND_DEPLOY.md)**.

### Private product runbooks

```bash
npm run docs:dev:private
```

Filled-in product files belong in `docs/product/local/` and are gitignored. See [docs/product/index.md](docs/product/index.md).

## Quality checks

```bash
npm run qa
```

That lints Markdown, checks links, builds the admin SPA + public site, and runs Playwright. Public builds must not publish `docs/product/**`.

## Decisions

Why this stack and these defaults live in [decisions/](decisions/).

## What this is not

- A vendor tutorial for Zendesk, Intercom, or any one helpdesk.
- Permission to run `UPDATE` / `DELETE` against production.
- A place to paste customer tokens, HAR cookies, or tenant dumps.
