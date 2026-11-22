# Fleedfolio Studio — testing record

Branch: `feat/studio-proof-20261122`. All reported results must be linked to command logs or GitHub Actions results.

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
| `pnpm install --frozen-lockfile` | NOT RUN | No network access for dependency installation in the authoring container |
| `pnpm exec wrangler types` | NOT RUN | Requires a full checkout and node_modules |
| `pnpm typecheck` | NOT RUN | Requires a full checkout and node_modules |
| `pnpm test` | NOT RUN | Tests are committed but not yet executed against a checkout |
| `pnpm build` | NOT RUN | Requires full dependency installation |
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
