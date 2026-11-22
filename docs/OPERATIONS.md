# Operations and release checklist

These are instructions for the **existing** Cloudflare Worker (`fleed`), not for creating a new Worker. Keep the D1 database `fleed-portfolios` and its `wrangler.jsonc` database ID unchanged.

## Connecting the correct GitHub repository

1. Open the Cloudflare dashboard → **Workers & Pages** → **fleed**.
2. Open **Settings → Builds**. Set the GitHub repository to **fl33d/Fleedfolio** with production branch **main**.
3. If Fleedfolio is absent from the selection list, open GitHub **Settings → Applications → Installed GitHub Apps**, configure the Cloudflare app and grant it access to this repository.
4. Keep the known-working build command **`pnpm run build`** and deploy command **`npx wrangler deploy`**, with repository root as the working directory.
5. Check **Deployments** for a new **Ready** deployment tied to a Fleedfolio commit. A green GitHub Actions check alone does not confirm Cloudflare deployed.

## Fixing a Netlify 404 at fleed.online

A Netlify-branded 404 means requests are still reaching Netlify or a Netlify-related route. It does **not** imply the Worker build failed.

1. Open the existing Worker's **Visit** link (workers.dev) and verify the application works.
2. Open Worker **Domains** and confirm `fleed.online` is a custom domain on this Worker.
3. Check the Cloudflare DNS zone status and DNS records. Remove conflicting old Netlify targets **only after identifying them** and ensuring that no unrelated service (especially email) depends on those records.
4. If the domain's authoritative nameservers are still elsewhere, resolve that separately. Moving the domain registrar is not required just to serve a Cloudflare Worker.
5. Verify both the root domain and any `www` hostname you intend to support.

## Personal URLs: no schema migration

The personal-link feature reuses the existing `portfolios` table. It does **not** require a new D1 table, an API token, or production database migration.

1. Verify the Cloudflare deployment is connected to `fl33d/Fleedfolio` and its production branch is `main`.
2. After GitHub CI succeeds, merge the feature branch. Confirm Cloudflare Workers Builds deploys the exact new commit.
3. Verify an existing generated `/p/{id}` link still opens.
4. In **Customise → Your link**, type a name and publish; verify `/@name` works on the existing `workers.dev` URL.
5. Attempt a duplicate name from a second browser. It must not overwrite the original portfolio; test renaming and updating an existing page.
6. Fix `fleed.online` DNS/custom-domain routing separately; its current Netlify 404 is unrelated to this feature.

### Implementation details

- The main portfolio is still stored at its original generated `id`, with an optional internal `__fleed_slug` field.
- A separate row in the same existing D1 table uses `id = '@' || username`, containing a small pointer to the portfolio ID. It shares a hashed publishing token with the owner row.
- The existing primary-key constraint protects unique usernames. D1 transaction batches update portfolios and aliases together, so duplicate-name conflicts roll back.
- This avoids changing the production schema but is temporary table overloading. A future dedicated alias table should be considered only with a reviewed migration and verified backup.
- Old `/p/{id}` URLs remain supported. Renaming removes the old custom alias but keeps the generated ID.

## Before each release

- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm exec wrangler types`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] Verify successful GitHub CI on the exact commit.
- [ ] Verify Cloudflare Workers Builds deployed the exact commit.
- [ ] Open the live editor and verify draft persistence after reload.
- [ ] Check **Customise → Export backup / Import backup**; an import must ask before replacing the draft.
- [ ] Publish a sample, open it in a private browser, then update it from the original browser.
- [ ] Check mobile viewport, keyboard focus, reduced-motion preference and missing `/p/{id}` state.
- [ ] Verify `fleed.online` no longer shows a Netlify response before retiring old hosting.

## Rollback and incident notes

- Keep the old GitHub repository until this new one has successfully deployed and the domain is verified.
- Cloudflare's deployment rollback is separate from GitHub history; confirm the active version in Cloudflare after a rollback.
- Never expose a publishing edit token, GitHub credential or Cloudflare secret in a bug report or public CI log.
- Back up production D1 data before any migration or deletion. Do not delete the Worker or existing D1 database to troubleshoot DNS.

## GitHub repository presentation

The repository About panel (description, homepage, topics) is GitHub metadata, **not** code. Suggested description:

> Build and publish personal portfolios with React, TypeScript, and Cloudflare Workers.

Suggested topics: `react`, `typescript`, `portfolio`, `portfolio-builder`, `cloudflare-workers`, `tanstack-start`, `vite`.

Add or change them in the GitHub repository **About → Edit** panel. Pin Fleedfolio from the GitHub profile's pinned-repositories editor if desired.
