import type { Achievement, Project, StudioBlock, StudioDocument } from './document'

type TextBlock = Extract<StudioBlock, { type: 'rich-text' }>
type SkillBlock = Extract<StudioBlock, { type: 'skills' }>

export function homePage(document: StudioDocument) {
  return document.pages.find(page => page.id === document.settings.defaultPageId)
}

/** The Simple surface must never flatten rich marks, links or special paragraphs. */
export function simpleIntroEditable(block: TextBlock | undefined): boolean {
  return !!block && block.paragraphs.every(paragraph =>
    paragraph.kind === 'paragraph' &&
    paragraph.runs.length <= 1 &&
    paragraph.runs.every(run => !run.href && (!run.marks || run.marks.length === 0)))
}
export function readSimpleIntro(document: StudioDocument): string | null {
  const block = homePage(document)?.blocks.find((item): item is TextBlock => item.type === 'rich-text')
  if (!simpleIntroEditable(block)) return null
  return block?.paragraphs.map(p => p.runs.map(r => r.text).join('')).join('\n\n') ?? ''
}
export function writeSimpleIntro(document: StudioDocument, text: string): boolean {
  const block = homePage(document)?.blocks.find((item): item is TextBlock => item.type === 'rich-text')
  if (!simpleIntroEditable(block)) return false
  if (!block) return false
  block.paragraphs = text.split(/\n\n+/).slice(0, 20).map(value => ({ kind: 'paragraph', runs: [{ text: value.slice(0, 4000) }] }))
  return true
}
export function addSimpleProject(document: StudioDocument, makeId: (prefix: string) => string): string | null {
  const page = homePage(document)
  if (!page || document.content.projects.length >= 100 || page.blocks.length >= 120) return null
  const id = makeId('proj')
  const project: Project = {
    id, title: '', summary: '', contribution: '', year: '', skillIds: [], links: [], coverAssetId: null,
    lenses: {
      story: { enabled: true, sections: [{ id: makeId('section'), heading: 'What I made', paragraphs: [{ kind: 'paragraph', runs: [{ text: '' }] }] }] },
      spec: { enabled: false, problem: '', approach: '', decisions: [], tradeoffs: [], metrics: [], architectureAssetId: null },
      board: { enabled: false, assetIds: [], caption: '' },
      demo: { enabled: false, url: null, fallbackText: '', launchLabel: 'View demo' },
    },
  }
  page.blocks.push({ id: makeId('blk'), type: 'project', projectId: id, defaultLens: 'story', style: { variant: 'standard', emphasis: 'normal' } })
  document.content.projects.push(project)
  return id
}
export function visibleSimpleSkills(document: StudioDocument) {
  const ids = (homePage(document)?.blocks.find((block): block is SkillBlock => block.type === 'skills'))?.skillIds ?? []
  return ids.map(id => document.content.skills.find(skill => skill.id === id))
    .filter((skill): skill is StudioDocument['content']['skills'][number] => Boolean(skill))
}
export function addSimpleSkill(document: StudioDocument, raw: string, makeId: (prefix: string) => string): boolean {
  const label = raw.trim().slice(0, 70)
  const page = homePage(document)
  if (!label || !page || visibleSimpleSkills(document).some(s => s.label.toLowerCase() === label.toLowerCase())) return false
  let skill = document.content.skills.find(s => s.label.toLowerCase() === label.toLowerCase())
  if (!skill) {
    if (document.content.skills.length >= 100) return false
    skill = { id: makeId('skill'), label, category: 'other' }
    document.content.skills.push(skill)
  }
  const block = page.blocks.find((item): item is SkillBlock => item.type === 'skills')
  if (block) block.skillIds.push(skill.id)
  else if (page.blocks.length < 120) page.blocks.push({ id: makeId('blk'), type: 'skills', style: { variant: 'standard', emphasis: 'normal' }, skillIds: [skill.id], display: 'text' })
  else return false
  return true
}
export function hideSimpleSkill(document: StudioDocument, id: string): void {
  const block = homePage(document)?.blocks.find((item): item is SkillBlock => item.type === 'skills')
  if (block) block.skillIds = block.skillIds.filter(item => item !== id)
  // Project records and other pages can still use the canonical skill.
}

type AchievementsBlock = Extract<StudioBlock, { type: 'achievements' }>
/** Achievements are creator-provided content, not platform-issued badges. */
export function visibleSimpleAchievements(document: StudioDocument): Achievement[] {
  const ids = (homePage(document)?.blocks.find((block): block is AchievementsBlock => block.type === 'achievements'))?.achievementIds ?? []
  const lookup = new Map((document.content.achievements ?? []).map(item => [item.id, item]))
  return ids.flatMap(id => { const item = lookup.get(id); return item ? [item] : [] })
}
export function addSimpleAchievement(document: StudioDocument, makeId: (prefix: string) => string): string | null {
  const page = homePage(document)
  if (!page || (document.content.achievements?.length ?? 0) >= 100) return null
  const block = page.blocks.find((item): item is AchievementsBlock => item.type === 'achievements')
  if (!block && page.blocks.length >= 120) return null
  const id = makeId('achievement')
  document.content.achievements ??= []
  document.content.achievements.push({
    id, title: '', category: 'milestone', issuer: '', date: '', description: '', evidenceUrl: null,
  })
  if (block) block.achievementIds.push(id)
  else page.blocks.push({
    id: makeId('blk'), type: 'achievements', style: { variant: 'editorial', emphasis: 'normal' },
    achievementIds: [id], display: 'timeline',
  })
  return id
}
export function updateSimpleAchievement(
  document: StudioDocument,
  id: string,
  key: 'title' | 'category' | 'issuer' | 'date' | 'description' | 'evidenceUrl',
  value: string | null,
): boolean {
  const achievement = document.content.achievements?.find(item => item.id === id)
  if (!achievement) return false
  if (key === 'evidenceUrl') {
    if (value !== null && value !== '') {
      if (typeof value !== 'string' || !/^https:\/\/[^\s<>]+$/i.test(value)) return false
      try { const parsed = new URL(value); if (parsed.protocol !== 'https:') return false }
      catch { return false }
    }
    achievement.evidenceUrl = value === '' ? null : value
    return true
  }
  if (typeof value !== 'string') return false
  if (key === 'category') {
    if (!['award','certification','competition','milestone','publication','other'].includes(value)) return false
    achievement.category = value as Achievement['category']
  } else if (key === 'title') achievement.title = value.slice(0,180)
  else if (key === 'issuer') achievement.issuer = value.slice(0,150)
  else if (key === 'date') achievement.date = value.slice(0,50)
  else if (key === 'description') achievement.description = value.slice(0,900)
  return true
}
export function hideSimpleAchievement(document: StudioDocument, id: string): void {
  const block = homePage(document)?.blocks.find((item): item is AchievementsBlock => item.type === 'achievements')
  if (block) block.achievementIds = block.achievementIds.filter(item => item !== id)
  // Never delete the original record; other pages may still reference it.
}
