# Fleed Design Workbench — draft review

**Branch:** `design/editorial-workbench-2026`  
**Draft PR:** https://github.com/fl33d/Fleedfolio/pull/5  
**Production:** unchanged; production `main` is intentionally not merged.

## What to judge first

Review **visual craft before feature count**. The user's established taste favours clarity, refined type, restraint, gentle light surfaces and beautifully organised information—especially the Craft screenshots they supplied—without losing the sharpness of the darker editor. An award-oriented site must also be genuinely fast, editable and accessible.

The **five compositions** have independent layout CSS (not merely palette swaps), in `src/styles/design-compositions.css`:

| Design | Art direction | Difference to look for |
| --- | --- | --- |
| Folio | Quiet dark editorial | Wide name, clear ruled projects, generous but purposeful whitespace |
| Atelier | Tactile warm publication | Paper-coloured hero sheet, editorial serif type, airy work section |
| Index | Architectural / Swiss | Structural section sidebar, precise project rows and numeric rhythm |
| Studio | Expressive gallery | Accent-tinted presentation area and two-column work gallery |
| Terminal | Developer reference manual | Compact mono hierarchy, strong baseline, dotted structural rules |

In **Customise → Design library**, each option shows a miniature live content preview using the current name/role/work title. Layout can be changed separately from palette, font, scale and accent. Older saved pages retain their content and load the Folio layout by default.

The main editor also has a distinctive Fleed wordmark, less typewriter-style metadata, improved contrast, quieter motion, a consistent dark tools dock on any portfolio background, and an in-flow public attribution instead of a floating badge.

## Preview the actual draft app locally

To avoid disturbing the existing source checkout, use a **separate folder**:

```sh
git clone --branch design/editorial-workbench-2026 --single-branch https://github.com/fl33d/Fleedfolio.git fleed-design-review
cd fleed-design-review
pnpm install
pnpm dev
```

Then open `http://localhost:3000`. The Cloudflare Vite plugin should use local development bindings. **Do not run `wrangler deploy` or edit production D1/DNS during this review.**

Alternatively, use the PR's Files Changed tab and a connected browser-capable Work session for browser QA. GitHub Actions only validates compilation/tests/build, not actual visual quality.

## Suggested manual walkthrough

1. Open a **fresh profile** and inspect the default header, name, text contrast, role and large-screen spacing.
2. Visit **Customise → Design library**. Select each composition; verify the writing survives. Then change one palette/font without losing the chosen layout.
3. Type `vi` in **Skills & tools**; navigate with arrows, accept with Tab, enter arbitrary non-tech skills. Check the popover on mobile.
4. Open the **Elements** shelf; click a section and drag one onto the canvas. Verify the new element enters its semantic section, rather than appearing at an arbitrary pixel location.
5. Press Ctrl/Cmd+K and search for Preview, Design library, CV and Publish.
6. Check the **optional first-use walkthrough**; it should be easy to skip and reopen.
7. In Preview, check 375px, 768px and 1440px widths, especially long names, projects, studio's two-column layout, nav and bottom dock.
8. Open CV; inspect A4 print preview and ensure the content remains selectable, readable and free of editor controls.
9. Publish to the **local development D1**, then check a generated `/p/{id}` and a test `/@username`; open **Inspect this page**. It must not expose editing credentials.
10. Save a draft, reload, restore a backup, and try the old production data structure (no `theme.layout`).

## Shipped versus unshipped

**Implemented on the draft branch:** design compositions and real mini-previews; local skills autocomplete; command palette; structured Elements shelf; optional animated walkthrough; CV and publish-link compatibility; public JSON inspector with sanitisation tests.

**Not yet implemented:** secure sign-up, multi-portfolio cloud dashboard, account-only wildcard subdomains such as `hamood.fleed.app`, true arbitrary ordered block canvas, unsandboxed custom CSS editing, GitHub auto-hydration, live image uploads. Those require separate architecture, careful migrations, abuse prevention, and security/UX review. No fake UI for these features should be presented as working.

**Production domain:** `fleed.online` may still need its legacy Netlify routing corrected separately. Do not modify infrastructure as part of a visual review.

## Release gate

Keep PR #5 **draft** until the user has reviewed actual browser screenshots and interacted with the local/preview site. The user has previously rejected a design that was merged too quickly. No visual awards, Lighthouse scores, page-weight targets or browser QA results are claimed without measurement.

Run `pnpm typecheck`, `pnpm test` and `pnpm build` for the final commit, and verify that the GitHub Actions run for the exact SHA is green.
