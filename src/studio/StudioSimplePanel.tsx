import type { StudioDocument, Project, StudioBlock } from './document'

type Update = (change: (doc: StudioDocument) => void) => void
type Props = {
  doc: StudioDocument
  onCommit: Update
  onOpenStudio: () => void
  onExport: () => void
  onImport: () => void
  onNew: () => void
}
const makeId = (prefix: string) => prefix + '_' + crypto.randomUUID().replaceAll('-', '').slice(0, 12)

function Field({ name, value, onChange, multiline = false, placeholder = '' }: {
  name: string
  value: string
  onChange: (next: string) => void
  multiline?: boolean
  placeholder?: string
}) {
  return <label className="stx-quick-field"><span>{name}</span>{multiline ?
    <textarea value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} rows={4} /> :
    <input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} />
  }</label>
}

/**
 * A shallow, human-friendly view of the SAME canonical Studio document.
 * It never replaces, normalizes, or deletes unsupported blocks.
 * Every change is applied through the parent editor's shared history.
 */
export function StudioSimplePanel({ doc, onCommit, onOpenStudio, onExport, onImport, onNew }: Props) {
  const page = doc.pages.find(p => p.id === doc.settings.defaultPageId)
  const intro = page?.blocks.find((block): block is Extract<StudioBlock, { type: 'rich-text' }> => block.type === 'rich-text')
  const story = intro?.paragraphs.map(p => p.runs.map(run => run.text).join('')).join('\n\n') ?? ''
  const updateIdentity = (key: 'displayName' | 'headline' | 'location' | 'availability', value: string) =>
    onCommit(next => { next.identity[key] = value })
  const updateProject = (id: string, key: 'title' | 'summary' | 'year' | 'contribution', value: string) =>
    onCommit(next => { const project = next.content.projects.find(item => item.id === id); if (project) project[key] = value })
  const updateStory = (value: string) => onCommit(next => {
    const targetPage = next.pages.find(p => p.id === next.settings.defaultPageId)
    const block = targetPage?.blocks.find((b): b is Extract<StudioBlock, { type: 'rich-text' }> => b.type === 'rich-text')
    if (block) block.paragraphs = value.split(/\n\n+/).slice(0, 20).map(text => ({ kind: 'paragraph', runs: [{ text }] }))
    // Never delete or rewrite other, more advanced blocks.
  })
  const addProject = () => onCommit(next => {
    const id = makeId('proj'), blockId = makeId('blk')
    const project: Project = {
      id, title: '', summary: '', year: '', contribution: '', skillIds: [], links: [], coverAssetId: null,
      lenses: {
        story: { enabled: true, sections: [{ id: makeId('section'), heading: 'What I made', paragraphs: [{ kind: 'paragraph', runs: [{ text: '' }] }] }] },
        spec: { enabled: false, problem: '', approach: '', decisions: [], tradeoffs: [], metrics: [], architectureAssetId: null },
        board: { enabled: false, assetIds: [], caption: '' },
        demo: { enabled: false, url: null, fallbackText: '', launchLabel: 'View demo' },
      },
    }
    next.content.projects.push(project)
    const targetPage = next.pages.find(p => p.id === next.settings.defaultPageId)
    targetPage?.blocks.push({ id: blockId, type: 'project', projectId: id, defaultLens: 'story', style: { variant: 'standard', emphasis: 'normal' } })
  })
  const updateSkills = (value: string) => onCommit(next => {
    const labels = value.split(',').map(s => s.trim()).filter(Boolean).slice(0, 40)
    const matched = labels.map(label => next.content.skills.find(s => s.label.toLowerCase() === label.toLowerCase())
      ?? { id: makeId('skill'), label, category: 'other' as const })
    // Preserve existing skills that advanced blocks or projects may reference.
    const known = new Set(next.content.skills.map(s => s.id))
    for (const skill of matched) if (!known.has(skill.id)) { next.content.skills.push(skill); known.add(skill.id) }
    const targetPage = next.pages.find(p => p.id === next.settings.defaultPageId)
    const existing = targetPage?.blocks.find((block): block is Extract<StudioBlock, { type: 'skills' }> => block.type === 'skills')
    if (existing) existing.skillIds = matched.map(s => s.id)
    else targetPage?.blocks.push({ id: makeId('blk'), type: 'skills', style: { variant: 'standard', emphasis: 'normal' }, skillIds: matched.map(s => s.id), display: 'text' })
  })
  const visibleSkills = (page?.blocks.find(b => b.type === 'skills') as Extract<StudioBlock, { type: 'skills' }> | undefined)?.skillIds
    .map(id => doc.content.skills.find(skill => skill.id === id)?.label).filter((x): x is string => !!x).join(', ') ?? ''

  return <aside className="stx-simple-panel" aria-label="Simple portfolio editor">
    <div className="stx-simple-opening">
      <span className="stx-simple-kicker"><span aria-hidden="true" className="stx-indicator" /> YOUR WORKSPACE / SIMPLE</span>
      <h2>Make it <em>yours.</em></h2>
      <p>Just write. Your portfolio updates as you go. Advanced layouts are kept safe when you return from Studio.</p>
    </div>
    <div className="stx-simple-actions">
      <button type="button" onClick={onNew}>Start fresh</button>
      <button type="button" onClick={onImport}>Import JSON</button>
      <button type="button" onClick={onExport}>Export JSON</button>
    </div>
    <section className="stx-quick-section" aria-labelledby="stx-your-details">
      <h3 id="stx-your-details"><span>01</span> Your details</h3>
      <Field name="Your name" value={doc.identity.displayName} onChange={value => updateIdentity('displayName', value)} placeholder="How people know you" />
      <Field name="What you do" value={doc.identity.headline} onChange={value => updateIdentity('headline', value)} multiline placeholder="One clear sentence about you" />
      <Field name="Based in" value={doc.identity.location} onChange={value => updateIdentity('location', value)} placeholder="Optional" />
      <Field name="Availability" value={doc.identity.availability} onChange={value => updateIdentity('availability', value)} placeholder="Optional" />
    </section>
    <section className="stx-quick-section" aria-labelledby="stx-your-story">
      <h3 id="stx-your-story"><span>02</span> Your story</h3>
      {intro ? <Field name="Introduction" value={story} onChange={updateStory} multiline placeholder="What's important to you and your work?" /> :
        <div className="stx-quick-preserve">Your introduction is arranged in advanced blocks. Open Studio to change its layout without losing anything.</div>}
    </section>
    <section className="stx-quick-section" aria-labelledby="stx-your-projects">
      <h3 id="stx-your-projects"><span>03</span> Your projects</h3>
      {doc.content.projects.map((project, index) => <div className="stx-quick-project" key={project.id}>
        <div className="stx-quick-project-label">PROJECT {String(index + 1).padStart(2, '0')}</div>
        <Field name="Project name" value={project.title} onChange={value => updateProject(project.id, 'title', value)} />
        <Field name="What you built" value={project.summary} onChange={value => updateProject(project.id, 'summary', value)} multiline />
        <Field name="Your contribution" value={project.contribution} onChange={value => updateProject(project.id, 'contribution', value)} multiline />
        <Field name="Year" value={project.year} onChange={value => updateProject(project.id, 'year', value)} />
      </div>)}
      <button type="button" className="stx-add-simple" onClick={addProject}>+ Add a project</button>
    </section>
    <section className="stx-quick-section" aria-labelledby="stx-your-skills">
      <h3 id="stx-your-skills"><span>04</span> Skills & tools</h3>
      <Field name="Separate skills with commas" value={visibleSkills} onChange={updateSkills} placeholder="Writing, Design, Python…" />
    </section>
    <div className="stx-quick-finale">
      <div className="stx-spark" aria-hidden="true">✳</div>
      <h3>There's more you can make.</h3>
      <p>Every piece of content here stays the same when you open the advanced canvas.</p>
      <button type="button" onClick={onOpenStudio}>Explore Studio <span aria-hidden="true">↗</span></button>
    </div>
    <p className="stx-quick-footnote">Saved locally in this browser. Live publishing is not yet connected to the Studio document model.</p>
  </aside>
}
