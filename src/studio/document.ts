/**
 * Portable Studio Document v1. Public creator content only.
 * Publishing edit credentials remain outside this type and never enter backups.
 * The JSON Schema in ./schema is the canonical external format description.
 */
export type Identifier = string
export type RichRun = { text: string; marks?: Array<'bold' | 'italic' | 'code' | 'underline'>; href?: string }
export type RichParagraph = { kind: 'paragraph' | 'heading' | 'quote' | 'bullet'; level?: number; runs: RichRun[] }
export type DocumentLink = { id: Identifier; label: string; url: string; rel: 'personal' | 'work' | 'source' | 'demo' | 'contact' | 'other' }
export type Skill = { id: Identifier; label: string; category: 'development' | 'design' | 'research' | 'writing' | 'professional' | 'other'; iconKey?: string }
export type Experience = { id: Identifier; role: string; organisation: string; start: string; end: string | null; summary: string; highlights: string[] }
export type Education = { id: Identifier; qualification: string; institution: string; period: string; details: string }
/** A creator-authored accomplishment, never an auto-generated verified credential. */
export type Achievement = { id: Identifier; title: string; category: 'award' | 'certification' | 'competition' | 'milestone' | 'publication' | 'other'; issuer: string; date: string; description: string; evidenceUrl: string | null }
export type StudioMetric = { id: Identifier; label: string; value: string; context: string }
export type ProjectLens = 'story' | 'spec' | 'board' | 'demo'
export type Project = {
  id: Identifier
  title: string
  summary: string
  year: string
  contribution: string
  skillIds: Identifier[]
  links: DocumentLink[]
  coverAssetId: Identifier | null
  lenses: {
    story: { enabled: boolean; sections: Array<{ id: Identifier; heading: string; paragraphs: RichParagraph[] }> }
    spec: { enabled: boolean; problem: string; approach: string; decisions: string[]; tradeoffs: string[]; metrics: StudioMetric[]; architectureAssetId: Identifier | null }
    board: { enabled: boolean; assetIds: Identifier[]; caption: string }
    demo: { enabled: boolean; url: string | null; fallbackText: string; launchLabel: string }
  }
}
export type Asset = { id: Identifier; kind: 'image' | 'video' | 'file'; mime: string; alt: string; path: string; width?: number; height?: number; sha256?: string }
export type BlockStyle = { variant: string; emphasis: 'normal' | 'featured' | 'quiet' }
export type StudioBlock =
  | { id: Identifier; type: 'identity'; style: BlockStyle; scale: 'compact' | 'standard' | 'hero' }
  | { id: Identifier; type: 'rich-text'; style: BlockStyle; paragraphs: RichParagraph[] }
  | { id: Identifier; type: 'project'; style: BlockStyle; projectId: Identifier; defaultLens: ProjectLens }
  | { id: Identifier; type: 'project-list'; style: BlockStyle; projectIds: Identifier[]; display: 'index' | 'featured' | 'gallery' }
  | { id: Identifier; type: 'skills'; style: BlockStyle; skillIds: Identifier[]; display: 'text' | 'list' | 'icons' }
  | { id: Identifier; type: 'achievements'; style: BlockStyle; achievementIds: Identifier[]; display: 'timeline' | 'list' | 'cards' }
  | { id: Identifier; type: 'timeline'; style: BlockStyle; collection: 'experience' | 'education'; itemIds: Identifier[] }
  | { id: Identifier; type: 'media'; style: BlockStyle; assetId: Identifier; caption: string; fit: 'contain' | 'cover' }
  | { id: Identifier; type: 'links'; style: BlockStyle; linkIds: Identifier[] }
  | { id: Identifier; type: 'divider'; style: BlockStyle; weight: 'hairline' | 'rule' | 'space' }
  | { id: Identifier; type: 'code'; style: BlockStyle; language: string; source: string; caption: string }
  | { id: Identifier; type: 'embed'; style: BlockStyle; url: string; title: string; fallbackText: string; requiresConsent: true }
  | { id: Identifier; type: 'group'; style: BlockStyle; layout: 'stack' | 'columns' | 'split'; columns: number; children: StudioBlock[] }
export type StudioPage = { id: Identifier; slug: string; title: string; blocks: StudioBlock[] }
export type Presentation = {
  system: string
  typography: 'editorial' | 'modern' | 'mono' | 'expressive'
  density: 'airy' | 'balanced' | 'compact'
  surface: 'paper' | 'ink' | 'soft' | 'contrast'
  accent: string
  motion: 'system' | 'reduced' | 'off'
}
export type StudioDocument = {
  format: 'fleedfolio-studio'
  schemaVersion: 1
  documentId: Identifier
  revision: number
  identity: { displayName: string; roles: string[]; headline: string; bio: string; location: string; availability: string; links: DocumentLink[] }
  content: { skills: Skill[]; projects: Project[]; experience: Experience[]; education: Education[]; achievements?: Achievement[] }
  pages: StudioPage[]
  assets: Asset[]
  presentation: Presentation
  settings: { visibility: 'draft' | 'public' | 'unlisted'; discoverable: boolean; defaultPageId: Identifier; seo: { title: string; description: string } }
}
export const STUDIO_DRAFT_KEY = 'fleedfolio:studio-draft:v1'
export const STUDIO_MOODS = [
  { id: 'atelier', label: 'Margin', description: 'Literary, warm, editorial' },
  { id: 'index', label: 'Proof', description: 'Exacting technical index' },
  { id: 'studio', label: 'Collection', description: 'Graphic, visual, modular' },
  { id: 'terminal', label: 'Signal', description: 'Experimental systems lab' },
] as const
export type StudioMood = (typeof STUDIO_MOODS)[number]['id']
