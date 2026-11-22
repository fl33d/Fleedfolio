import { validateStudioShape } from './validate-schema.ts'
import type { StudioBlock, StudioDocument, ProjectLens } from './document.ts'

export type StudioValidation =
  | { ok: true; document: StudioDocument }
  | { ok: false; issues: string[] }

/**
 * Runtime checks for portable documents. This is intentionally independent of
 * React and Cloudflare so imports can be verified before touching editor state.
 * The JSON Schema is the full wire-format contract. Keep both tests in sync.
 */
export function validateStudioDocument(value: unknown): StudioValidation {
  const issues: string[] = validateStudioShape(value)
  const bad = (message: string) => { if (issues.length < 30) issues.push(message) }
  const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
  const arr = (v: unknown, max: number, where: string): v is unknown[] => {
    if (!Array.isArray(v) || v.length > max) { bad(where + ' must be a bounded array'); return false }
    return true
  }
  const str = (v: unknown, max: number, where: string, min = 0) => {
    if (typeof v !== 'string' || v.length < min || v.length > max) { bad(where + ' must be text'); return false }
    return true
  }
  const id = (v: unknown, where: string) =>
    str(v, 70, where, 3) && /^[a-z][a-z0-9_-]*$/.test(v as string)
  const seen = new Set<string>()
  const takeId = (v: unknown, where: string) => {
    if (!id(v, where)) return
    if (seen.has(v as string)) bad(where + ' duplicates ' + v)
    seen.add(v as string)
  }
  const url = (v: unknown, where: string) => {
    if (!str(v, 2048, where, 8)) return
    try {
      const u = new URL(v as string)
      if (!['https:', 'http:', 'mailto:'].includes(u.protocol) ||
          (u.protocol === 'mailto:' && (u.search || u.hash || !u.pathname.includes('@')))) bad(where + ' has an unsafe URL')
    } catch { bad(where + ' has an invalid URL') }
  }
  let serial = ''
  try { serial = JSON.stringify(value) ?? '' } catch { bad('Document is not JSON serialisable') }
  if (serial.length > 1_000_000) bad('Document exceeds 1 MB')

  if (!obj(value)) return { ok: false, issues: ['Document must be an object'] }
  if (value.format !== 'fleedfolio-studio' || value.schemaVersion !== 1) bad('Unsupported Studio format/version')
  takeId(value.documentId, 'documentId')
  if (!Number.isInteger(value.revision) || (value.revision as number) < 0) bad('Invalid revision')

  const identity = value.identity
  const identityLinks = new Set<string>()
  if (!obj(identity)) bad('Missing identity')
  else {
    str(identity.displayName, 100, 'identity.displayName')
    for (const key of ['headline', 'bio', 'location', 'availability']) str(identity[key], key === 'bio' ? 4000 : 320, 'identity.' + key)
    if (arr(identity.roles, 8, 'identity.roles')) identity.roles.forEach((v, i) => str(v, 120, 'identity.roles.' + i, 1))
    if (arr(identity.links, 32, 'identity.links')) identity.links.forEach((v, i) => {
      if (!obj(v)) { bad('Invalid identity link ' + i); return }
      takeId(v.id, 'identity.links.' + i)
      if (typeof v.id === 'string') identityLinks.add(v.id)
      str(v.label, 80, 'identity link label', 1); url(v.url, 'identity link URL')
    })
  }
  const projects = new Map<string, Record<string, unknown>>()
  const skills = new Set<string>(), assets = new Set<string>()
  const experiences = new Set<string>(), education = new Set<string>()
  const content = value.content
  if (!obj(content)) bad('Missing content')
  else {
    if (arr(content.skills, 100, 'skills')) content.skills.forEach((v, i) => {
      if (!obj(v)) { bad('Invalid skill ' + i); return }
      takeId(v.id, 'skill.' + i)
      str(v.label, 70, 'skill label', 1)
      if (v.iconKey !== undefined && (!str(v.iconKey, 70, 'skill icon key', 1) || !/^[a-z0-9][a-z0-9-]*$/.test(v.iconKey as string))) bad('Invalid icon key')
      if (typeof v.id === 'string') skills.add(v.id)
    })
    for (const [key, target] of [['experience', experiences], ['education', education]] as const) {
      if (arr(content[key], 100, key)) content[key].forEach((v, i) => {
        if (!obj(v)) { bad('Invalid ' + key + ' entry ' + i); return }
        takeId(v.id, key + '.' + i)
        if (typeof v.id === 'string') target.add(v.id)
      })
    }
    if (arr(content.projects, 100, 'projects')) content.projects.forEach((v, i) => {
      if (!obj(v)) { bad('Invalid project ' + i); return }
      takeId(v.id, 'project.' + i)
      str(v.title, 160, 'project title')
      str(v.summary, 1200, 'project summary')
      str(v.contribution, 500, 'project contribution')
      if (typeof v.id === 'string') projects.set(v.id, v)
      if (arr(v.skillIds, 50, 'project skill refs')) for (const item of v.skillIds) if (!skills.has(item as string)) bad('Project refers to missing skill ' + item)
      if (arr(v.links, 20, 'project links')) v.links.forEach((link, j) => {
        if (!obj(link)) { bad('Invalid project link'); return }
        takeId(link.id, 'project link ' + j); url(link.url, 'project link URL')
      })
      if (!obj(v.lenses)) { bad('Missing project lenses'); return }
      for (const lens of ['story', 'spec', 'board', 'demo'] as ProjectLens[]) {
        const item = v.lenses[lens]
        if (!obj(item) || typeof item.enabled !== 'boolean') bad('Invalid lens ' + lens)
      }
      const demo = v.lenses.demo
      if (obj(demo) && demo.url !== null && demo.url !== undefined) {
        url(demo.url, 'demo URL')
        if (typeof demo.url === 'string' && !demo.url.startsWith('https://')) bad('Demo requires HTTPS')
      }
    })
  }
  if (arr(value.assets, 200, 'assets')) value.assets.forEach((v, i) => {
    if (!obj(v)) { bad('Invalid asset ' + i); return }
    takeId(v.id, 'asset.' + i)
    if (typeof v.id === 'string') assets.add(v.id)
    if (!str(v.path, 400, 'asset path', 1) || !/^assets\/[a-zA-Z0-9._/-]+$/.test(v.path as string) ||
        (v.path as string).split('/').some(part => part === '..' || part === '.')) bad('Unsafe asset path')
    str(v.alt, 500, 'asset alt')
  })
  for (const project of projects.values()) {
    if (project.coverAssetId != null && !assets.has(project.coverAssetId as string)) bad('Missing cover asset ' + project.coverAssetId)
    const lenses = project.lenses
    if (obj(lenses)) {
      const spec = lenses.spec, board = lenses.board
      if (obj(spec) && spec.architectureAssetId != null && !assets.has(spec.architectureAssetId as string)) bad('Missing architecture asset')
      if (obj(board) && arr(board.assetIds, 60, 'board assets')) board.assetIds.forEach(a => { if (!assets.has(a as string)) bad('Missing board asset ' + a) })
    }
  }

  let count = 0
  function checkBlocks(blocks: unknown, depth: number): void {
    if (!arr(blocks, 120, 'page blocks')) return
    if (depth > 3) { bad('Block nesting depth exceeds 3'); return }
    for (const raw of blocks) {
      count++
      if (count > 120) { bad('More than 120 blocks'); return }
      if (!obj(raw)) { bad('Invalid block'); continue }
      const block = raw as unknown as StudioBlock
      takeId(raw.id, 'block ID')
      if (!obj(raw.style) || typeof raw.style.variant !== 'string' || !['normal', 'featured', 'quiet'].includes(raw.style.emphasis as string)) bad('Invalid block style')
      switch (block.type) {
        case 'identity': break
        case 'rich-text':
          if (!arr(block.paragraphs, 80, 'paragraphs')) break
          for (const paragraph of block.paragraphs) {
            if (!obj(paragraph) || !['paragraph', 'heading', 'quote', 'bullet'].includes(paragraph.kind as string) || !arr(paragraph.runs, 200, 'runs')) { bad('Invalid rich-text paragraph'); continue }
            for (const run of paragraph.runs) {
              if (!obj(run) || !str(run.text, 4000, 'rich text')) bad('Invalid rich-text run')
              if (obj(run) && run.href) url(run.href, 'rich-text URL')
            }
          }
          break
        case 'project': {
          const project = projects.get(block.projectId)
          if (!project) bad('Unknown project ref ' + block.projectId)
          else if (obj(project.lenses) && obj(project.lenses[block.defaultLens]) && project.lenses[block.defaultLens].enabled !== true) bad('Default project lens disabled')
          break
        }
        case 'project-list':
          if (arr(block.projectIds, 100, 'projectIds')) block.projectIds.forEach(projectId => { if (!projects.has(projectId)) bad('Missing listed project ' + projectId) })
          break
        case 'skills':
          if (arr(block.skillIds, 100, 'skillIds')) block.skillIds.forEach(skillId => { if (!skills.has(skillId)) bad('Missing listed skill ' + skillId) })
          break
        case 'timeline': {
          const collection = block.collection === 'education' ? education : experiences
          if (arr(block.itemIds, 60, 'timeline IDs')) block.itemIds.forEach(item => { if (!collection.has(item)) bad('Missing timeline item ' + item) })
          break
        }
        case 'links':
          if (arr(block.linkIds, 32, 'linkIds')) block.linkIds.forEach(item => { if (!identityLinks.has(item)) bad('Missing identity link ' + item) })
          break
        case 'media':
          if (!assets.has(block.assetId)) bad('Missing media asset ' + block.assetId)
          break
        case 'embed':
          if (block.requiresConsent !== true) bad('Embeds must require consent')
          url(block.url, 'embed URL')
          if (!block.url.startsWith('https://')) bad('Embed requires HTTPS')
          break
        case 'group': checkBlocks(block.children, depth + 1); break
        case 'divider': case 'code': break
        default: bad('Unsupported block type ' + String(raw.type))
      }
    }
  }
  const pages = value.pages
  const pageIds = new Set<string>()
  if (arr(pages, 8, 'pages') && pages.length) pages.forEach((page, i) => {
    if (!obj(page)) { bad('Invalid page ' + i); return }
    takeId(page.id, 'page.' + i)
    if (typeof page.id === 'string') pageIds.add(page.id)
    if (typeof page.slug !== 'string' || !/^\/[a-z0-9-]*$/.test(page.slug)) bad('Invalid page slug')
    checkBlocks(page.blocks, 0)
  })
  const settings = value.settings
  if (!obj(settings) || !pageIds.has(settings.defaultPageId as string) ||
      typeof settings.discoverable !== 'boolean' ||
      !['draft', 'public', 'unlisted'].includes(settings.visibility as string)) bad('Invalid settings')
  const presentation = value.presentation
  if (!obj(presentation) || !str(presentation.system, 70, 'presentation system', 1) ||
      typeof presentation.accent !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(presentation.accent)) bad('Invalid presentation')
  return issues.length ? { ok: false, issues } : { ok: true, document: value as unknown as StudioDocument }
}

/** Parse untrusted imports, keeping the current document unchanged on failure. */
export function parseStudioArchive(text: string): StudioValidation {
  if (text.length > 1_000_000) return { ok: false, issues: ['Import exceeds 1 MB'] }
  try { return validateStudioDocument(JSON.parse(text) as unknown) }
  catch { return { ok: false, issues: ['Invalid JSON document'] } }
}
