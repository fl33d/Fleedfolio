# Product research — what to learn, not copy

This note reviews publicly visible portfolio products and projects found in November 2026. Open-source stars and discussion votes indicate visibility or interest, **not** verified user counts, retention or revenue. The goal is to identify good product decisions without lifting anyone's design, copy or code.

## Examples worth studying

| Project | Observed approach | What Fleedfolio can learn | Source |
| --- | --- | --- | --- |
| [developerFolio](https://github.com/saadpasta/developerFolio) | A well-known React developer portfolio with GitHub project connections, multiple showcase sections and reusable configuration. | Make the first published portfolio useful without requiring visitors to learn a big visual editor; optional GitHub import can be a later enhancement. | [Repository](https://github.com/saadpasta/developerFolio) |
| [al-folio](https://github.com/alshedivat/al-folio) | Popular open-source academic portfolio theme with a focused information architecture. | Separate visual hierarchy from feature count; support writers/researchers and different types of work, not just developers. | [Repository](https://github.com/alshedivat/al-folio) |
| [DevFolioX](https://github.com/srbmaury/Portfolio-Builder) | Portfolio builder with resume-derived content, customizable layout, GitHub import and SEO-oriented public metadata. | Shorten time-to-publish and invest in share previews and search discoverability. Verify any import permissions and data quality. | [Repository](https://github.com/srbmaury/Portfolio-Builder) |
| [Ownz](https://github.com/ownz-network/ownz) | Self-hostable link-in-bio and portfolio page builder, emphasizing simple URLs and gallery/links. | A memorable personal link plus a clear, well-presented profile is more useful than a bloated dashboard. | [Repository](https://github.com/ownz-network/ownz) |
| [microfolio](https://www.reddit.com/r/sveltejs/comments/1xdh56u/microfolio_10_a_static_portfolio_generator_for/) | A design-led static portfolio generator; an October 2026 community post received visible engagement. | Make the output fast, lightweight and attractive; avoid loading unnecessary UI on public pages. | [Discussion](https://www.reddit.com/r/sveltejs/comments/1xdh56u/microfolio_10_a_static_portfolio_generator_for/) |
| [MyGitFolio](https://www.reddit.com/r/vibecoding/comments/1q42pbl/i_vibe_coded_a_page_that_turns_your_github_into_a/) | GitHub-name-to-portfolio generator; its January 2026 community post received hundreds of votes. | Strong, demonstrable onboarding outcomes are easy for people to share. A verified GitHub import could be a useful optional feature. | [Discussion](https://www.reddit.com/r/vibecoding/comments/1q42pbl/i_vibe_coded_a_page_that_turns_your_github_into_a/) |

## Prioritised decisions

1. **Personal links:** claim a unique `/p/name` alias for a published portfolio, while keeping the original generated link functional. Do not introduce account requirements merely to add vanity URLs.
2. **Data portability:** JSON export/import, preserving work without relying on browser storage; keep publishing credentials out of exported files.
3. **Public-page quality:** resilient metadata, accessible semantic markup, responsive typography and measured motion. Verify rather than claim Lighthouse scores.
4. **Fast onboarding:** ship a clear example/demonstration path and avoid an empty experience. Do not import third-party profile data without user consent.
5. **Sharing and growth:** only after the domain works, improve OG/Twitter previews, canonical URLs and project-specific share content. Do not pursue artificial GitHub stars or fake metrics.
6. **Future integrations:** read-only GitHub project import may help developer audiences, but it is not worth delaying basic publishing, D1 safety and domain routing.

## What not to do

- Copy another project's UI assets, proprietary text, code or licensed designs.
- Claim a feature is working before testing it end to end.
- Claim a project has paying users merely because it has stars/upvotes.
- Create expensive infrastructure, AI features or user tracking without a demonstrated need.
- Rebuild the frontend from scratch simply to match current design trends.

## Pending verification

- Real users should test how long it takes to create and publish a portfolio from a fresh browser.
- Benchmark mobile layout, accessibility, performance and shared-page metadata against live examples.
- Record website traffic and conversion only with privacy-respecting analytics if there is a genuine product reason.
