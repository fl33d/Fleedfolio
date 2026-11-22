# Contributing

Thanks for taking an interest in Fleedfolio. Small, focused improvements are preferred to large rewrites.

## Getting started

1. Read [the README](README.md) and [architecture notes](docs/ARCHITECTURE.md).
2. Use Node.js 24 and pnpm 9; run `pnpm install --frozen-lockfile`.
3. Create a branch for your change. Do not commit secrets or `.dev.vars` files.
4. Run the following before opening a PR:

```bash
pnpm exec wrangler types
pnpm typecheck
pnpm test
pnpm build
```

5. Explain what changed, which checks you actually ran and how to reproduce any visual or browser-specific behaviour.

## Boundaries

- Do not change the production Worker name, Cloudflare domain or D1 database ID.
- Do not add Netlify configuration, paid services, secrets, user tracking or an image-storage backend as a shortcut.
- Keep published pages read-only and reuse the same portfolio rendering component for editing and visitors.
- Preserve the legacy browser draft and publishing keys so existing users keep their work.
- Keep motion optional, use semantic controls and ensure keyboard access.
- If a change affects imported or published data, add a regression test.

## Reporting issues

Use a GitHub issue with clear reproduction steps, expected behaviour, actual behaviour, browser/device and screenshots when useful. **Never post edit tokens, passwords, personal contact details or API keys.**
