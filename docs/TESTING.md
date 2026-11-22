# Fleedfolio Studio — testing record

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


## PR #9 refinement verification (22 Nov 2026)
- Source commit: see `design/creator-studio-refinement-20261122` head (do not conflate with PR #6).
- CI after the source change: **not yet verified** (no associated workflow run found at the time of the review).
- React `/studio` screenshots / interaction tests: **NOT RUN** in this execution environment (source not locally installable from GitHub due network restrictions).
- Required: `pnpm install --frozen-lockfile`, `pnpm exec wrangler types`, `pnpm typecheck`, `pnpm test`, `pnpm build`; fix failures on the safe branch.
- Required browser QA: open `/studio`; test search, categories, all eight add buttons, drag-to-position, code edit, timeline selection, undo/redo, file import/export, mobile layout at 320/390/768/1024/1440, keyboard use and reduced motion. Check long-content rendering, blank docs and sanitized visitor output.
- Required compatibility check: existing `/`, `/p/{id}`, `/@handle`, backup, CV and edit tokens continue working. No production data should be used for the first regression run.

Standalone `Fleedfolio_Next_Integrated_Experience.html` test evidence is separate and may not be used as proof that this source branch passes its E2E release gate.
