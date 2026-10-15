# Admin and deploy — from scratch

This guide sets up **The SaaS Support Handbook** as an open-source, free-to-use static site with an optional git-backed admin UI.

## Prerequisites

- Node.js **22+**
- npm
- A GitHub repository (public or private)
- Optional for production admin: a [Netlify](https://www.netlify.com/) site (or any host that can run the same build + serverless redirects)

## 1. Clone and install

```bash
git clone <your-fork-url>
cd saas-support-handbook   # or "Support Issues"
npm install
```

## 2. Run the public handbook locally

```bash
npm run docs:dev
```

Open [http://localhost:5173](http://localhost:5173).

Private product-runbook templates:

```bash
npm run docs:dev:private
```

## 3. Run the admin locally (no GitHub OAuth)

Terminal A — API that writes files on disk:

```bash
npm run admin:api
```

Terminal B — admin UI:

```bash
npm run admin:dev
```

Open [http://localhost:5174/admin/](http://localhost:5174/admin/).

`ADMIN_LOCAL=true` skips OAuth. You can sign in via **Enter admin**. Saves update Markdown and JSON under `docs/` immediately. Refresh the VitePress site to see content changes.

## 4. Branding (via code)

The public site uses the **default VitePress theme**. There is no runtime theme switcher in admin (it made client navigation slow).

To change logo, favicon, or colors, edit files as described in **[BRANDING.md](./BRANDING.md)**.

## 5. Articles, structure, privacy, reset

- **Articles** — browse `docs/**/*.md`, edit with EasyMDE, save
- **Structure** — edit `docs/nav.json` (header + sidebar)
- **New article** — creates a Markdown file from the support template and adds a sidebar link
- **Privacy** — edits `docs/legal/privacy.md` (credits this free project and [Shepherd.js](https://www.shepherdjs.dev/))
- **Reset** — restores content from `defaults/` (does not wipe `docs/product/local/`)

Refresh the defaults snapshot after intentional factory changes:

```bash
npm run snapshot:defaults
```

## 6. Production on Netlify with GitHub OAuth

### 6.1 Create a GitHub OAuth App

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
   ([github.com/settings/developers](https://github.com/settings/developers))
2. **Application name:** e.g. `SaaS Support Handbook Admin`
3. **Homepage URL:** `https://<your-site>.netlify.app` (or your custom domain)
4. **Authorization callback URL** (GitHub may label this **Redirect URI**):
   `https://<your-site>.netlify.app/api/auth/callback`
   — must match `GITHUB_OAUTH_CALLBACK` exactly (no trailing slash after `callback`)
5. Leave **Allow wildcard matching** unchecked
6. Leave **Expire user access tokens** **unchecked** (recommended).  
   Short-lived tokens make Articles / Structure / Privacy calls fail after expiry unless
   you sign in again. The admin can refresh when a refresh token is present, but the
   stable setup is non-expiring user tokens.
7. Register the app → copy **Client ID** → **Generate a new client secret** and copy it once

### 6.2 Connect the repo to Netlify

1. New site from Git → select the handbook repo
2. Build command: `npm run build`
3. Publish directory: `docs/.vitepress/dist`
4. Functions directory: `netlify/functions` (set in [`netlify.toml`](../../netlify.toml))

### 6.3 Environment variables

Set in Netlify → Site settings → Environment variables (see [`.env.example`](../../.env.example)):

| Variable | Required | Notes |
| --- | --- | --- |
| `GITHUB_CLIENT_ID` | yes | OAuth App |
| `GITHUB_CLIENT_SECRET` | yes | OAuth App |
| `GITHUB_REPO` | yes | `owner/name` of the content repo |
| `GITHUB_BRANCH` | no | Defaults to `main` |
| `GITHUB_OAUTH_CALLBACK` | yes | Must match the OAuth App callback |
| `SESSION_SECRET` | yes | Long random string for session cookies |
| `ADMIN_GITHUB_USERS` | no | Comma-separated logins; if empty, requires **write** on the repo |
| `ADMIN_LOCAL` | no | Must be unset/false in production |

After signing in, Articles / Structure / Privacy / Reset all read and write through the
GitHub **Contents** API against `GITHUB_REPO` — nothing is read from the Netlify function
disk. If you previously enabled **Expire user access tokens**, turn it off on the OAuth App,
then **Log out** of `/admin/` and **Sign in with GitHub** again so the session gets a
non-expiring token.

### 6.4 First production login

1. Confirm the OAuth App still has **Expire user access tokens** unchecked
2. Open `https://<your-site>.netlify.app/admin/`
3. **Sign in with GitHub**
4. Only collaborators with push access (or allowlisted users) proceed
5. Shepherd.js offers a first-run tour of Branding, Articles, and Structure
6. Smoke-check: Articles list loads, Structure shows nav/sidebar, Privacy loads and saves

Each save creates a git commit. Netlify rebuilds the public handbook automatically.

## 7. Security notes

- Admin sessions are httpOnly cookies signed with `SESSION_SECRET`
- Product secrets belong in `docs/product/local/` (gitignored), not in the public tree
- Do not commit `.env` files
- OAuth tokens are stored only in the encrypted session cookie, not in the repo

## 8. Quality checks

```bash
npm run qa
```

Runs Markdown lint, link check, full `admin` + docs build, and Playwright.

## 9. License and attributions

This handbook is free and open source for anyone to use. The admin UI uses:

- [Shepherd.js](https://www.shepherdjs.dev/) — free product tours
- [EasyMDE](https://github.com/Ionaru/easy-markdown-editor) — Markdown editing
- [VitePress](https://vitepress.dev/) — public site

See [/legal/privacy](/legal/privacy) on a running site for the editable disclaimer.
