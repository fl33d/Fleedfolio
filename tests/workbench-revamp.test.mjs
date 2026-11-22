import test from 'node:test'
import assert from 'node:assert/strict'
import { blankPortfolio, normalizePortfolio } from '../src/lib/portfolio.ts'
import { createPortfolioBackup, parsePortfolioBackup } from '../src/lib/portfolio-backup.ts'
import { suggestSkills, findCatalogSkill } from '../src/lib/skill-catalog.ts'

test('legacy drafts default to familiar wordmark and readable text skills', () => {
  const old = { name:'Alex', photo:'', skills:['Python'], theme:{ layout:'folio',palette:'ink',font:'sans',scale:'regular',align:'left',backdrop:false,motion:true } }
  const normal = normalizePortfolio(old)
  assert.equal(normal.theme.identityMode,'wordmark')
  assert.equal(normal.theme.skillDisplay,'text')
  assert.equal(normal.identityText,'')
  assert.equal(normal.name,'Alex')
  assert.deepEqual(normal.skills,['Python'])
})
test('new branding and icon preferences are portable through original v1 backups', () => {
  const current = blankPortfolio()
  current.identityText = 'a. / projects'
  current.theme.identityMode = 'wordmark'
  current.theme.skillDisplay = 'both'
  current.skills = ['Python','Illustration']
  const saved = createPortfolioBackup(current)
  assert.ok(!saved.includes('token_hash'))
  assert.ok(!saved.includes('blank:published'))
  const restored = parsePortfolioBackup(saved)
  assert.equal(restored.identityText,'a. / projects')
  assert.equal(restored.theme.identityMode,'wordmark')
  assert.equal(restored.theme.skillDisplay,'both')
  assert.deepEqual(restored.skills,['Python','Illustration'])
})
test('identity and logo modes can be explicitly hidden without discarding the name', () => {
  const current=blankPortfolio()
  current.name='Jordan'
  current.theme.identityMode='none'
  current.theme.skillDisplay='icons'
  const restored=normalizePortfolio(current)
  assert.equal(restored.theme.identityMode,'none')
  assert.equal(restored.theme.skillDisplay,'icons')
  assert.equal(restored.name,'Jordan')
})
test('untrusted or unknown theme values fall back without erasing old content', () => {
  const current=blankPortfolio()
  current.name='Jordan'
  current.identityText='short mark'
  current.theme.identityMode='photo'
  const unsafe=normalizePortfolio({ ...current, identityText: 42, photo:'javascript:alert(1)', theme:{ ...current.theme,identityMode:'script',skillDisplay:'fancy' } })
  assert.equal(unsafe.theme.identityMode,'wordmark')
  assert.equal(unsafe.theme.skillDisplay,'text')
  assert.equal(unsafe.photo,'')
  assert.equal(unsafe.identityText,'')
  assert.equal(unsafe.name,'Jordan')
})
test('autocomplete suggests programming languages and resolves case-insensitive logos', () => {
  assert.equal(findCatalogSkill('python')?.name,'Python')
  assert.equal(findCatalogSkill('C++')?.name,'C++')
  assert.equal(findCatalogSkill('typescript')?.category,'Developer')
  assert.ok(suggestSkills('kot',[]).some(skill=>skill.name==='Kotlin'))
  assert.ok(suggestSkills('terra',[]).some(skill=>skill.name==='Terraform'))
  assert.ok(!suggestSkills('py',['Python']).some(skill=>skill.name==='Python'))
  assert.equal(findCatalogSkill('Made-up custom skill'),undefined)
})
