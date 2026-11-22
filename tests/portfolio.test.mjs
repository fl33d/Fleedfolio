import test from 'node:test'
import assert from 'node:assert/strict'

import { blankPortfolio, mailtoHref, normalizePortfolio, reorderItems, safeImage, safeUrl } from '../src/lib/portfolio.ts'
import { createPortfolioBackup, parsePortfolioBackup } from '../src/lib/portfolio-backup.ts'
import { normalizeCustomSlug, portfolioPublicPath } from '../src/lib/portfolio-slug.ts'
import { portfolioCvText } from '../src/lib/cv.ts'
import { DESIGN_PRESETS, applyDesignPreset } from '../src/lib/design-presets.ts'
import { suggestSkills } from '../src/lib/skill-catalog.ts'
import { addPortfolioElement } from '../src/lib/portfolio-elements.ts'
import { publicPortfolioDocument } from '../src/lib/public-data.ts'

test('safeUrl rejects executable or unsupported protocols', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,x', 'vbscript:msgbox(1)', 'file:///etc/passwd']) {
    assert.equal(safeUrl(value), undefined)
  }
})

test('safeUrl accepts ordinary links', () => {
  assert.equal(safeUrl('example.com'), 'https://example.com/')
  assert.equal(safeUrl('https://example.com/path'), 'https://example.com/path')
})

test('mailtoHref accepts one address but no URL queries or header injection', () => {
  assert.equal(mailtoHref(' hello+tag@example.com '), 'mailto:hello+tag@example.com')
  for (const value of ['not-an-email', 'foo@', 'foo@example.com?subject=hi', 'a@b.com%0d%0a', 'a@b.com\nBcc:x@y.com']) {
    assert.equal(mailtoHref(value), undefined)
  }
})

test('only local image keys may be used', () => {
  assert.equal(safeImage('/img/0123456789abcdef'), '/img/0123456789abcdef')
  assert.equal(safeImage('https://example.com/tracker.jpg'), '')
  assert.equal(safeImage('/img/../secrets'), '')
})

test('normalizer imposes limits and safe defaults', () => {
  const result = normalizePortfolio({
    name: 'A'.repeat(200),
    theme: { palette: 'untrusted', motion: false },
    projects: Array.from({ length: 40 }, (_, i) => ({
      id: String(i), title: 'Title'.repeat(100), image: 'javascript:evil',
    })),
    skills: Array.from({ length: 60 }, () => 'skill'),
    hidden: ['about', 'invalid'],
  })
  assert.equal(result.name.length, 80)
  assert.equal(result.theme.palette, 'ink')
  assert.equal(result.theme.motion, false)
  assert.equal(result.projects.length, 24)
  assert.equal(result.projects[0].title.length, 120)
  assert.equal(result.projects[0].image, '')
  assert.equal(result.skills.length, 40)
  assert.deepEqual(result.hidden, ['about'])
})

test('backups preserve the draft without edit credentials', () => {
  const draft = blankPortfolio()
  draft.name = 'Fleedfolio test'
  draft.skills = ['TypeScript', 'React']
  const file = createPortfolioBackup(draft)
  const parsed = JSON.parse(file)
  assert.equal(parsed.format, 'fleedfolio-draft')
  assert.equal(parsed.version, 1)
  assert.equal(parsed.token, undefined)
  assert.deepEqual(parsePortfolioBackup(file), draft)
})

test('unknown backup formats and malformed JSON cannot replace a draft', () => {
  for (const raw of ['{}', '{"format":"fleedfolio-draft","version":2}', '[]', '{malformed']) {
    assert.throws(() => parsePortfolioBackup(raw))
  }
})

test('personal links accept canonical names and reject reserved or ambiguous names', () => {
  assert.equal(normalizeCustomSlug('  Hamood '), 'hamood')
  assert.equal(normalizeCustomSlug('alice-2026'), 'alice-2026')
  for (const slug of ['ab', 'a'.repeat(31), '-alice', 'alice-', 'alice--bob', 'fleed', 'admin', '1234abcd5678', 'user/name', 'with space', '%0a']) {
    assert.equal(normalizeCustomSlug(slug), null, 'Rejected: ' + slug)
  }
})

test('named links use the root-level /@name format while generated IDs stay at /p', () => {
  assert.equal(portfolioPublicPath('0ea7cf64947b', 'example'), '/@example')
  assert.equal(portfolioPublicPath('0ea7cf64947b', 'Hamood'), '/@hamood')
  assert.equal(portfolioPublicPath('0ea7cf64947b'), '/p/0ea7cf64947b')
  assert.equal(portfolioPublicPath('0ea7cf64947b', 'admin'), '/p/0ea7cf64947b')
})

test('new portfolios start with a calm presentation rather than a decorative backdrop', () => {
  const blank = blankPortfolio()
  assert.equal(blank.theme.backdrop, false)
  assert.equal(blank.labels.ctaBottom, 'Get in touch.')
})

test('education entries survive normalization while older portfolios remain compatible', () => {
  const old = blankPortfolio()
  delete old.education
  const normalizedOld = normalizePortfolio(old)
  assert.deepEqual(normalizedOld.education, [])
  const updated = normalizePortfolio({
    ...old,
    education: [{ id: 'gcse', qualification: 'GCSE Computer Science', institution: 'Example School', period: '2024–2026' }],
  })
  assert.equal(updated.education.length, 1)
  assert.equal(updated.education[0].qualification, 'GCSE Computer Science')
  assert.equal(updated.education[0].institution, 'Example School')
})

