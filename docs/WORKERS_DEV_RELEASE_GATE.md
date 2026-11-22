# Fleedfolio — Workers.dev release safety gate

Updated: 2026-11-22. This document is a **release checklist, not proof of deployment**.

## Intended target and identity

The owner has requested a live build on their existing Fleed Workers.dev deployment. The historically reported hostname is `https://fleed.fleed.workers.dev/`, but the exact active hostname, account, deployment repository and commit have **not** been verified from authenticated Cloudflare access in this session. Do not guess a URL.

**Critical conflict:** Both `fl33d/Fleed` and `fl33d/Fleedfolio` currently have a `wrangler.jsonc` whose top-level Worker is `fleed`, whose D1 binding is `fleed_portfolios`, and whose D1 database is `fleed-portfolios` (ID `c9d8efeb-be77-4cf9-a567-2ee6ee9864c3`). A naive `wrangler deploy` from either repo can overwrite the other app's production release. Never replace `wrangler.jsonc` with TOML or change resource identifiers in order to work around this.

## Before any live action

1. Sign in to the *correct* Cloudflare account through an authenticated, approved tool or dashboard session. Confirm exact account, Worker `fleed`, Workers.dev hostname, custom domain routes, database bindings, source repository, deployed revision and build triggers.
2. Inspect the *currently deployed application*, not only GitHub source. Test a public generated-ID portfolio and a `/@handle` alias with known safe fixtures, and a legitimate existing edit/update flow. Do not publish random test data to live D1.
3. Create a recoverable snapshot of the active Worker configuration/version and a verified, access-controlled D1 backup. Ensure rollback is possible without deleting existing records or invalidating edit tokens.
4. Establish a **fully isolated staging D1** and an independently named staging Worker/preview. **Never assume Cloudflare Worker Previews isolate D1 automatically**; explicitly configure preview D1 bindings and verify account/resource IDs. No production data writes during tests.
5. Test the complete candidate on staging: guest draft/edit, Simple ↔ Studio, Classic compatibility, export/import, CV, `/p/{id}`, `/@handle`, ownership protection, publishing/update, reserved slugs, no secrets leaked, accessibility and mobile browser. Studio Document publishing and dual-format migration are **not yet implemented**, so this gate currently fails.
6. Record source SHA, test evidence, exact rollback steps, release owner approval and expected release target. Never merge draft PRs or change main/deployment settings solely to trigger a build.
7. If approved and every previous gate passes, release only to the verified intended Worker via the configured deployment mechanism. Verify live HTTP responses, exact hostname, old URLs and editing functionality immediately after; roll back if any critical check fails.

## Current checkpoint

- PR #5 (`design/editorial-workbench-2026`) and PR #6 (`feat/studio-proof-20261122`) are unmerged drafts.
- PR #7 (`feat/studio-shared-editing-20261122`) adds a real Simple/Studio shared-document UI and local browser QA workflow, layered on PR #6.
- The new Studio route is isolated from production publishing, accounts, D1 migration and legacy edit tokens. **It is not safe to replace the existing production editor with this route yet.**
- No Cloudflare credentials or authenticated dashboard deployment access were available in this session; even a green GitHub build is not release authorisation or proof of a live deployment.
- The owner explicitly wants a live Workers.dev result when it is genuinely safe. Preserve that objective, but do not silently override this gate.

## Sources

- https://developers.cloudflare.com/workers/previews/configuration/
- https://developers.cloudflare.com/workers/previews/resources/
- https://developers.cloudflare.com/workers/wrangler/configuration/
- Repository `AGENTS.md`, `wrangler.jsonc`, `docs/STATUS.md`, `docs/RESUME.md`.
