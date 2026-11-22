import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { addSimpleAchievement, hideSimpleAchievement, updateSimpleAchievement, visibleSimpleAchievements } from '../src/studio/shared-editor.ts'
import { validateStudioDocument } from '../src/studio/validate.ts'

const sample = JSON.parse(readFileSync(new URL('../src/studio/fixtures/illustrative-portfolio.json', import.meta.url), 'utf8'))
const copy = () => structuredClone(sample)
let counter=0
const makeId=prefix=>prefix+'_'+(++counter).toString().padStart(6,'0')
const valid=(doc)=> {const result=validateStudioDocument(doc);assert.equal(result.ok,true,result.issues?.join('; '))}

test('sample achievements are valid and visible as canonical references', () => {
  const doc=copy();valid(doc)
  const [first]=visibleSimpleAchievements(doc)
  assert.equal(first.category,'milestone')
  assert.match(first.description,/not a verified award/i)
})
test('old Studio v1 backups without achievements remain readable', () => {
  const doc=copy()
  doc.pages[0].blocks=doc.pages[0].blocks.filter(block=>block.type!=='achievements')
  delete doc.content.achievements
  valid(doc)
  assert.deepEqual(visibleSimpleAchievements(doc),[])
  assert.ok(addSimpleAchievement(doc,makeId))
  valid(doc)
})
test('creating achievements preserves previous canonical content and ordering', () => {
  const doc=copy(), prior=JSON.stringify(doc.content.projects),ids=doc.pages[0].blocks.map(b=>b.id)
  const id=addSimpleAchievement(doc,makeId)
  assert.ok(id)
  assert.deepEqual(doc.pages[0].blocks.map(b=>b.id),ids)
  assert.equal(JSON.stringify(doc.content.projects),prior)
  assert.equal(visibleSimpleAchievements(doc).at(-1).id,id)
  valid(doc)
})
test('achievement details accept safe evidence and reject dangerous URLs', () => {
  const doc=copy(), id=addSimpleAchievement(doc,makeId)
  assert.equal(updateSimpleAchievement(doc,id,'title','Award for a student project'),true)
  assert.equal(updateSimpleAchievement(doc,id,'category','award'),true)
  assert.equal(updateSimpleAchievement(doc,id,'issuer','Example organisation'),true)
  assert.equal(updateSimpleAchievement(doc,id,'evidenceUrl','https://example.com/proof'),true)
  valid(doc)
  assert.equal(updateSimpleAchievement(doc,id,'evidenceUrl','javascript:alert(1)'),false)
  assert.equal(updateSimpleAchievement(doc,id,'evidenceUrl','http://example.com/'),false)
  assert.equal(updateSimpleAchievement(doc,id,'evidenceUrl','https://'),false)
  assert.equal(doc.content.achievements.at(-1).evidenceUrl,'https://example.com/proof')
  const tampered=copy();tampered.content.achievements[0].evidenceUrl='javascript:alert(1)'
  assert.equal(validateStudioDocument(tampered).ok,false)
})
test('hiding an achievement removes its placement but preserves the record for other pages', () => {
  const doc=copy()
  const record=visibleSimpleAchievements(doc)[0]
  hideSimpleAchievement(doc,record.id)
  assert.ok(!visibleSimpleAchievements(doc).some(x=>x.id===record.id))
  assert.ok(doc.content.achievements.some(x=>x.id===record.id))
  valid(doc)
})
test('dangling achievement IDs and fake verified flags are not accepted', () => {
  const doc=copy();doc.pages[0].blocks.find(x=>x.type==='achievements').achievementIds.push('ach_missing')
  assert.equal(validateStudioDocument(doc).ok,false)
  const fake=copy();fake.content.achievements[0].verified=true
  assert.equal(validateStudioDocument(fake).ok,false)
})
test('changing visual expression keeps achievements and evidence untouched', () => {
  const doc=copy(), data=JSON.stringify(doc.content.achievements)
  for(const mood of ['atelier','index','studio','terminal']){
    doc.presentation.system=mood
    assert.equal(JSON.stringify(doc.content.achievements),data)
    valid(doc)
  }
})


test('GitHub profile achievements are creator-declared, not falsely verified', () => {
  const doc = copy()
  const id = addSimpleAchievement(doc, makeId, 'github')
  const badge = doc.content.achievements.find(item => item.id === id)
  assert.equal(badge.category, 'github')
  assert.equal(badge.issuer, 'GitHub')
  assert.equal(updateSimpleAchievement(doc,id,'title','Pull Shark'),true)
  assert.equal(updateSimpleAchievement(doc,id,'evidenceUrl','https://github.com/example'),true)
  assert.equal(updateSimpleAchievement(doc,id,'category','github'),true)
  assert.equal(badge.evidenceUrl,'https://github.com/example')
  assert.equal('verified' in badge,false)
  valid(doc)
  const tampered = copy()
  tampered.content.achievements[0].category='github-verified'
  assert.equal(validateStudioDocument(tampered).ok,false)
})
