import test from 'node:test'
import assert from 'node:assert/strict'

import { blankPortfolio, mailtoHref, normalizePortfolio, safeImage, safeUrl } from '../src/lib/portfolio.ts'
import { createPortfolioBackup, parsePortfolioBackup } from '../src/lib/portfolio-backup.ts'
import { normalizeCustomSlug } from '../src/lib/portfolio-slug.ts'

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
