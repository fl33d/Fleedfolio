# Fleedfolio

**Build a portfolio directly on the page. Preview it, publish it, and keep working.**

[![CI](https://github.com/fl33d/Fleedfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/fl33d/Fleedfolio/actions/workflows/ci.yml)

Fleedfolio is an open-source portfolio editor built with React, TanStack Start and Cloudflare Workers. The editing controls live alongside the finished layout: no separate form builder or complicated setup.

**Website:** [fleed.online](https://fleed.online/) · **Code:** [github.com/fl33d/Fleedfolio](https://github.com/fl33d/Fleedfolio)

> **Domain note:** The site's custom-domain routing is being checked after a migration away from Netlify. If the link shows a Netlify 404, the GitHub project is still available here; the Cloudflare Worker and domain need to be connected correctly.

## What works

- Write directly into the page; locally saved drafts survive a normal refresh.
- Switch between editing and a visitor preview.
- **Beginner walkthrough:** A six-step first-use guide explains editing, Customise, Preview, publishing, CV export and backups. Reopen it any time using the help icon in the editor dock.
- **Editable share address:** Rename your personal `/@username` directly in the published-link dialog, with validation and a save button. No need to hunt through settings.
- **CV view:** Show a clean one-column résumé based on your existing portfolio (including optional education), then use the browser's **Print / Save PDF** command. Text download is available too; no PDF is stored on the server.
- Publish to `/p/{id}` or claim an optional personal address like `/@yourname` (using the existing D1 table, with no schema migration), using an edit credential retained in the original browser.
- Add projects, experience, **education**, links, skills and custom sections. Reorder projects directly in the editor so your strongest work appears first.
- Choose from five page palettes, three typefaces, accents and motion settings.
- **Export/import JSON backups** from **Customise → Your work**, so you can move a draft between browsers or recover it after clearing local data.
- Reduced-motion support, accessible form controls and responsive layouts.
- Cleaner default editor: compact hero, static skill list on public portfolios, no distracting pulsing placeholders or circular completion meter.
- A restrained **editorial design system**: clear content hierarchy, accessible keyboard controls, intentional typography and optional visual effects instead of forced animations.

## Honest limitations

- **No accounts or cross-device sync.** Drafts and publishing credentials live in that browser. Export a backup before resetting the browser or switching devices.
- Importing a backup restores the *draft*, not an edit credential. Publishing after importing creates a new public link.
- Personal URLs use `/@username` without `/p`. A chosen name must be unique. Renaming it retires the old custom URL; the original generated `/p/{id}` link continues working.
- Image uploads are currently disabled; `/api/upload` returns 503 and `/img/:key` is unavailable. Image hosting is not advertised as a working feature.
- The public portfolio is stored in Cloudflare D1. Do not delete the existing database during a GitHub repository or domain migration.

## Run locally

Requires **Node.js 24**, **pnpm 9** and access to Cloudflare's development tooling for the Worker.

```bash
pnpm install --frozen-lockfile
pnpm exec wrangler types
pnpm dev
```

### Check a change

```bash
pnpm typecheck
pnpm test
pnpm build
```

GitHub Actions runs type generation, type checking, unit tests and a production build on pull requests and pushes to `main`. A green GitHub check is **not** proof that the live domain points to Cloudflare.

## How it works

| Part | Technology |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Routing and server functions | TanStack Start |
| Build | Vite with `@cloudflare/vite-plugin` |
| Production runtime | Existing Cloudflare Worker named `fleed` |
| Published portfolio storage | Existing Cloudflare D1 database `fleed-portfolios` |
| Draft storage | Browser `localStorage` |
| Deployments | Cloudflare Workers Builds from GitHub |

See [Architecture](docs/ARCHITECTURE.md), [Operations / deployment](docs/OPERATIONS.md) and [Contributing](CONTRIBUTING.md).

## Project principles

This repository contains the **portfolio builder**, not the separate Fleed Study application. Keep the editing experience focused, preserve existing data and do not add new infrastructure or paid services without a clear reason.
