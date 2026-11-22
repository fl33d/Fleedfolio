# Fleedfolio — Design direction

## Why the revamp exists

The original experience used too many familiar “template” signals: a giant empty hero, floating dock, progress donut, autoplay text effects, animated skill ticker, decorative background ring and a success modal that looked like a loading screen.

Those effects drew attention away from the actual work. Fleedfolio should make the **person and their projects** feel intentional, not advertise the tools used to build the site.

## Reference research (22 November 2026)

These are references to editorial and interaction principles. We are not reproducing their copyrighted images, CSS, layouts or copy.

| Reference | Specific observation | Lesson |
| --- | --- | --- |
| [Awwwards portfolio gallery](https://www.awwwards.com/websites/portfolio/) | The gallery collects diverse creative portfolios rather than one standard layout. | A system should support the creator's identity instead of forcing everyone into a generic hero and cards. |
| [CSS Design Awards](https://www.cssdesignawards.com/) | Award pages explicitly distinguish UI, UX and innovation. | Interaction quality matters as much as visual effects; effortless editing can be an innovation. |
| [Huy Phan Vol.2 — CSSDA](https://www.linkedin.com/posts/cssda_website-of-the-day-10-september-2026-huy-activity-7503722877410521090-wjUa) | Editorial hierarchy pairs clear project metadata with large media and confident type. | Use useful project content and restrained typography before adding motion. |
| [Gionatan Nese — editorial review](https://dokle.design/awards/gionatan-nese-portfolio-homepage-pile-of-thumbnails) | Strong contrast between type families and project work can create a clear artistic signature. | Use contrast deliberately; don't put every UI label in the same tiny monospaced font. |
| [Adrian Vlasov — CSSDA](https://www.cssdesignawards.com/sites/adrian-vlasov-portfolio/50043/) | Bold typography and cinematic transitions within a focused visual identity. | Optional, selective motion is better than applying an entrance animation to every element. |

## What is now different

1. **Edit what visitors see.** One page doubles as a real portfolio and its editor; headings and copy are written in place rather than buried inside a form-builder sidebar.
2. **Tell the story first.** New pages begin with a tighter introduction, clear role and background, and labelled fields. The default is not a blank full-viewport spectacle.
3. **Use meaningful project indexes.** Skills are a readable, static list rather than a continuously moving ticker. Projects remain structured and readable when images are absent.
4. **Keep motion optional.** Empty placeholders no longer pulse; the default huge background effect is off. Existing users who enabled decorative effects can turn them off in Customise.
5. **Treat publishing as a complete experience.** The share panel lets you edit your `/@username` link directly, then copy and open the canonical URL.
6. **Welcome beginners without trapping them.** Five skippable steps explain the workflow. A help icon reopens the walkthrough.
7. **Keep trust.** No fake testimonials, counters, artificial GitHub stars, invented statistics, unverified image upload claims or unnecessary user tracking.

## Next design experiments — not built yet

- A **project storytelling mode** that gives users control over which work receives an editorial feature spread, rather than treating every project as identical.
- Actual **mobile and tablet visual regression** review of the hero, dock and publishing panel with real content, long URLs and long names.
- A narrow, accessible set of **content patterns** (minimalist résumé, designer case studies, creative gallery) that share the same publishing engine.
- Dedicated preview-image metadata for public `/@username` pages.
- Real usability tests measuring whether a new visitor can write and publish a first portfolio without needing explanation.

**Not a goal:** building a carbon copy of an award-winning page or adding WebGL simply to look impressive.

## Checklist for visual changes

- Does the content remain readable without animation, media or a hover-capable device?
- Can a keyboard user find the same controls?
- Does a new portfolio look balanced at 375px, 768px and 1440px widths?
- Do empty fields look like deliberate prompts rather than unfinished demo content?
- Would this element still make sense without its visual effect?
- Is the before/after improvement visible in a real browser screenshot?

## Reference study — product and typography (November 2026)

A second pass across live examples looked for **repeatable interaction decisions** rather than eye-catching effects. The design should feel like a genuine tool, not an awards-page imitation.

| Reference | Distinctive approach | Fleedfolio's adaptation |
| --- | --- | --- |
| [Framer — portfolio website builder](https://www.framer.com/solutions/portfolio-website/) | Work in context, make changes visually, preview responsive layouts and publish without a handoff. | Keep inline editing, immediate Preview, memorable share links and a consistent Save/Update flow; avoid a page-builder dashboard. |
| [Visualfolio on Framer](https://www.framer.com/marketplace/templates/visualfolio/) | A restrained portfolio with style guidance and clear editing documentation. | First-use walkthrough plus a permanently accessible Help action; use concise explanations at the exact step where they matter. |
| [FOLIA on Framer](https://www.framer.com/marketplace/templates/folia/) | Editorial case studies with a résumé page alongside the work index. | One source of portfolio information feeds a separate, printable CV mode, using Education, Experience, Skills and Projects. |
| [Satz on Framer](https://www.framer.com/marketplace/templates/satz/) | Projects presented within a strong typographic grid, with emphasis on selection and hierarchy. | A readable project index, limited text hierarchy and structured project descriptions instead of endlessly repeated glowing cards. |
| [Canvasfolio on Framer](https://www.framer.com/marketplace/templates/canvasfolio/) | A more expressive canvas for personal work. | Allow restrained differentiation through type, layout and accents, without copying draggable canvases that make mobile and CV layouts harder. |
| [Readymag's minimal portfolio guide](https://blog.readymag.com/the-minimal-portfolio/) | Clear grids, limited palette, negative space, easy navigation and showing only as much work as a viewer needs. | Static skills, concise project rows, optional atmosphere and a faster route from introduction to actual work. |
| [Carter Ogunsola — CSS Design Awards](https://cssdesignawards.com/sites/carter-ogunsola/50321/) | Portfolio recognised for its presentation and interaction design in November 2026. | Consider the overall navigation and accessibility of a portfolio, not merely its animation count. |
| [OGfolio on Framer](https://www.framer.com/marketplace/templates/ogfolio/) | A calm portfolio template with a documented design-system page and a quick-start guide. | Keep central design rules and first-use instructions in the repository; avoid one-off CSS changes that have no consistent rationale. |

### What to borrow, what to reject

**Borrow:** content-first hierarchy, purposeful page transitions, editable-in-place text, resilient defaults, a strong portfolio/CV split and thoughtful project ordering.

**Reject:** cursor gimmicks, loading-screen circles, looping decorations, automatic massive headlines on an empty page, hard-to-read tiny labels, invented achievements, inaccessible scroll hijacking and visual flourishes that delay a visitor reaching projects.

**Product principle:** the distinguishing interaction is not a flashy landing page; it is the ability to go from editing an authentic story to publishing an individual web presence and printable CV without re-entering information.

### Next areas worth validating in a browser

- Look at a **real profile with long text**, not a clean demo. Short placeholders alone can hide overflow problems.
- Inspect the editable share panel and CV on both a narrow mobile view and a large desktop view.
- Check print output with a two-page CV: entries should not split awkwardly and no editor controls should print.
- Compare a new user's understanding with and without the walkthrough; the guide should not become mandatory.
- Verify a published `/@username` link, a duplicate-name error and retention of an old `/p/{id}` URL.
