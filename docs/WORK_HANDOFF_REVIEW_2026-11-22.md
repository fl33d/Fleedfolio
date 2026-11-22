# Fleed: product review and Work handoff

**Reviewed:** 22 November 2026  
**Repository:** `fl33d/Fleedfolio`  
**Review branch:** `design/editorial-workbench-2026`  
**Pull request:** https://github.com/fl33d/Fleedfolio/pull/5  
**Base:** `main` at `8fbd2a452465191c3570e734d684d9e456b2d611`  
**Status:** review-only. Do not automatically merge this branch into the live Worker.

## The vision, as established across the conversation

Fleed is a beautiful **free, guest-first portfolio + CV builder**, not a website-template gallery, not a copy of Framer, and not an account-required SaaS. Someone can immediately begin writing on a blank page, with a short animated walkthrough that is **optional and skippable**. As they progress, they can discover a design library, structured draggable elements, a skills command popover, keyboard actions, and printable CV output.

The app should feel like a genuinely original editorial workbench: simple enough for a first-time applicant, expressive enough for a creative, and precise enough for a developer. Power is progressively disclosed. Users can tune the layout, type, colours and blocks without understanding CSS. In the advanced future, they may inspect and edit constrained styles.

Reference principles (do not copy visual assets): **Read.cv / Posts.cv** for structured profiles, **Craft and Notion** for inline writing and elements, **Linear and Raycast** for precision and keyboard actions, **Framer** for immediate visual feedback, **Bento/Layers** for approachable link presentation, and **Awwwards/CSS Design Awards** for distinctiveness and craft. The user's screenshots showed a desire for IDE-like elements panels and drag-to-place composition, not uncontrolled absolute pixel positioning.

The target URL is `fleed.online/@username`. The current working domain has been `fleed.fleed.workers.dev`. The custom `fleed.online` domain previously still displayed Netlify's 404 and must be fixed **separately and cautiously**.

## Design audit: what specifically felt wrong

The old screenshot presented an isolated letter badge at the top-left; a row of small, hard-to-read typewriter-style navigation pills; a useless "Editing your portfolio" label; a very tall hero with lots of unused vertical space; decorative accents competing with fields; inconsistent type hierarchy; and a floating dock that risked becoming a bag of icons.

The existing code was also heavy with tiny monospaced controls and public name animation. A redesign should keep the structural hairlines and numbered section rhythm, but make the interface genuinely readable, calm and expressive. The portfolio content should get the attention, not the component library.

## Already working before this review branch

- React/TanStack Start/Cloudflare Worker portfolio editor and publishing.
- Existing D1 schema and hashed edit tokens; legacy `/p/{id}` URLs and `/@username` aliases.
- Backup import/export, edit/preview, sections, project ordering, themes, CV/education view.
- Share panel with editable username, copy/open controls.
- Skippable walkthrough.
- CI with type checking, unit tests, production build.

Do **not** restart, remove or replace these.

## Implemented on this review branch

1. **Original Fleed header language:** Replace the badge with a lowercase wordmark; get rid of boxed top-nav buttons; use readable editorial sans-serif navigation, small actionable keyboard hint and quieter hero spacing. Old saved palettes/typography remain intact; new drafts start with a cleaner sans default.
2. **Designed CSS recipes:** Five curated presets in Customise: Folio, Atelier, Index, Studio and Terminal. They update ordinary theme fields without mutating any person's actual projects or bio. They are recipes, not copies of template sites.
3. **Skills suggestions:** A local, curated catalogue that combines tech and non-tech fields. Type `vi` to see Vite/Vim/Vitest/Visual Studio Code/Video Editing. Arrow navigation, Tab/Enter selection, escape, fallback plain-text skill entry and optional vector Devicon previews. No network call per keystroke.
4. **Keyboard command palette:** Ctrl/Cmd+K; searchable commands for edit, preview, CV, design library, page sections, theme, publish and copy link.
5. **Elements shelf:** Click to add or drag onto the canvas for text, project, experience, education, skills and contact. Native desktop DnD with click fallback for touch/mobile. New items go into their semantic section, not an arbitrary screen coordinate, protecting mobile flow and CV.
6. **Clearer onboarding:** A gentle, short step transition; explicit guest/no-account wording; permanent help control. Visitors can skip.
7. **Removal of the letter-by-letter public name reveal.**

**Explicit limit:** This is **not** a full drag-anywhere absolute-positioned IDE canvas or a true arbitrary ordered block engine. It is a safe, structured first step.

