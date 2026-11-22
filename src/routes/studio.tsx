import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowDown, ArrowUp, Download, FilePlus2, RotateCcw, RotateCw, Upload, X } from 'lucide-react'
import sample from '@/studio/fixtures/illustrative-portfolio.json'
import { StudioView } from '@/studio/StudioView'
import { STUDIO_DRAFT_KEY, STUDIO_MOODS, type Project, type ProjectLens, type StudioBlock, type StudioDocument, type StudioMood } from '@/studio/document'
import { parseStudioArchive, validateStudioDocument } from '@/studio/validate'
import '@/studio/studio.css'

export const Route = createFileRoute('/studio')({ component: StudioRoute })

const original = sample as unknown as StudioDocument
type History = { past: StudioDocument[]; present: StudioDocument; future: StudioDocument[] }
const start: History = { past: [], present: original, future: [] }
const createId = (prefix: string) => prefix + '_' + Math.random().toString(36).slice(2, 12)
const plain = (text: string) => ({ kind: 'paragraph' as const, runs: [{ text }] })
const clone = (doc: StudioDocument): StudioDocument => JSON.parse(JSON.stringify(doc)) as StudioDocument

function blankDocument(): StudioDocument {
  const doc = clone(original)
  doc.documentId = createId('doc')
  doc.identity = { displayName: 'Untitled creator', roles: [], headline: '', bio: '', location: '', availability: '', links: [] }
  doc.content = { skills: [], projects: [], experience: [], education: [] }
  doc.pages = [{ id: 'page_home', slug: '/', title: 'Home', blocks: [
    { id: createId('blk'), type: 'identity', scale: 'hero', style: { variant: 'hero', emphasis: 'normal' } },
    { id: createId('blk'), type: 'rich-text', paragraphs: [plain('Write something about the work you care about.')], style: { variant: 'lead', emphasis: 'normal' } },
  ] }]
  doc.settings.visibility = 'draft'
  doc.settings.discoverable = false
  doc.settings.defaultPageId = 'page_home'
  doc.revision = 0
  return doc
}
function StudioRoute() {
  const [history, setHistory] = useState<History>(start)
  const [hydrated, setHydrated] = useState(false)
  const [editing, setEditing] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lenses, setLenses] = useState<Record<string, ProjectLens>>({})
  const [status, setStatus] = useState('Local preview · not published')
  const uploadRef = useRef<HTMLInputElement>(null)
  const doc = history.present
  const page = doc.pages.find(p => p.id === doc.settings.defaultPageId) ?? doc.pages[0]
  const blocks = page?.blocks ?? []
  const selected = blocks.find(block => block.id === selectedId) ?? blocks[0]
  const project = selected?.type === 'project' ? doc.content.projects.find(p => p.id === selected.projectId) : undefined
  const studioSystem = STUDIO_MOODS.find(m => m.id === doc.presentation.system)?.id ?? 'atelier'

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STUDIO_DRAFT_KEY)
      if (raw) {
        const next = parseStudioArchive(raw)
        if (next.ok) setHistory({ past: [], present: next.document, future: [] })
        else setStatus('Stored draft was invalid; sample loaded. No legacy data was changed.')
      }
    } catch { setStatus('Local storage unavailable. You can still export JSON.') }
    setHydrated(true)
  }, [])
  useEffect(() => {
    if (!hydrated) return
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STUDIO_DRAFT_KEY, JSON.stringify(doc))
        setStatus('Saved on this device · not published')
      } catch { setStatus('Could not save locally. Export your work as JSON.') }
    }, 350)
    return () => window.clearTimeout(timer)
  }, [doc, hydrated])
  const commit = (transform: (doc: StudioDocument) => void) => setHistory(current => {
    const next = clone(current.present)
    transform(next)
    next.revision = current.present.revision + 1
    return { present: next, past: [...current.past.slice(-39), current.present], future: [] }
  })
  const undo = () => setHistory(current => {
    const previous = current.past.at(-1)
    return previous ? { past: current.past.slice(0, -1), present: previous, future: [current.present, ...current.future] } : current
  })
  const redo = () => setHistory(current => {
    const next = current.future[0]
    return next ? { past: [...current.past, current.present], present: next, future: current.future.slice(1) } : current
  })
  const patchIdentity = (key: 'displayName' | 'headline' | 'location' | 'availability' | 'bio', value: string) =>
    commit(next => { next.identity[key] = value })
  const patchProject = (key: 'title' | 'summary' | 'contribution' | 'year', value: string) =>
    commit(next => { const p = next.content.projects.find(p => p.id === project?.id); if (p) p[key] = value })
  const patchBlock = (id: string, transform: (block: StudioBlock) => void) =>
    commit(next => { const b = next.pages[0]?.blocks.find(item => item.id === id); if (b) transform(b) })
  const addBlock = (kind: 'rich-text' | 'project' | 'divider' | 'skills') => {
    const blockId = createId('blk')
    commit(next => {
      const page = next.pages[0]
      if (!page) return
      const style = { variant: 'standard', emphasis: 'normal' as const }
      if (kind === 'rich-text') page.blocks.push({ id: blockId, type: 'rich-text', style, paragraphs: [plain('Your story begins here.')] })
      if (kind === 'divider') page.blocks.push({ id: blockId, type: 'divider', style, weight: 'rule' })
      if (kind === 'skills') page.blocks.push({ id: blockId, type: 'skills', style, display: 'list', skillIds: next.content.skills.map(s => s.id) })
      if (kind === 'project') {
        const id = createId('proj')
        const newProject: Project = { id, title: 'A new project', summary: '', year: '', contribution: '', skillIds: [], links: [], coverAssetId: null,
          lenses: {
            story: { enabled: true, sections: [{ id: createId('section'), heading: 'The idea', paragraphs: [plain('Why this project exists.')] }] },
            spec: { enabled: false, problem: '', approach: '', decisions: [], tradeoffs: [], metrics: [], architectureAssetId: null },
            board: { enabled: false, assetIds: [], caption: '' },
            demo: { enabled: false, url: null, fallbackText: '', launchLabel: 'View demo' },
          } }
        next.content.projects.push(newProject)
        page.blocks.push({ id: blockId, type: 'project', projectId: id, defaultLens: 'story', style })
      }
    })
    setSelectedId(blockId); setEditing(true)
  }
  const move = (id: string, offset: number) => commit(next => {
    const list = next.pages[0]?.blocks
    if (!list) return
    const index = list.findIndex(block => block.id === id)
    const target = index + offset
    if (index >= 0 && target >= 0 && target < list.length) {
      const removed = list.splice(index, 1)[0]
      if (removed) list.splice(target, 0, removed)
    }
  })
  const remove = (id: string) => {
    commit(next => { if (next.pages[0]) next.pages[0].blocks = next.pages[0].blocks.filter(block => block.id !== id) })
    setSelectedId(null)
  }
  const download = () => {
    const result = validateStudioDocument(doc)
    if (!result.ok) { setStatus('Fix document before export: ' + result.issues.slice(0,2).join('; ')); return }
    const text = JSON.stringify(doc, null, 2) + '\n'
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url; link.download = 'fleedfolio-' + doc.documentId + '.json'; link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 2000)
    setStatus('JSON exported; it contains no publishing credentials.')
  }
  const importFile = async (file?: File) => {
    if (!file) return
    const result = parseStudioArchive(await file.text())
    if (!result.ok) { setStatus('Import rejected: ' + result.issues.slice(0,3).join('; ')); return }
    setHistory(current => ({ past: [...current.past.slice(-39),current.present], present: result.document, future: [] }))
    setStatus('Imported. Saved locally; not published.')
    setSelectedId(null)
  }
  return <div className="stx-shell">
    <a className="stx-skip" href="#stx-start">Skip to portfolio</a>
    <header className="stx-workbar">
      <div className="stx-workbar-brand"><strong>fleed<span>.</span></strong><span>Studio / experimental</span></div>
      <div className="stx-workbar-actions">
        <button type="button" onClick={undo} disabled={!history.past.length} title="Undo"><RotateCcw size={16}/><span className="stx-desktop-only">Undo</span></button>
        <button type="button" onClick={redo} disabled={!history.future.length} title="Redo"><RotateCw size={16}/><span className="stx-desktop-only">Redo</span></button>
        <label className="stx-mood-label">Expression <select value={studioSystem} onChange={e => commit(next => {next.presentation.system = e.target.value as StudioMood})} aria-label="Choose a design expression">{STUDIO_MOODS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button type="button" onClick={() => setEditing(open => !open)} className="stx-primary-action" aria-pressed={editing}>{editing ? 'Preview' : 'Edit portfolio'}</button>
      </div>
    </header>
    <div className="stx-statusbar" role="status">{status}<span>Changes are local to this browser. Publishing is not connected.</span></div>
    <div className={'stx-workspace' + (editing ? ' is-editing' : '')}>
      <StudioView document={doc} editing={editing} selectedId={selected?.id} onSelect={setSelectedId}
        lenses={lenses} onLensChange={(id,lens)=>setLenses(previous => ({...previous,[id]:lens}))}/>
      {editing && <aside className="stx-editor" aria-label="Portfolio editing controls">
        <div className="stx-editor-heading"><div><small>YOUR CANVAS</small><h2>Make it yours.</h2></div><button onClick={()=>setEditing(false)} aria-label="Close editor"><X size={18}/></button></div>
        <div className="stx-editor-tools">
          <button onClick={() => uploadRef.current?.click()}><Upload size={15}/> Import</button>
          <button onClick={download}><Download size={15}/> Export JSON</button>
          <button onClick={() => { if (window.confirm('Start a new document? Your current Studio changes will be replaced. Export a backup first.')) {setHistory(current => ({past:[...current.past.slice(-39),current.present], present:blankDocument(), future:[]}));setSelectedId(null)} }}><FilePlus2 size={15}/> Start blank</button>
          <input ref={uploadRef} type="file" accept=".json,application/json" className="stx-hidden-input" onChange={e => {void importFile(e.target.files?.[0]);e.target.value=''}}/>
        </div>
        <h3 className="stx-editor-label">Page structure</h3>
        <ol className="stx-block-list">{blocks.map((block,i)=><li key={block.id} className={selected?.id === block.id ? 'is-selected' : ''}>
          <button onClick={()=>setSelectedId(block.id)} aria-current={selected?.id===block.id?'true':undefined}><span className="stx-order">{String(i+1).padStart(2,'0')}</span>{block.type.replaceAll('-', ' ')}</button>
          <div><button onClick={()=>move(block.id,-1)} disabled={i===0} aria-label={'Move '+block.type+' up'}><ArrowUp size={14}/></button><button onClick={()=>move(block.id,1)} disabled={i===blocks.length-1} aria-label={'Move '+block.type+' down'}><ArrowDown size={14}/></button></div>
        </li>)}</ol>
        <div className="stx-insert"><h3 className="stx-editor-label">Add to page</h3><div>{(['rich-text','project','skills','divider'] as const).map(k=><button key={k} onClick={()=>addBlock(k)}>+ {k.replace('-',' ')}</button>)}</div></div>
        <div className="stx-editor-fields">
          <h3 className="stx-editor-label">Selected / {selected?.type ?? 'none'}</h3>
          {selected?.type === 'identity' && <>
            <label>Name<input value={doc.identity.displayName} maxLength={100} onChange={e=>patchIdentity('displayName',e.target.value)}/></label>
            <label>Headline<textarea value={doc.identity.headline} maxLength={320} onChange={e=>patchIdentity('headline',e.target.value)}/></label>
            <label>Location<input value={doc.identity.location} maxLength={100} onChange={e=>patchIdentity('location',e.target.value)}/></label>
            <label>Availability<input value={doc.identity.availability} maxLength={160} onChange={e=>patchIdentity('availability',e.target.value)}/></label>
          </>}
          {selected?.type === 'rich-text' && selected.paragraphs.map((paragraph,index)=><label key={index}>Paragraph {index+1}<textarea value={paragraph.runs.map(r=>r.text).join('')} onChange={e=>patchBlock(selected.id,block=>{
            if(block.type==='rich-text') block.paragraphs[index]={kind:'paragraph', runs:[{text:e.target.value}]}
          })}/></label>)}
          {selected?.type === 'project' && project && <>
            <label>Project name<input value={project.title} onChange={e=>patchProject('title',e.target.value)} maxLength={160}/></label>
            <label>Project summary<textarea value={project.summary} onChange={e=>patchProject('summary',e.target.value)} maxLength={1200}/></label>
            <label>My contribution<textarea value={project.contribution} onChange={e=>patchProject('contribution',e.target.value)} maxLength={500}/></label>
            <label>Year<input value={project.year} onChange={e=>patchProject('year',e.target.value)} maxLength={30}/></label>
            <label>Story text<textarea value={project.lenses.story.sections[0]?.paragraphs[0]?.runs[0]?.text ?? ''} onChange={e=>commit(next=>{
              const p=next.content.projects.find(p=>p.id===project.id)
              if (p?.lenses.story.sections[0]) p.lenses.story.sections[0].paragraphs=[plain(e.target.value)]
            })}/></label>
            <label className="stx-toggle"><input type="checkbox" checked={project.lenses.spec.enabled} onChange={e=>commit(next=>{
              const p=next.content.projects.find(p=>p.id===project.id); if (p) p.lenses.spec.enabled=e.target.checked
            })}/> Enable engineering lens</label>
            {project.lenses.spec.enabled && <>
              <label>Problem<textarea value={project.lenses.spec.problem} onChange={e=>commit(next=>{const p=next.content.projects.find(p=>p.id===project.id);if(p)p.lenses.spec.problem=e.target.value})}/></label>
              <label>Approach<textarea value={project.lenses.spec.approach} onChange={e=>commit(next=>{const p=next.content.projects.find(p=>p.id===project.id);if(p)p.lenses.spec.approach=e.target.value})}/></label>
            </>}
          </>}
          {selected?.type === 'divider' && <p className="stx-editor-hint">A meaningful pause between sections.</p>}
          {selected?.type === 'skills' && <p className="stx-editor-hint">This block references skills in the document. Detailed skill editing is a later milestone.</p>}
          {selected && selected.type !== 'identity' && <button className="stx-remove" onClick={()=>remove(selected.id)}>Remove selected block</button>}
        </div>
        <p className="stx-editor-hint">This is a local creative proof. No accounts, file uploads or live publishing are connected. Existing Fleed portfolios and edit keys are unaffected.</p>
      </aside>}
    </div>
  </div>
}
