# Resume Fleedfolio Studio development

**Working branch:** `feat/studio-proof-20261122` (review-only).
**Base:** `design/editorial-workbench-2026`, originally `ca17187659aabd4e0e85723eed01e64b952282d2`. Verify all branch heads again before continuing.

## Start here
1. Read `AGENTS.md`, `docs/STATUS.md`, `docs/TESTING.md`, `src/studio/document.ts`, `src/studio/validate.ts`, `src/studio/validate-schema.ts`, `src/studio/StudioView.tsx`, `src/routes/studio.tsx`, and `src/studio/studio.css`.
2. Clone this exact safe branch into a real development environment. Do **not** replace `wrangler.jsonc` or connect it to production resources.
3. Run `pnpm install --frozen-lockfile`, `pnpm exec wrangler types`, `pnpm typecheck`, `pnpm test`, `pnpm build` and record every result. The local container where this branch was authored could not reach GitHub or install dependencies; these checks are not inferred.
4. Run `pnpm dev` on a local, **non-production** D1 environment. Open `/studio` and the existing `/`, `/p/{id}`, `/@handle` flows with appropriate fixtures.
5. Screenshot 320/375/768/1024/1440 px at each of the four moods. Test long titles, missing assets, blank content, keyboard controls, undo/redo and export/import/reload. Check alignment, contrast and semantics, not only overflow.
6. Fix the first confirmed bugs. The current generated route tree includes `/studio` for immediate compatibility, but TanStack's route generator should regenerate it cleanly and the output must be checked.
7. Confirm drafts preserve data after clearing the last character of a title/name, and after invalid-import failure.
8. Audit the JSON validator against its schema with schema-derived fixtures. The lightweight interpreter only covers the subset of JSON Schema keywords actually used by v1; never present it as a universal JSON Schema validator.

## Visual critique to begin with
- The first public-style page is editorial and information-dense. It deliberately avoids meaningless floating decoration, but still needs evidence that its typographic rhythm is excellent at real widths.
- The first project's structural diagram is a content-derived explanation, not a substitute for a real architecture diagram or a proven metric.
- Test the four moods against the same authentic content rather than equating colour changes with individuality.
- Test a creative designer and an early-career student, not just the bundled systems-developer sample.

## Architectural constraints
- Existing guest-edit credentials/alias semantics are the hardest compatibility boundary; never rewrite the D1 `portfolios` table speculatively.
- `fleedfolio:studio-draft:v1` is separate from `blank:draft`; do not delete or migrate legacy local storage automatically.
- Keep the current legacy public renderer and URLs. Studio publish/update requires a dual-format server reader, explicit version checks and staging tests; it is not implemented in this branch.
- Assets manifest records are **not** uploaded media; do not invent image paths, claim complete exports or execute arbitrary embeds.
- The new schema's portable `revision` is not yet server-authoritative.

## Next well-scoped milestone
After tests and visual fixes: complete reliable block editing and document history, then add a legacy one-way import adapter with real non-sensitive fixtures. Verify that switching any expression leaves facts untouched. Only later connect local D1/staging publication with explicit approval for release.

## Approval
Never merge `main`, PR #5 or this branch, deploy, change Worker/DNS, write live D1, add secrets or incur paid services without explicit owner approval.
