# Domains and project separation

The portfolio creator in this repository remains **fleed.online**.
Keep its existing Cloudflare Worker `fleed`, public routes, portfolio links, D1,
edit tokens and guest drafts unchanged unless a future explicit release requires
a carefully reviewed modification.

**fleed.app is NOT the destination for this repository.** It is reserved for
a distinct future product or concept. Do not point its DNS at this Worker,
redirect `fleed.online` to it, rename the Worker, or add this repository to
`fleed.app`'s future deployment pipeline.

For the current design work:
- No DNS or nameserver modifications.
- No additional paid infrastructure or new domain registration.
- Deploy only to the existing Fleedfolio Worker using GitHub main and the
  already configured Cloudflare Workers Builds pipeline.
- Keep `fleed.online` stable, including existing public `/p/{id}` and `/@name` links.
