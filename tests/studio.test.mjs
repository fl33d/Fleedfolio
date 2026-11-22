import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validateStudioDocument, parseStudioArchive } from '../src/studio/validate.ts'

const fixture = JSON.parse(readFileSync(new URL('../src/studio/fixtures/illustrative-portfolio.json', import.meta.url), 'utf8'))
const copy = () => structuredClone(fixture)
const rejects = (doc, label) => {
  const result = validateStudioDocument(doc)
  assert.equal(result.ok, false, label)
  assert.ok(result.issues.length, label + ' should explain failure')
}

test('Studio v1 example is a complete valid document', () => {
  const result = validateStudioDocument(fixture)
  assert.equal(result.ok, true, result.issues?.join('; '))
})
test('imports reject invalid JSON and unsupported formats', () => {
  assert.equal(parseStudioArchive('{oops').ok, false)
  const wrong = copy(); wrong.format = 'fleedfolio-draft'
  rejects(wrong, 'legacy format must not masquerade as Studio')
})
test('portable archives cannot smuggle edit tokens or unknown fields', () => {
  const value = copy(); value.token = 'private-edit-credential'
  rejects(value, 'unexpected root credential')
  const project = copy(); project.content.projects[0].editToken = 'secret'
  rejects(project, 'unexpected nested credential')
})
test('unsafe URLs and mailto query injection cannot be imported', () => {
  const value = copy(); value.identity.links[0].url = 'javascript:alert(1)'
  rejects(value, 'javascript URL')
  const link = copy(); link.identity.links[1].url = 'mailto:test@example.com?bcc=other@example.com'
  rejects(link, 'mail header query')
})
test('duplicate identifiers and missing references fail', () => {
  const duplicate = copy(); duplicate.pages[0].blocks[1].id = duplicate.pages[0].blocks[0].id
  rejects(duplicate, 'duplicate block ID')
  const lostProject = copy(); lostProject.pages[0].blocks[2].projectId = 'proj_does_not_exist'
  rejects(lostProject, 'missing project')
  const lostSkill = copy(); lostSkill.content.projects[0].skillIds = ['sk_missing']
  rejects(lostSkill, 'missing skill')
})
test('a disabled default lens cannot be selected', () => {
  const value = copy(); value.pages[0].blocks[2].defaultLens = 'demo'
  rejects(value, 'disabled demo lens')
})
test('external media path traversal is forbidden', () => {
  const value = copy(); value.assets.push({ id: 'asset_one', kind: 'image', mime: 'image/png', alt: '', path: 'assets/../unsafe.png' })
  rejects(value, 'asset traversal')
})
test('groups can be nested but excessive depth is rejected', () => {
  const value = copy()
  const leaf = { id: 'blk_child_one', type: 'divider', style: {variant:'rule', emphasis:'normal'},weight:'rule' }
  const block = id => ({id, type:'group', style:{variant:'stack',emphasis:'normal'},layout:'stack',columns:1,children:[]})
  const a=block('blk_group_a'),b=block('blk_group_b'),c=block('blk_group_c'),d=block('blk_group_d')
  value.pages[0].blocks.push(a);a.children.push(b);b.children.push(c);c.children.push(d);d.children.push(leaf)
  rejects(value, 'deep group')
})
test('unfinished local drafts may leave name and project title empty', () => {
  const value = copy(); value.identity.displayName = ''; value.content.projects[0].title = ''
  const result = validateStudioDocument(value)
  assert.equal(result.ok, true, result.issues?.join('; '))
})
test('switching aesthetics does not change canonical project facts', () => {
  const original = JSON.stringify(fixture.content)
  for (const system of ['atelier','index','studio','terminal']) {
    const value = copy();value.presentation.system = system
    const result = validateStudioDocument(value)
    assert.equal(result.ok,true,system+': '+result.issues?.join('; '))
    assert.equal(JSON.stringify(value.content),original)
  }
})
test('oversized JSON, invalid shapes and unsupported blocks fail', () => {
  const huge = JSON.stringify(fixture) + ' '.repeat(1000001)
  assert.equal(parseStudioArchive(huge).ok,false)
  const value=copy();value.pages[0].blocks.push({id:'blk_unknown',type:'javascript',style:{variant:'script',emphasis:'normal'}})
  rejects(value,'unsupported executable block')
})