## Deferred features that warrant a full Work implementation

### A. Secure optional accounts and dashboard (major project)

- Guests can write, export, print and publish without creating an account.
- Later, users may **optionally** sign up via verified email/passkey/OAuth and claim an existing guest portfolio by proving possession of its edit credential to the server.
- Dashboard lists **multiple portfolios**, their title, status, last edit and public link; edit, duplicate, archive and choose a custom URL.
- Design user-owned `users`, `portfolio_ownership`, `sessions` and claims with an additive, tested D1 migration; do not overwrite existing `portfolios` or invalidate guest ownership.
- Cookies should be HttpOnly, Secure, SameSite appropriate, with CSRF prevention and rate limits. Never store raw edit tokens in browser-readable public data.
- A subdomain such as `hamood.fleed.app` should be **account-only if that domain is actually owned, intended for this product and safely configured**. Do not assume rights to `fleed.app`; the user has said another project may need their .app domain. Confirm ownership/availability and decide the domain first. Then plan wildcard DNS/TLS, exact host-to-portfolio mapping and anti-takeover handling. No DNS changes until authorised.
- Avoid fake account/demo buttons before real server-side auth exists.

### B. Composable ordered blocks (schema v2)

- Introduce `schemaVersion`, stable block IDs, `blocks: [{id,kind,order,data,styleVariant}]`, reusable content references and a tested migration from the current named `about/projects/experience/education/extras` arrays.
- Drag/drop must work with keyboard and touch, allow insertion points and show an accurate placement preview. Avoid inaccessible free-positioned canvases and lost content. Make CV conversion deterministic.
- Support additive text/image/links/projects/time line/skills/contact blocks without silently changing the public page.
- Offer undo/redo, explicit delete, save-state feedback and clear draft recovery.
- Keep a strict schema validator. Test older published portfolios and backup compatibility.

### C. Safe advanced CSS tools

- Expand the curated CSS design recipes with carefully crafted layout variants, typography pairs, colour accessibility and previews.
- Optional **advanced** theme editing can expose design tokens and custom component styles in an isolated preview. Avoid unsandboxed arbitrary CSS injection into shared public pages.
- Consider style presets as portable data, not remote executable CSS. Publish only after sanitisation, CSP review and performance checks.
- An IDE-like panel can offer side-by-side code/preview **without** forcing beginners to see it.

### D. Public developer features and quality

- Publish a sanitised read-only JSON representation, never ownership/auth fields.
- Optional GitHub project import with rate-limited, cached server fetch and user-controlled overrides; keep manual project entry.
- Per-profile SEO and social previews, canonical URL, Open Graph image, proper heading structure and verified accessibility.
- Measure Lighthouse, transferred page weight and hydration rather than inventing 100/100 or sub-50KB claims.
- Check CV exported PDF with real content, including two-page overflow and selectable text.
- Audit disabled image upload routes (currently previously known as returning 503/404) before advertising image-upload capabilities.

## Priority and release gates

1. **Now:** review the new design visually at 375, 768 and 1440px with populated content; verify the Editor, Preview, CV and share dialog. Run the full GitHub CI; fix warnings and regressions. Do not merge automatically.
2. **Next:** improve the Elements shelf into stable, reorderable blocks and prove a real novice can complete a portfolio in minutes. Preserve existing guest publishing.
3. **Later:** optional secure accounts/dashboard and custom subdomains, with a safe D1 migration. Only then add advanced CSS edit/export and larger developer integrations as justified.

**Non-negotiable:** never delete/recreate the existing Worker, D1 database, GitHub original repository or previously published portfolios. User approval is required before any further large visual merge.

## Work-ready continuation instruction

> Continue the existing `fl33d/Fleedfolio` project from PR #5 (`design/editorial-workbench-2026`). Do not restart or copy a competitor. First inspect commits, CI, design references, routes, stored schema and screenshots; preserve a checkpoint. Review the changed UI in a real browser at mobile, tablet and desktop widths and fix genuine defects. The user prefers a distinctive editorial workbench with guest-first inline editing, optional skippable animated onboarding, discoverable advanced tools, a block shelf, an optional future account/dashboard layer, user-customisable designs and excellent CV output. Separate implemented features from proposed ones. Advance only the highest-value feature in small tested PRs. Never merge major visual redesigns or alter D1/DNS/auth infrastructure without a verified, reversible plan and the user's approval. Report working examples, test outcomes, screenshots and any blockers accurately.
