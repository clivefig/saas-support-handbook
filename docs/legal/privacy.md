# Privacy and disclaimer

This handbook is **free and open source**. You may use, copy, modify, and share it for personal or commercial support training, subject to the license in the repository.

## What this project is

The SaaS Support Handbook is a product-agnostic training and desk-side reference for SaaS support teams. It is not legal advice, security advice, or a substitute for your employer's policies.

## Privacy

- Do not paste customer secrets (passwords, cookies, full HARs with credentials, connection strings) into this handbook, tickets that mirror it, or public forks.
- Branding assets (logo, favicon) live in the content repository under `docs/public/`. Treat that repo's access controls as the privacy boundary.
- Admin authentication uses GitHub OAuth. Only users with write access to the content repository (or an explicit allowlist) can change content.

## Third-party open source used in the admin UI

- **[Shepherd.js](https://www.shepherdjs.dev/)** — free, open-source product tours used to walk admins through branding, articles, and structure. Shepherd is free to use; this project remains free to use as well. If you use change this to a commercial product then please review **[Shepherd.js](https://www.shepherdjs.dev/)** for their pricing
- **[EasyMDE](https://github.com/Ionaru/easy-markdown-editor)** — open-source Markdown editor in the admin article screens.
- **[VitePress](https://vitepress.dev/)** — static documentation site generator for the public handbook.

## Disclaimer

Content is provided **as-is**, without warranty of any kind. HTTP status meanings, API shapes, and tooling change over time. Always verify against your product's docs and current RFCs before acting on production systems.

Authors and contributors are not liable for damages arising from use of this handbook, including incorrect triage, data loss, or security incidents.

## Credits

Built by Clive Feigenbaum for SaaS support teams. Keep customer secrets out of tickets, HARs, and this repo.
