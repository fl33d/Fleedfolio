# Fleedfolio — researched revamp implementation checkpoint

**Baseline:** `99cfb5a73236b8c281896d14e613d0ae08d764b2` on `main` before this work.
**Working branch:** `feat/portal-customise-revamp-20261123`.
**PR:** #19. This document is an implementation record, not a claim of deployment.

## Product decisions

The portfolio remains the homepage editor, open without signing in. No top navigation or permanent sidebar. The bottom dock remains compact and accessible; typography and portfolio content are editable directly on the page. Existing D1 rows, /p/:id, /@handle, blank:draft, blank:published, export/import, edit tokens and Cloudflare Worker settings must remain compatible.

Reference principles: Craft's easy presets + detailed customisation, Framer's direct visual canvas and adaptive compositions, Cloudflare's clear compact utility UI, and the user's own portfolio-collection inspiration (look at examples individually before lifting any pattern). Adapt ideas; do not copy the sites. `fleed.online` remains this project's target; `fleed.app` is for a separate future product.

## Completed code in this PR

1. **Independent tinted-glass layer.** The Customise sheet is created through React `createPortal` in `#fleed-overlay-root`, a sibling of the bottom dock. Two independent `backdrop-filter` surfaces can now sample the actual portfolio behind them. This replaces the earlier CSS `:has(.cz-panel)` workaround's need to disable the dock blur.
2. **Viewport-aware positioning.** The sheet is positioned over the triggering dock element, clamped horizontally and vertically at 320–1440px; it updates on viewport resize and scroll. Outside click and Escape close it; Escape restores focus to the trigger.
3. **Quick style + deeper tuning.** The non-modal glass panel has `Feel` and `Fine tune` tabs. Feel contains a compact horizontally scrollable rail of all eight Expressions, colour stories, accents and textures. Fine tune retains work presentation, typography, spacing, corner shape, section visibility, atmosphere, custom address, backups, CV, onboarding and reset options. No data is deleted on expression changes.
4. **Shared material polish.** `portfolio-chrome.css` defines the portalled Customise surface, compact tactile controls, and readable tinted publishing dialog. The existing portfolio renderer and editor storage remain untouched.
5. **Real-browser checks.** The Playwright Chromium workflow now verifies: the panel is inside the overlay root but *outside* the dock, both surfaces have active blur, the panel tint is translucent, geometry fits viewport without overlapping the dock, Escape works, and the prior content-preserving expression and alignment checks still run.

## Release gate

- `pnpm exec wrangler types`, `pnpm typecheck`, `pnpm test`, `pnpm build` (GitHub CI).
- Real Chromium at 320 / 390 / 768 / 1440 with screenshots and interaction tests; inspect actual photos, not just a green badge.
- Verify Safari on a physical iPhone: opening Expression must never remove the dock blur; sharp page text behind the picker must become diffused. Check portrait/landscape and the publish dialog.
- Ensure published portfolios and old drafts load without migration.
- Confirm Cloudflare's exact deployed commit after merge; a GitHub build result is not enough.
- Recheck custom domain independently. Do not touch DNS during this branch.

## Reversibility

Do not rewrite Git history or touch D1. If the new experience looks worse, revert the PR's squash commit with a new forward commit and/or select the previously healthy deployment in Cloudflare Workers Deployments. Baseline Git commit above is a reproducible source checkpoint, **not proof of the exact previously deployed Cloudflare version**. Before any Cloudflare rollback, verify its actual deployment ID.

## Next improvements after this structural fix

Use the existing single `Portfolio` schema for optional skill styles, richer projects and art-direction tokens; add a public GitHub import review screen before applying projects; improve measured typography fitting and visible focus. Keep experimental workbench PRs #5–9 as an idea archive, never wholesale merge. Prioritise editing delight, visual quality and regression-free release over stacking hundreds of cosmetic CSS overrides.

## Verification log

Populate with commit SHA, exact GitHub CI and browser workflow URLs, screenshot artifact and Cloudflare deployment result once known. **Do not claim production is updated before that evidence exists.**
