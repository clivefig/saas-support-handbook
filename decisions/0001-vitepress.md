# ADR 0001: Use VitePress for the handbook

## Status

Accepted

## Context

We needed a definitive **training book** and a **desk-side reference** in git, portable across machines, with search, and without locking the content into Notion, Confluence, or a hosted GitBook.

Candidates: plain Markdown, mdBook, Docusaurus, Material for MkDocs, VitePress, Astro Starlight. Astro was ruled out for this project. Material for MkDocs is in maintenance mode (successor: Zensical). Docusaurus is heavier than we need (React, versioning, MDX). mdBook is a strong linear book with a weaker lookup UX. Plain Markdown is not a team training surface.

## Decision

Ship **VitePress** (Markdown, default theme, local search, book-style sidebar, static build). Title: *The SaaS Support Handbook*.

Content lives under `docs/`. Decision records live under `decisions/` so they travel with the repo even if the site generator changes later.

## Consequences

- Requires Node.js 22+.
- Public site is a static `docs/.vitepress/dist` we can put on GitHub Pages.
- Sidebar is configured in `docs/.vitepress/config.ts` — new pages must be registered there.
- We can replace the generator later without rewriting the Markdown chapters.
