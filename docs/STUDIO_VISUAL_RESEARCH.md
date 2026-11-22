# Studio v1 — Art-direction decision record (provisional)

2026-11-22 · `feat/studio-proof-20261122` · **Not an approved final visual identity.**

## Three evidence families, three different responsibilities

### Craft — experience and composition
Sources: https://www.craft.do/ ; https://www.craft.do/imagine/personal-blog ; https://www.craft.do/templates/design-showcase

Observation from current product material: Craft's surfaces are often warm, inviting and highly legible, while its examples show real documents and actual workflows. A beautiful card matters when the content inside it is worth reading. Its block model reduces the cost of writing and arranging, and page presentation benefits from the structure of the authored content.

**Use in Fleed:** restrained, tactile editing controls; strong editorial type; obvious add/reorder interactions; first-use screen showing a meaningful result rather than an empty dashboard.

**Reject:** copying Craft's signature colour, card arrangements or decorative paper scraps. Surface warmth is not a design system.

### Fastfolio — product comprehensibility
Sources: https://www.fastfol.io/ ; https://www.fastfol.io/explore

Observation: Fastfolio puts shareable portfolio examples and an understandable path to an outcome in front of the user. Its central AI-assisted value proposition differs from Fleed's creator-authored studio. Visible example portfolios help new users understand what they can achieve.

**Use in Fleed:** accessible preview before configuration, truthful design miniatures with real sample content, clear local draft vs published state, minimal steps before a usable portfolio.

**Reject:** treating import-by-AI as the product's identity or copying its marketing structure. Do not invent user counts, testimonials or conversion figures.

### Real creator portfolios — actual output quality
- https://brittanychiang.com/ — clear information hierarchy; a visitor can quickly find the work, experience and contact details.
- https://chanhdai.com/ and https://chanhdai.com/components — portfolio work functioning as verifiable components, public code and reusable technical material.
- https://bruno-simon.com/ — a genuinely interactive experience with controls, fallback/behind-the-scenes material, not simply decorative WebGL.
- https://dustinbrett.com/ — functional desktop-like software demonstrates capability by being an artifact.
- https://leerob.io/ — writing and engineering practice are central, not decoration.

These examples show *different* virtues. Their GitHub stars, if quoted, measure attention to code and should never be misrepresented as site traffic or a confirmed popularity ranking. The user-provided directory of 2,125 primary portfolios is indexed, **not individually visually audited**.

## What v1 implements as a test, not as a conclusion

The first Studio renderer is intentionally built around authored facts: a name, headline, explanation of work, a specific project, skills and contact links. It supports four treatments on a shared content model:

- **Margin / Atelier:** warm editorial pacing, strongly differentiated serif display typography, broad page margins and project case study details.
- **Proof / Index:** more compact, dark, evidence-led typography and technical structure, with deliberate alignment and rules.
- **Collection / Studio:** more graphic arrangement, bold sans typography and visual colour blocking, without stock pseudo-media cards.
- **Signal / Terminal:** restrained systems-journal typesetting; no fake command results or decorative network graph.

The project overview is intentionally *not* a fictional statistic. When an engineering spec is present, its diagram is a **content-derived summary** of stated problem, approach and output. It does not claim a real deployment architecture. The demo lens opens external content without executing scripts inside Fleed.

## First self-critique — these are risks to test in real screenshots

1. **Hero scale:** the typography may overwhelm real project details on 320–375px phones. Verify wraps and leading against actual viewport captures.
2. **Editorial length:** one example project is insufficient to verify that multi-project lists maintain rhythm and density.
3. **System difference:** CSS changes composition and type, but full design freedom will require block-specific variants and responsive layout controls, not just the four `data-system` styles.
4. **Performance:** the new CSS adds to an already large global stylesheet; measure emitted assets before expanding further. CI produced a combined client CSS of 128.82 kB (25.19 kB gzip) for this build, not a public-performance score.
5. **Images:** no real media is available. An excellent visual portfolio must be reviewed with actual licensed project images *and* missing-media cases.
6. **Editor usability:** the right-panel block controls are usable as a proof, not yet Craft-like inline rich editing. The proposed design needs actual novice observations.
7. **Authenticity:** the sample Rowan Park / Harbour project is fictional. It is testing content structure and visual hierarchy, not demonstrating a real person's career achievements.

## Release-quality gate (not yet passed)

Capture and manually inspect **actual React screenshots** at widths 320, 375, 768, 1024, 1440, for each expression and for student, engineer, designer and writer examples. Test content changes, long names, keyboard focus, reduced motion, and missing media. Compare against *full-size* benchmark pages, not thumbnail moodboards.

Assess composition, typography, content credibility, editorial pacing, interaction, mobile reflow, personal identity, accessibility, usable output and measured loading performance. No design receives approval from passing only tests or a subjective one-person score.

**Next decision:** improve the strongest original public portfolio result, then build the editor *around how someone can actually author that result*. No premature marketing/dashboard/social network screens.
