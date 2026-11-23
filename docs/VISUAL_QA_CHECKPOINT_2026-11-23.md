# Visual QA checkpoint — 23 November 2026

## Scope
Continues the current Fleedfolio implementation without resetting the editor or changing storage. Screenshot feedback identified a publish-success modal that read as a grey opaque slab and an editor dock that looked pasted on, plus the hero's Scroll affordance shifting off its axis.

## Root cause
The prior finishing stylesheet styled `.app .dock`, but the actual component uses `.app .dock.chrome`. More specific selectors in `portfolio-refinement.css` and the narrow-screen media query forced an opaque background. The previous glass layer therefore did not reliably reach the mobile dock. The scroll cue has separate expression-specific hero geometry and earlier absolute positioning, so it needs a rendered geometry assertion.

## Implemented in this checkpoint
- Specific `.app .dock.chrome` overrides, including the 440px mobile breakpoint, with a deep tinted translucent backdrop.
- Publishing panel is a darker translucent neutral surface; text remains fully opaque and readable.
- Scroll cue remains in normal hero flow, centred, with focus visibility.
- Real-browser Playwright test assertions for cue geometry on eight expressions at 320, 390, 768 and 1440px, and for dock backdrop translucency on mobile.
- Existing editor, publishing, D1, draft, and custom domains unchanged.

## Verification
The GitHub workflow `Fleed mobile visual review` runs a real headless Chromium against a local development server. Its screenshots are uploaded as `fleed-home-mobile-review` artifacts. Check its result for the exact head commit; do not infer visual success from TypeScript passing. It does **not** replace physical iPhone Safari QA. The browser test does not publish data.

## Release and next steps
1. Confirm `Fleed CI` and `Fleed mobile visual review` pass on the PR head.
2. Inspect artifacts for `aligned-preview-*` and `scroll-*`, especially 390px Editorial, Glass and Aero.
3. If the new geometry check fails, fix the actual layout and rerun rather than loosening its 5px centring assertion.
4. Merge only after checks pass. Confirm the production Cloudflare deployment of the resulting main commit separately.
5. On a physical iPhone, check the modal after a legitimate Publish/Update, dismiss it, switch Expression → Editorial → Aero, then Edit → Preview. Inspect both dark and light themes.
6. Do not modify `fleed.app`; the existing portfolio stays on `fleed.online`.

## Known limitations
The current QA flow does not open the success modal because doing so would publish data. Modal contrast and backdrop require an isolated mocked visual test or a manual local/browser check before claiming physical visual validation. Avoid inventing deployment status.
