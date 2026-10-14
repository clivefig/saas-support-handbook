# Branding via code (for developers)

Runtime theme switching was removed so the public handbook stays fast and stable (default VitePress look). Customize branding by editing a few files in the repo, then rebuild or restart `npm run docs:dev`.

## What to change

| Goal | Where |
| --- | --- |
| Site title & description | [`docs/.vitepress/config.ts`](../.vitepress/config.ts) — `title` and `description` |
| Header / sidebar labels | [`docs/nav.json`](../nav.json) |
| Logo | Add `docs/public/logo.svg` or `docs/public/logo.png` (auto-picked by config) |
| Favicon | Add `docs/public/favicon.svg` or `docs/public/favicon.ico` |
| Colors / fonts / dark mode | Create `docs/.vitepress/theme/custom.css` (not in the repo by default) and import it from [`theme/index.ts`](../.vitepress/theme/index.ts) |
| Home hero copy | [`docs/index.md`](../index.md) frontmatter |

## Logo and favicon

1. Place files under `docs/public/`:

   ```text
   docs/public/logo.svg
   docs/public/favicon.svg
   ```

2. Restart or rebuild. Config already looks for those filenames.

3. Or set explicitly in `docs/.vitepress/config.ts`:

   ```ts
   themeConfig: {
     logo: '/logo.svg',
     // ...
   }
   head: [['link', { rel: 'icon', href: '/favicon.svg' }]]
   ```

## Colors (VitePress CSS variables)

Create `docs/.vitepress/theme/custom.css`:

```css
:root {
  --vp-c-brand-1: #3451b2;
  --vp-c-brand-2: #3a5ccc;
  --vp-c-brand-3: #5672cd;
  --vp-c-brand-soft: rgba(100, 108, 255, 0.14);
}

.dark {
  --vp-c-brand-1: #a8b1ff;
  --vp-c-brand-2: #9499ff;
  --vp-c-brand-3: #7c85ff;
}
```

Import it in `docs/.vitepress/theme/index.ts`:

```ts
import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default DefaultTheme
```

Official variable reference: [VitePress default theme — CSS variables](https://vitepress.dev/reference/default-theme-config).

## Optional background image

In `custom.css`:

```css
body {
  background-image: url('/brand/background.jpg');
  background-size: cover;
  background-attachment: fixed;
}

.VPNav,
.VPSidebar,
.VPContent {
  background-color: color-mix(in srgb, var(--vp-c-bg) 92%, transparent);
}
```

Put the image at `docs/public/brand/background.jpg`.

## After you change branding

```bash
npm run docs:dev     # local preview
npm run build        # production (admin + handbook)
```

On Netlify, push the commit; the site rebuilds from git.

## Admin UI

The admin app edits **content** (articles, nav structure, privacy). It does **not** switch themes at runtime. Point teammates who need a new look at this file.
