# Fleedfolio Studio — testing record

## Classic workbench regression + actual browser gate — 2026-11-22

[Source CI 45081286577](https://github.com/fl33d/Fleedfolio/actions/runs/45081286577) **PASS**: 48 tests, zero failures; strict TypeScript and both builds successful. `tests/workbench-revamp.test.mjs` checks old backup defaults, opt-in branding and skill logo preferences, malformed values and more programming autocomplete. [Chromium QA run 45081286571](https://github.com/fl33d/Fleedfolio/actions/runs/45081286571) **PASS**: inline name changed while non-modal library remained open, text section added without erasing draft, Python completion, right inspector controls, hidden header identity, visitor skill logos+name and preview; widths 320,390,768,1024,1440, zero recorded overflow or JS page exceptions. Screenshots are in GitHub Actions artifact `fleedfolio-classic-workbench-review` (7 day retention). Browser local Workerd used a **CI-only throwaway compatibility date workaround**, not the committed production config; this is not live deployment verification. Existing `blank:draft`, `blank:published`, D1 edit-token publishing, printable CV and older public URLs must still be checked on staging before any real release. The Classic branding and skill defaults remain backwards-compatible. See `docs/CLASSIC_WORKBENCH_VISUAL_REVIEW.md`.


## PR #7 checks — pending current CI

New `tests/achievements.test.mjs` covers canonical achievements, GitHub badges, HTTPS evidence, no invented verification, and compatibility with older Studio v1 documents. Shared-editor tests preserve project skills, advanced rich text and project lenses. The separate `Studio browser QA (review only)` GitHub workflow starts local workerd with a **disposable CI-only** compatibility-date fallback, then waits for React hydration before testing editor round trips at 320, 390, 768, 1024 and 1440 px. Its actual screenshots and test outcome must be checked from the workflow run; do not infer browser acceptance from TypeScript or unit passes. This is never a production release test.


Branch: `feat/studio-proof-20261122`. All reported results must be linked to command logs or GitHub Actions results.

## Verified GitHub CI

[Successful run 45066115529](https://github.com/fl33d/Fleedfolio/actions/runs/45066115529) on commit `763766f76fea8ce0acc7613f327da31f8fc47b18` recorded `pnpm install`, `wrangler types`, `tsc --noEmit`, 29/29 unit tests, client and SSR builds. Earlier runs failed type narrowing and Node JSON import attributes; both were fixed. This does not constitute browser/visual QA.

## Source-level / proposed tests
`tests/studio.test.mjs` adds cases for:
- Valid fixture and unsupported format.
- Strict nested unknown-field and secret rejection.
- Dangerous links and email header injection.
- Duplicate IDs, dangling skill/project refs and disabled project lenses.
- Unsafe asset path traversal.
- Excessive group nesting.
- Empty draft names/project titles.
- Stable canonical facts under all four aesthetic systems.
- Oversized JSON and unsupported arbitrary-code blocks.

## Validation limitations
- Full-schema validation is via a dependency-free interpreter of exactly the JSON Schema keywords used here: `$ref`, `oneOf`, `anyOf`, `const`, `enum`, `type`, `required`, `properties`, `additionalProperties`, string length/pattern, array length/items, integer bounds. Additional semantic reference checks are in `validate.ts`.
- This is **not** a general-purpose, audited JSON Schema engine.
- No guarantee is made about perfect URL validation, malicious embeds, media asset security or production publish controls. The preview treats embeds as external links.
- Editing only supports a subset of the twelve block types; incompletely authored documents are intentionally allowed as local drafts.

## Execution matrix
| Command / QA | Status | Notes |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | PASS (GitHub Actions) | Successful in run 45066115529 |
| `pnpm exec wrangler types` | PASS (GitHub Actions) | Generated Worker types in run 45066115529 |
| `pnpm typecheck` | PASS (GitHub Actions) | TypeScript reported zero errors in run 45066115529 |
| `pnpm test` | PASS (GitHub Actions) | 29 tests passed, 0 failed in run 45066115529 |
| `pnpm build` | PASS (GitHub Actions) | Client and SSR Vite production builds succeeded in run 45066115529 |
| Studio route actual browser screenshot | NOT RUN | There is not yet a running React build in the authoring container |
| Production Worker deploy / live D1 | NOT RUN, PROHIBITED | No production changes authorised |

## Required E2E acceptance
1. Browser at 320, 375, 768, 1024 and 1440: no horizontal overflow, essential content visible, no console errors, sensible focus.
2. Guest Studio: edit identity, add project, update story, enable spec, move block, undo/redo, reload, re-open and export/import.
3. Same document under Margin/Proof/Collection/Signal: facts, navigation, links and enabled lenses preserved.
4. Existing legacy `/` / `/p/{id}` / `/@handle` CV, tokens, aliases and backups unchanged.
5. Malformed imports leave current draft untouched; keyboard-only editing works; media fallback stays readable.
6. Review a print CV separately; the new Studio renderer currently does NOT project to the existing CV.

## Before release
Only change NOT RUN to PASS or FAIL with genuine tool output; never use a green CI badge to claim browser visual quality.
