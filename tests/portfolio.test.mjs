import test from 'node:test'
import assert from 'node:assert/strict'

import { blankPortfolio, mailtoHref, normalizePortfolio, reorderItems, safeImage, safeUrl } from '../src/lib/portfolio.ts'
import { createPortfolioBackup, parsePortfolioBackup } from '../src/lib/portfolio-backup.ts'
import { normalizeCustomSlug, portfolioPublicPath } from '../src/lib/portfolio-slug.ts'
import { portfolioCvText } from '../src/lib/cv.ts'

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

test('art directions are composable, persisted and safely normalised', () => {
  const fresh=blankPortfolio()
  assert.equal(fresh.theme.look,'editorial')
  assert.equal(fresh.theme.palette,'paper')
  const styled=normalizePortfolio({...fresh,theme:{
    ...fresh.theme,look:'glass',texture:'grid',background:'#123456',foreground:'#abcdef',
  }})
  assert.equal(styled.theme.look,'glass')
  assert.equal(styled.theme.texture,'grid')
  assert.equal(styled.theme.background,'#123456')
  assert.equal(styled.theme.foreground,'#abcdef')
  const invalid=normalizePortfolio({...fresh,theme:{
    ...fresh.theme,look:'<script>',texture:'url(evil)',background:'red',foreground:'javascript:alert(1)',
  }})
  assert.equal(invalid.theme.look,'classic')
  assert.equal(invalid.theme.texture,'none')
  assert.equal(invalid.theme.background,'')
  assert.equal(invalid.theme.foreground,'')
  const legacy=normalizePortfolio({...fresh,theme:{palette:'moss',font:'serif',motion:false}})
  assert.equal(legacy.theme.look,'classic')
  assert.equal(legacy.theme.texture,'none')
  assert.equal(legacy.theme.motion,false)
})

test('composition controls preserve existing portfolios and safely normalise unknown values', () => {
  const fresh=blankPortfolio()
  const rich=normalizePortfolio({
    ...fresh,
    theme:{...fresh.theme,workLayout:'spotlight',spacing:'airy',corners:'round'},
    extras:[{id:'story1',title:'Thoughts',body:'Something important.',image:'',variant:'statement'}],
  })
  assert.equal(rich.theme.workLayout,'spotlight')
  assert.equal(rich.theme.spacing,'airy')
  assert.equal(rich.theme.corners,'round')
  assert.equal(rich.extras[0].variant,'statement')
  const altered=normalizePortfolio({...rich,theme:{...rich.theme,workLayout:'grid'}})
  assert.deepEqual(altered.extras,rich.extras)
  const legacy=normalizePortfolio({...fresh,theme:{palette:'ink',font:'serif'},
    extras:[{id:'old',title:'Old writing',body:'Still here',image:''}],
  })
  assert.equal(legacy.theme.workLayout,'list')
  assert.equal(legacy.theme.spacing,'balanced')
  assert.equal(legacy.theme.corners,'soft')
  assert.equal(legacy.extras[0].variant,'essay')
  const malformed=normalizePortfolio({
    ...rich,
    theme:{...rich.theme,workLayout:'javascript:evil',spacing:'url(x)',corners:'unbounded'},
    extras:[{id:'bad',variant:'script',body:'Survives',title:'Safe'}],
  })
  assert.equal(malformed.theme.workLayout,'list')
  assert.equal(malformed.theme.spacing,'balanced')
  assert.equal(malformed.theme.corners,'soft')
  assert.equal(malformed.extras[0].variant,'essay')
  assert.equal(malformed.extras[0].body,'Survives')
})

test('skill presentation is reversible and legacy safe', () => {
  const base=blankPortfolio()
  const skills=['Python','TypeScript','A custom skill']
  const rich=normalizePortfolio({...base,skills,theme:{...base.theme,skillLayout:'grid',skillLabels:'icons'}})
  assert.equal(rich.theme.skillLayout,'grid')
  assert.equal(rich.theme.skillLabels,'icons')
  assert.deepEqual(rich.skills,skills)
  const list=normalizePortfolio({...rich,theme:{...rich.theme,skillLayout:'list',skillLabels:'text'}})
  assert.equal(list.theme.skillLayout,'list')
  assert.equal(list.theme.skillLabels,'text')
  assert.deepEqual(list.skills,skills)
  const previous=normalizePortfolio({...base,skills,theme:{palette:'ink',font:'serif'}})
  assert.equal(previous.theme.skillLayout,'rail')
  assert.equal(previous.theme.skillLabels,'both')
  assert.deepEqual(previous.skills,skills)
  const unsafe=normalizePortfolio({...rich,theme:{...rich.theme,skillLayout:'url(x)',skillLabels:'javascript:evil'}})
  assert.equal(unsafe.theme.skillLayout,'rail')
  assert.equal(unsafe.theme.skillLabels,'both')
  assert.deepEqual(unsafe.skills,skills)
})
