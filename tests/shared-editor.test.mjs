import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { addSimpleProject, addSimpleSkill, hideSimpleSkill, readSimpleIntro, simpleIntroEditable, visibleSimpleSkills, writeSimpleIntro } from '../src/studio/shared-editor.ts'
import { validateStudioDocument } from '../src/studio/validate.ts'

const fixture = JSON.parse(readFileSync(new URL('../src/studio/fixtures/illustrative-portfolio.json', import.meta.url), 'utf8'))
const fresh = () => structuredClone(fixture)
let counter = 0
const makeId = prefix => prefix + '_' + (++counter).toString().padStart(5, '0')

test('simple edits the same intro used by the renderer, without changing other sections', () => {
  const doc = fresh(), ids = doc.pages[0].blocks.map(b => b.id)
  assert.equal(readSimpleIntro(doc), 'Selected work, written with context and intention.')
  assert.equal(writeSimpleIntro(doc, 'A short paragraph.\n\nAnd a second.'), true)
  assert.equal(readSimpleIntro(doc), 'A short paragraph.\n\nAnd a second.')
  assert.deepEqual(doc.pages[0].blocks.map(b => b.id), ids)
  assert.equal(validateStudioDocument(doc).ok, true)
})
test('Simple cannot erase Studio rich-text formatting or links', () => {
  const doc = fresh(), block = doc.pages[0].blocks.find(b => b.type === 'rich-text')
  block.paragraphs[0].runs[0].marks = ['bold']
  assert.equal(simpleIntroEditable(block), false)
  assert.equal(readSimpleIntro(doc), null)
  const before = JSON.stringify(doc)
  assert.equal(writeSimpleIntro(doc, 'Unsafe flatten attempt'), false)
  assert.equal(JSON.stringify(doc), before)
})
test('adding a project preserves old blocks and canonical project lenses', () => {
  const doc = fresh(), ids = doc.pages[0].blocks.map(b => b.id), oldCount = doc.content.projects.length
  const newId = addSimpleProject(doc, makeId)
  assert.ok(newId)
  assert.equal(doc.content.projects.length, oldCount + 1)
  assert.deepEqual(doc.pages[0].blocks.slice(0, ids.length).map(b => b.id), ids)
  assert.ok(doc.pages[0].blocks.some(b => b.type === 'project' && b.projectId === newId))
  assert.equal(validateStudioDocument(doc).ok, true)
})
test('hiding a visible skill does not break project references', () => {
  const doc = fresh(), first = visibleSimpleSkills(doc)[0]
  assert.ok(doc.content.projects.some(p => p.skillIds.includes(first.id)))
  hideSimpleSkill(doc, first.id)
  assert.ok(!visibleSimpleSkills(doc).some(s => s.id === first.id))
  assert.ok(doc.content.skills.some(s => s.id === first.id))
  assert.ok(doc.content.projects.some(p => p.skillIds.includes(first.id)))
  assert.equal(validateStudioDocument(doc).ok, true)
})
test('simple reuses hidden skills without duplicate data', () => {
  const doc = fresh(), first = visibleSimpleSkills(doc)[0], oldCount = doc.content.skills.length
  hideSimpleSkill(doc, first.id)
  assert.equal(addSimpleSkill(doc, first.label, makeId), true)
  assert.equal(addSimpleSkill(doc, first.label, makeId), false)
  assert.equal(doc.content.skills.length, oldCount)
  assert.equal(addSimpleSkill(doc, 'Copywriting', makeId), true)
  assert.equal(doc.content.skills.length, oldCount + 1)
  assert.equal(validateStudioDocument(doc).ok, true)
})
test('switching expression and editing simple fields preserve advanced data', () => {
  const doc = fresh(), oldLenses = JSON.stringify(doc.content.projects.map(p => p.lenses))
  for (const mood of ['atelier','index','studio','terminal']) {
    doc.presentation.system = mood
    writeSimpleIntro(doc, 'Revised writing')
    assert.equal(JSON.stringify(doc.content.projects.map(p => p.lenses)), oldLenses)
    assert.equal(validateStudioDocument(doc).ok, true)
  }
})
