# Architecture

Fleedfolio is a browser-based editor with a small server-side publishing layer. This document describes the current implementation, not a proposed redesign.

## Request and data flow

1. The home page (`src/routes/index.tsx`) renders the editor and browser-side draft.
2. Changes update React state and are saved under the legacy `blank:draft` localStorage key. That key must remain compatible with existing drafts.
3. **Customise → Your work** exports the draft as versioned JSON, without publishing credentials. An imported backup restores content only.
4. **Publish / Update** calls `publishPortfolio` in `src/server/portfolio.functions.ts`.
5. `src/server/portfolio.server.ts` validates publishing credentials and writes published JSON to the existing D1 table `portfolios`. Optional personal links are mapped to the same portfolio ID by the `portfolio_slugs` table added in migration 0002; names are unique and validated.
6. Existing visitors use `/p/{id}` while custom-link visitors use `/@{name}`. Both routes resolve the same stored portfolio and render it read-only.

## Storage and trust boundaries

| Data | Location | Notes |
| --- | --- | --- |
| Draft content | Browser localStorage | Not synchronized across devices |
| Published page content | D1 `fleed-portfolios` | Publicly accessible using the portfolio ID |
| Publishing edit token | Browser localStorage (`blank:published`) | Secret, not included in portable backup |
| Public page | Cloudflare Worker `fleed` | Read-only rendering for visitors |

Only the server accesses D1 through the `fleed_portfolios` binding. Incoming portfolio content is normalized with length limits, known theme options, allowed section names and safe image paths. Visitor links are checked with `safeUrl` before rendering.

## Important constraints

- **No accounts, billing or server-side draft sync.** A browser-only draft can be lost if browser storage is cleared.
- **Publishing tokens are tied to a browser.** Importing a JSON backup cannot update a previously published page without the original token.
- **Image upload and image retrieval are disabled.** Their routes return 503 and 404, respectively. Do not claim uploads work until a real storage backend is added and tested.
- **The existing D1 database ID and Worker name are production resources.** Never overwrite or recreate them in order to connect a GitHub repository.
- **Fleedfolio is the portfolio repository.** Other Fleed products must not be silently merged into it.

## Main files

- `src/components/portfolio/Portfolio.tsx`: shared portfolio display/edit components.
- `src/components/portfolio/Customize.tsx`: theme, section and backup controls.
- `src/lib/portfolio.ts`: types, defaults, normalization and URL helpers.
- `src/lib/portfolio-backup.ts`: portable, versioned JSON backup format.
- `src/lib/portfolio-slug.ts`: custom link format, normalization, reserved names and public link generation.
- `src/routes/@{$slug}.tsx`: dedicated `/@name` public portfolio route.
- `migrations/0002_portfolio_slugs.sql`: personal-link aliases, pending a deliberate production migration.
- `src/server/portfolio.functions.ts`: typed server function boundary.
- `src/server/portfolio.server.ts`: D1 reads and writes.
- `wrangler.jsonc`: Worker configuration and the existing database binding.
- `tests/portfolio.test.mjs`: input/backup regression tests.
