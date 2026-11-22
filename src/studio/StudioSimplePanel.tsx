import { useState } from 'react'
import type { StudioDocument } from './document'
import { addSimpleProject, addSimpleSkill, hideSimpleSkill, readSimpleIntro, visibleSimpleSkills, writeSimpleIntro } from './shared-editor'

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
  const [newSkill, setNewSkill] = useState('')
  const story = readSimpleIntro(doc)
  const shownSkills = visibleSimpleSkills(doc)
  const updateIdentity = (key: 'displayName' | 'headline' | 'location' | 'availability', value: string) =>
    onCommit(next => { next.identity[key] = value })
  const updateProject = (id: string, key: 'title' | 'summary' | 'year' | 'contribution', value: string) =>
    onCommit(next => { const project = next.content.projects.find(item => item.id === id); if (project) project[key] = value })
  const updateStory = (value: string) => onCommit(next => { writeSimpleIntro(next, value) })
  const addProject = () => onCommit(next => { addSimpleProject(next, makeId) })
  const addSkill = () => {
    if (!newSkill.trim()) return
    onCommit(next => { addSimpleSkill(next, newSkill, makeId) })
    setNewSkill('')
  }
  const removeSkill = (id: string) => onCommit(next => { hideSimpleSkill(next, id) })

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
      {story !== null ? <Field name="Introduction" value={story} onChange={updateStory} multiline placeholder="What's important to you and your work?" /> :
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
      <div className="stx-simple-skill-list">
        {shownSkills.map(skill => <span className="stx-simple-skill" key={skill.id}>{skill.label}<button type="button" onClick={() => removeSkill(skill.id)} aria-label={'Remove ' + skill.label + ' from page'}>×</button></span>)}
      </div>
      <label className="stx-quick-field"><span>Add a skill or tool</span><span className="stx-add-skill-row"><input value={newSkill} maxLength={70} placeholder="Writing, design, Python…" onChange={event => setNewSkill(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addSkill() } }} /><button type="button" onClick={addSkill}>Add</button></span></label>
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
