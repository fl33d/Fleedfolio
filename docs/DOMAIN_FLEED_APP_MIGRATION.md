# Fleed / connect a new domain without moving the application

Prepared 23 November 2026 for the existing Cloudflare Worker `fleed`.

**Status: NOT EXECUTED.** No ownership, DNS access, registrar access, or purchase of `fleed.app` has been verified by the developer assistant. This is a reversible owner-run checklist, not evidence of a successful migration.

## Decision
Use `fleed.app` as the likely new public hostname **only if actually purchased**. Keep `fleed.online` and `fleed.fleed.workers.dev` reachable throughout initial verification. There is no need to change the Worker name, D1 binding, Worker deployment pipeline, GitHub `main`, or portfolio data. Do not transfer domain registration as part of merely attaching a Worker.

## From a phone, if fleed.app is not yet active in Cloudflare
1. Confirm you actually control the registered domain and have access to its registrar account.
2. In Cloudflare's dashboard, use **Domains > Onboard a domain** and enter `fleed.app`. Select Free unless there's a separate approved reason to pay. Review all existing DNS records, especially MX, SPF, DKIM, DMARC, verification, and other subdomains before changing nameservers.
3. Read the two **assigned** Cloudflare nameservers in that zone's Overview; don't use guessed nameservers.
4. If bought through 123 Reg, sign in > **My Products > Domains > Manage > DNS > Nameservers > Change Nameservers > I'll use my own nameservers**; enter Cloudflare's exact two values and save.
5. If DNSSEC has an active DS record at the registrar, safely disable it before changing nameservers, then re-enable with Cloudflare details when the zone is active. Nameserver propagation may take up to 24–48 hours according to 123 Reg; no timings are guaranteed.
6. Check that Cloudflare displays the zone **Active** before continuing.

If `fleed.app` is **already active in Cloudflare**, skip all registrar/nameserver steps.

## Attach existing Worker
1. Cloudflare dashboard > **Workers & Pages** > select existing Worker **fleed** (not create a new Worker).
2. **Settings > Domains & Routes > Add > Custom Domain**.
3. Enter `fleed.app`, then **Add Custom Domain**.
4. Cloudflare creates the relevant DNS record and TLS certificate for that exact hostname. If an incompatible record already exists, inspect/resolve the conflict; do not blindly delete mail records or other existing site records.
5. Verify HTTPS and `/p/{id}` plus any existing `/@handle` URLs using non-sensitive sample links. Check editor load, create, publish, refresh, alias and printable CV.
6. Configure `www.fleed.app` separately if wanted, preferably as a redirect to the root domain using Cloudflare Redirect Rules with a proxied DNS placeholder record per the official docs.
7. Keep `fleed.online` and the previous Worker hostname functional. Decide about an old-domain redirect only after verifying all public portfolios and informing users. Avoid breaking existing public links.

## Do not change
- `wrangler.jsonc` Worker name `fleed` or existing database `fleed-portfolios`.
- D1 ID or binding `fleed_portfolios`.
- `blank:draft`, `blank:published` editing keys.
- `main` branch deployment; do not push this draft PR into production as a shortcut.
- E-mail DNS records unless intentionally changing mail providers.

## Sources
- Cloudflare Custom Domains: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- Cloudflare Full DNS Setup: https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/
- 123 Reg nameserver guide: https://www.123-reg.co.uk/support/domains/how-do-i-change-the-nameservers-for-my-domain-name/
