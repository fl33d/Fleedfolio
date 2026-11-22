# Fleedfolio Studio — milestone status

## PR #7 integration checkpoint (22 November 2026)

On review-only branch `feat/studio-shared-editing-20261122`, stacked on PR #6: Simple, Studio and Preview share one Studio Document/history; the original Classic editor remains available at `/` with separate legacy local storage. Changes in Simple do not flatten advanced rich text. A distinct Achievements block, editor, and optional canonical `achievements` collection support awards, certifications, milestones and **GitHub profile badges** with user-supplied HTTPS evidence links. GitHub badges are not API-synced or platform verified. Older v1 archives without the optional collection remain valid. No production deployment, database migration or legacy credential changes occurred. The browser visual verification is being evaluated separately from green source CI.


Updated: 2026-11-22. Branch: `feat/studio-proof-20261122`.
Derived from draft PR #5 head `ca17187659aabd4e0e85723eed01e64b952282d2`.
This branch is **review-only and not a production release**.

## Completed source changes
- Full Studio Document v1 JSON Schema under `src/studio/schema/`.
- Illustrative portfolio document under `src/studio/fixtures/`; invented sample explicitly for development, not a user testimonial.
- Typed canonical identity, projects, skills, project lenses, pages and blocks in `src/studio/document.ts`.
- Dependency-free JSON Schema keyword validation and cross-reference checks. Drafts can have empty names/titles; new document data and render output are separate.
- `StudioView.tsx`: public-style semantic renderer; story and engineering views read a **single canonical project**. External demos are links, not executed scripts.
- `studio.css`: four responsive expressions (Margin, Proof, Collection, Signal) with differentiated typography, density and composition.
- Isolated `/studio` guest proof route: select blocks, edit core text/project facts, add/reorder blocks using buttons, switch aesthetics, undo/redo, autosave to `fleedfolio:studio-draft:v1`, import/export JSON.
- Regression cases in `tests/studio.test.mjs`.

## Verified on GitHub Actions

[Run 45066115529](https://github.com/fl33d/Fleedfolio/actions/runs/45066115529) passed on code commit `763766f76fea8ce0acc7613f327da31f8fc47b18`: clean dependency install, Cloudflare type generation, strict TypeScript, **29/29 tests**, production client build and Worker SSR build. There were earlier failing attempts, fixed by narrowing the lens type and adding the Node JSON import attribute. This is not a visual/browser acceptance result. See `docs/STUDIO_VISUAL_RESEARCH.md` for actual art-direction assumptions and defects to investigate.

## Not yet achieved
- The new route is **not** a replacement for `/` or a public publishing flow.
- Full rich text, all 12 block editors, nested group controls, media bytes, Markdown ZIP, CV projection, source mode, touch DnD, account claims and real-world user testing remain.
- Visual quality has **not** been demonstrated with screenshots of the running React app from this branch.
- Local installation/browser QA has not run; the **GitHub CI build and unit tests have** (see above).
- The full Studio schema is an experiment, not a deployed migration or guarantee of complete legacy compatibility.
- No authenticated runtime, Worker deployment, real D1 migration, custom domains, messaging or payments introduced.

## Untouched
- Production `wrangler.jsonc`, Worker `fleed`, D1 `fleed-portfolios` / `fleed_portfolios`.
- Legacy `/` editor, `/p/{id}`, `/@handle`, `blank:draft`, `blank:published`, token/alias publishing.
- PR #5 and `main`.

## Design direction
Craft-style ease and editorial composition; Fastfolio's clarity about the creation journey; exceptional real portfolios as evidence of what output should achieve. The four earlier draft directions remain **studies**, not locked designs. The new page aims at meaningful content rather than decorative bento shapes, but requires independent visual QA.

## Next release gate
A successful clean build, typecheck, unit run, and real-browser mobile/tablet/desktop inspection; fix defects before asking for approval. Then prove a complete guest portfolio authoring -> validated export -> true publish/update path on local D1/staging, with safe legacy coexistence.