test('CV text exports education, experience and valid links without invented details', () => {
  const data = blankPortfolio()
  data.name = 'Test Candidate'
  data.role = 'Developer'
  data.education = [{ id: 'one', qualification: 'Computer Science', institution: 'Example School', period: '2024–2026' }]
  data.experience = [{ id: 'two', role: 'Volunteer', company: 'Library', period: 'Summer 2025' }]
  data.projects = [{ id: 'three', title: 'My App', description: 'Built a website', year: '2026', link: 'https://example.com/app', image: '' }]
  data.socials = [{ id: 'four', label: 'GitHub', url: 'javascript:alert(1)' }]
  const text = portfolioCvText(data, 'https://example.com/@test')
  assert.match(text, /EDUCATION/)
  assert.match(text, /Computer Science \| Example School \| 2024–2026/)
  assert.match(text, /EXPERIENCE/)
  assert.match(text, /Volunteer \| Library/)
  assert.match(text, /https:\/\/example\.com\/app/)
  assert.doesNotMatch(text, /javascript:/)
  assert.doesNotMatch(text, /No experience/)
})

test('portfolio project order can be changed without mutating the original content', () => {
  const projects = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  const promoted = reorderItems(projects, 1, -1)
  assert.deepEqual(promoted.map(p => p.id), ['b', 'a', 'c'])
  assert.deepEqual(projects.map(p => p.id), ['a', 'b', 'c'])
  assert.deepEqual(reorderItems(projects, 0, -1).map(p => p.id), ['a', 'b', 'c'])
  assert.deepEqual(reorderItems(projects, 2, 1).map(p => p.id), ['a', 'b', 'c'])
})

test('design library preserves user content and offers distinct, editable recipes', () => {
  const draft = blankPortfolio()
  draft.name = 'Creator'
  draft.skills = ['Python']
  const presets = DESIGN_PRESETS.map(p => p.id)
  assert.equal(new Set(presets).size, presets.length)
  for (const preset of DESIGN_PRESETS) {
    const result = applyDesignPreset(draft, preset)
    assert.equal(result.name, 'Creator')
    assert.deepEqual(result.skills, ['Python'])
    assert.equal(result.theme.font, preset.font)
    assert.equal(result.theme.palette, preset.palette)
    assert.equal(result.theme.backdrop, false)
  }
})

test('skills search ranks tech and creative matches while preventing duplicate suggestions', () => {
  const names = suggestSkills('vi', []).map(s => s.name)
  for (const name of ['Vite', 'Vim', 'Vitest', 'Visual Studio Code', 'Video Editing']) {
    assert.ok(names.includes(name), name + ' should appear')
  }
  assert.ok(!suggestSkills('vi', ['Vite']).some(s => s.name === 'Vite'))
  assert.deepEqual(suggestSkills('', []), [])
  assert.deepEqual(suggestSkills('vi,foo', []), [])
})

test('elements library creates real portfolio content without losing existing fields', () => {
  const original = blankPortfolio()
  original.name = 'New Creator'
  const added = addPortfolioElement(original, 'text')
  assert.equal(added.extras.length, 1)
  assert.equal(added.name, 'New Creator')
  assert.equal(original.extras.length, 0)
  const hidden = { ...original, hidden: ['work', 'skills'] }
  assert.ok(!addPortfolioElement(hidden, 'project').hidden.includes('work'))
  assert.ok(!addPortfolioElement(hidden, 'skills').hidden.includes('skills'))
  const second = addPortfolioElement(
    { ...original, projects: [{ ...original.projects[0], title: 'Project one' }] },
    'project',
  )
  assert.equal(second.projects.length, 2)
})

test('layouts survive normalization and preserve old published portfolios', () => {
  const legacy = blankPortfolio()
  delete legacy.theme.layout
  const restored = normalizePortfolio(legacy)
  assert.equal(restored.theme.layout, 'folio')
  assert.equal(normalizePortfolio({
    ...legacy, theme: { ...legacy.theme, layout: 'studio' },
  }).theme.layout, 'studio')
  assert.equal(normalizePortfolio({
    ...legacy, theme: { ...legacy.theme, layout: 'impossible' },
  }).theme.layout, 'folio')
  for (const design of DESIGN_PRESETS) {
    const updated = applyDesignPreset(blankPortfolio(), design)
    assert.equal(updated.theme.layout, design.layout)
  }
})

test('the read-only public view never leaks edit credentials or internal aliases', () => {
  const data = blankPortfolio()
  data.name = 'Example'
  const unsafe = {
    ...data,
    token: 'fake-private-token',
    editToken: 'fake-edit-token',
    __fleed_slug: 'private-alias-internal',
    token_hash: 'fake-hash',
    theme: { ...data.theme, layout: 'atelier' },
  }
  const result = publicPortfolioDocument(unsafe)
  const json = JSON.stringify(result)
  assert.equal(result.schemaVersion, 1)
  assert.equal(result.portfolio.name, 'Example')
  assert.equal(result.portfolio.theme.layout, 'atelier')
  assert.ok(!json.includes('fake-private-token'))
  assert.ok(!json.includes('fake-edit-token'))
  assert.ok(!json.includes('private-alias-internal'))
  assert.ok(!json.includes('fake-hash'))
})
