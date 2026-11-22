# Classic workbench — visual and UX review

Date: 2026-11-22 · branch `feat/classic-workbench-revamp-20261122` · draft PR #8 (stacked on PR #7)

## Reason for the redesign

The real user screenshot showed an artistically restrained portfolio canvas whose **editing chrome** was too small and developer-centric: miniature monospaced navigation and labels, a floating bottom dock, and a design settings popover occupying the writing surface. The user explicitly prefers clear Cloudflare Dashboard-style navigation, Craft's approachable tools and Framer's canvas/inspector separation. An expressive Fleed design is useful inspiration, but the public portfolio itself must not become a copy of another product.

Reference material reviewed:
- https://www.framer.com/academy/lessons/framer-interface
- https://www.framer.com/help/articles/how-to-use-the-canvas/
- https://www.craft.do/ and https://www.craft.do/blog/craft-update-3-6-0
- https://developers.cloudflare.com/changelog/post/2026-10-12-unified-dashboard-navigation/

These references inspired **hierarchy and behaviour**, not copied layouts or assets.

## Implemented

- New readable editor-only top bar. The original floating dock stays accessible in *preview*, and the visitor's own header stays separate.
- A hamburger/three-line menu opens a searchable, non-modal **left element library** with grouped inserts. Click or drag to add. Writing directly on any existing inline page field still works while the library is open.
- Design controls appear in a right-side inspector instead of a little dock popover.
- Portfolio header mark: original name/wordmark, initial, existing safe profile image or none. Missing photo falls back to initial; new image uploads are not implied.
- Skills autocomplete expanded to more programming languages, frameworks and other careers. Selected skills show tech logos and names in editing; visitor presentation is names, logos, or both, with accessible text and known-icon fallbacks.
- Aesthetics: larger readable sans controls, high-contrast workspace chrome, restrained translucency/blur, contextual accents, reduced-motion rules. Client's portfolio typeface and palette still stay independently configurable.
- Existing Classic inline fields, portfolio arrays, publishing endpoint, edit credentials, CV, local draft keys and backup format remain intact. Defaults retain original name identity and text-based skills.

## Real browser observation / critique

Source CI run [45081286577](https://github.com/fl33d/Fleedfolio/actions/runs/45081286577): TypeScript passes, **48/48 tests pass**, client/SSR build passes.

The first actual Chromium screenshot pass revealed a poor desktop interaction: at 1440px the open library covered content. This was corrected by reserving left canvas space above 1140px; smaller screens still use a temporary overlay. Tiny inline “add” commands were also raised to readable sans text.

Browser run [45081286571](https://github.com/fl33d/Fleedfolio/actions/runs/45081286571) passed at **320, 390, 768, 1024, 1440px** with no detected horizontal overflow or page exceptions. It exercised library-open inline editing, adding text without losing the current name, language autocomplete, hidden identity, logo-and-name skills, editing/preview state and screenshotted actual React pages. The image artifacts are CI snapshots, not staged or production images. A later source-only change extends snapshot capture to include the library.

Remaining design issues to scrutinise with real creators:
- The original Classic canvas still uses its legacy portfolio composition; the new UI removes friction but does not yet make every output visually outstanding.
- Mobile must overlay its inspector/library by necessity. Confirm focus, panel closing and keyboard use with touch users.
- The inspector has many controls and needs improved progressive disclosure.
- Logo assets use known devicon paths from a CDN with graceful fallback, not a first-party licensed asset pipeline.
- Photo selection is limited to already existing safe image records: the upload endpoint still needs legitimate storage implementation.
- Simple and Studio share a canonical Studio document; Classic has a distinct older format until a tested round-trip adapter exists. Never advertise cross-editor ownership portability as complete.

## Release gate

No `main` merge, DNS, production Worker, D1, edit credential, billing, or live deploy from this branch. Both original Fleed and Fleedfolio configurations previously shared Worker/D1 bindings. Follow `docs/WORKERS_DEV_RELEASE_GATE.md` and verify isolated staging/rollback before requesting approval for `fleed.fleed.workers.dev`.
