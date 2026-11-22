import type { CSSProperties, ReactNode } from 'react'
import { safeUrl } from '@/lib/portfolio'
import type { DocumentLink, Project, ProjectLens, RichParagraph, RichRun, StudioBlock, StudioDocument } from './document'

type Props = {
  document: StudioDocument
  editing?: boolean
  selectedId?: string | null
  onSelect?: (id: string) => void
  lenses?: Record<string, ProjectLens>
  onLensChange?: (id: string, lens: ProjectLens) => void
}
function Inline({ runs }: { runs: RichRun[] }) {
  return <>{runs.map((run, i) => {
    let inner: ReactNode = run.text
    if (run.marks?.includes('code')) inner = <code>{inner}</code>
    if (run.marks?.includes('bold')) inner = <strong>{inner}</strong>
    if (run.marks?.includes('italic')) inner = <em>{inner}</em>
    if (run.marks?.includes('underline')) inner = <u>{inner}</u>
    const href = run.href ? safeUrl(run.href) : undefined
    return <span key={i}>{href ? <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a> : inner}</span>
  })}</>
}
function Paragraph({ paragraph }: { paragraph: RichParagraph }) {
  const children = <Inline runs={paragraph.runs}/>
  if (paragraph.kind === 'heading') return <h3 className="stx-rich-heading">{children}</h3>
  if (paragraph.kind === 'quote') return <blockquote>{children}</blockquote>
  if (paragraph.kind === 'bullet') return <p className="stx-bullet">{children}</p>
  return <p>{children}</p>
}
function ExternalLink({ link }: { link: DocumentLink }) {
  const href = safeUrl(link.url)
  return href ? <a href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer">{link.label}<span aria-hidden>↗</span></a> : null
}
const lensNames: Record<ProjectLens, string> = { story: 'The story', spec: 'How it works', board: 'Visuals', demo: 'Experience' }
function ProjectStudy({ project, initial, lens, onLensChange }: { project: Project; initial: ProjectLens; lens?: ProjectLens; onLensChange?: (lens: ProjectLens) => void }) {
  const supported = (Object.keys(lensNames) as ProjectLens[]).filter(key => project.lenses[key].enabled)
  const selected = supported.includes(lens ?? initial) ? lens ?? initial : supported[0]
  const spec = project.lenses.spec
  const story = project.lenses.story
  const board = project.lenses.board
  const demo = project.lenses.demo
  return <section className="stx-project-study" aria-labelledby={'studio-project-' + project.id}>
    <div className="stx-project-topline"><span>Selected work / {project.year || 'Undated'}</span><span>Project 001 — {project.contribution || 'A closer look'}</span></div>
    <div className="stx-project-opening">
      <h2 id={'studio-project-' + project.id}>{project.title}</h2>
      <div className="stx-project-description"><p>{project.summary}</p><p className="stx-project-contribution">{project.contribution}</p></div>
    </div>
    {spec.enabled && (spec.problem || spec.approach) && <div className="stx-diagram" role="img" aria-label={'Project structure: ' + [spec.problem, spec.approach, project.summary].filter(Boolean).join('; ')}>
      <div className="stx-diagram-head"><span>01 / System notes</span><span>Observe → Explain</span></div>
      <div className="stx-diagram-row">
        <div className="stx-diagram-node"><small>CONTEXT</small><strong>{spec.problem || 'The starting point'}</strong></div>
        <span className="stx-diagram-arrow" aria-hidden>→</span>
        <div className="stx-diagram-node"><small>APPROACH</small><strong>{spec.approach || project.contribution || 'A considered solution'}</strong></div>
        <span className="stx-diagram-arrow" aria-hidden>→</span>
        <div className="stx-diagram-node"><small>OUTPUT</small><strong>{project.summary}</strong></div>
      </div>
      <div className="stx-diagram-foot"><span>Designed from the project's authored facts</span><span>Not a live service diagram</span></div>
    </div>}
    {supported.length > 1 && <div className="stx-lenses" role="group" aria-label={'Views of ' + project.title}>
      <span>Explore this project</span>
      <div className="stx-lens-buttons">{supported.map(key =>
        <button type="button" key={key} className={key === selected ? 'is-active' : ''} aria-pressed={key === selected} onClick={() => onLensChange?.(key)}>{lensNames[key]}</button>
      )}</div>
    </div>}
    {selected === 'story' && <div className="stx-lens-content stx-story">
      {story.sections.map(section => <section key={section.id} className="stx-story-section">
        <div className="stx-story-side">Inside the work /</div>
        <div><h3>{section.heading}</h3>{section.paragraphs.map((paragraph, i) => <Paragraph paragraph={paragraph} key={i}/>)}</div>
      </section>)}
    </div>}
    {selected === 'spec' && <div className="stx-lens-content stx-spec">
      <div><span className="stx-subtitle">The problem</span><p>{spec.problem || 'No problem statement supplied.'}</p></div>
      <div><span className="stx-subtitle">The approach</span><p>{spec.approach || 'No approach supplied.'}</p></div>
      {!!spec.decisions.length && <div><span className="stx-subtitle">Decisions</span><ul>{spec.decisions.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}
      {!!spec.tradeoffs.length && <div><span className="stx-subtitle">Trade-offs</span><ul>{spec.tradeoffs.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}
      {!!spec.metrics.length && <div className="stx-metrics">{spec.metrics.map(metric => <div key={metric.id}><strong>{metric.value}</strong><span>{metric.label}</span><small>{metric.context}</small></div>)}</div>}
    </div>}
    {selected === 'board' && <div className="stx-lens-content"><p>{board.caption || 'This project has no images in its portable archive yet.'}</p><p className="stx-note">Media requires approved upload and portable asset bytes. This preview does not invent imagery.</p></div>}
    {selected === 'demo' && <div className="stx-lens-content"><p>{demo.fallbackText}</p>{demo.url && safeUrl(demo.url) && <a className="stx-demo-link" href={safeUrl(demo.url)} target="_blank" rel="noopener noreferrer">{demo.launchLabel || 'Open demo'} ↗</a>}</div>}
    {!!project.links.length && <div className="stx-project-links">{project.links.map(link => <ExternalLink link={link} key={link.id}/>)}</div>}
  </section>
}

export function StudioView({ document: doc, editing = false, selectedId, onSelect, lenses, onLensChange }: Props) {
  const page = doc.pages.find(p => p.id === doc.settings.defaultPageId) ?? doc.pages[0]
  if (!page) return <main><p>No pages in this document.</p></main>
  const items = doc.content
  const identify = (block: StudioBlock, body: ReactNode) =>
    <div key={block.id} className={'stx-block' + (editing ? ' stx-block-editable' : '') + (selectedId === block.id ? ' stx-selected' : '')}
      data-block-type={block.type} data-block-id={block.id}>
      {editing && <button type="button" className="stx-edit-target" onClick={() => onSelect?.(block.id)} aria-label={'Edit ' + block.type + ' block'}>Edit block</button>}
      {body}
    </div>
  const renderBlock = (block: StudioBlock): ReactNode => {
    switch(block.type){
      case 'identity': return identify(block, <section className="stx-hero" aria-label="Creator identity">
        <div className="stx-hero-index"><span>Independent work / <strong>{doc.identity.location || 'Everywhere'}</strong></span><span>PORTFOLIO / 001</span></div>
        <div className="stx-hero-inner">
          <div><p className="stx-hero-kicker">A thoughtful record of building things.</p><h1>{doc.identity.displayName || 'Untitled portfolio'}</h1></div>
          <div className="stx-hero-aside"><div className="stx-hero-mark">↗</div><p>{doc.identity.headline || 'The work speaks for itself.'}</p><small>{doc.identity.roles.join(' / ')}</small></div>
        </div>
        <div className="stx-hero-bottom"><span>{doc.identity.availability || 'Independent work'}</span><span>Scroll to explore ↓</span></div>
      </section>)
      case 'rich-text': return identify(block, <section className="stx-intro"><div className="stx-section-index">00 / Intro</div><div className="stx-intro-copy">{block.paragraphs.map((p,i)=><Paragraph key={i} paragraph={p}/>)}</div></section>)
      case 'project': {
        const project = items.projects.find(p => p.id === block.projectId)
        return identify(block, project ? <ProjectStudy project={project} initial={block.defaultLens} lens={lenses?.[project.id]} onLensChange={lens => onLensChange?.(project.id,lens)}/> : <p>Project reference unavailable.</p>)
      }
      case 'project-list': return identify(block, <section className="stx-project-list"><h2>Selected work</h2>{block.projectIds.map((id,i)=>{const project=items.projects.find(p=>p.id===id);return project&&<div key={id}><span>0{i+1}</span><strong>{project.title}</strong><span>{project.year}</span></div>})}</section>)
      case 'skills': return identify(block,<section className="stx-skills"><div className="stx-section-index">In practice / Tools</div><div><h2>What I work with</h2><ul>{block.skillIds.map((id,i)=>{const skill=items.skills.find(x=>x.id===id);return skill&&<li key={id}><span>{String(i+1).padStart(2,'0')}</span><strong>{skill.label}</strong><small>{skill.category}</small></li>})}</ul></div></section>)
      case 'links': return identify(block,<footer className="stx-footer"><span>There is always more to make.</span><div className="stx-footer-links">{block.linkIds.map(id=>{const link=doc.identity.links.find(l=>l.id===id);return link&&<ExternalLink link={link} key={id}/>})}</div><div className="stx-footer-bottom"><span>{doc.identity.displayName} / Selected work</span><span>Made with care, not a template.</span></div></footer>)
      case 'divider': return identify(block, <hr className={'stx-divider stx-divider-'+block.weight}/>)
      case 'code': return identify(block, <figure className="stx-code"><figcaption>{block.caption || block.language}</figcaption><pre><code>{block.source}</code></pre></figure>)
      case 'timeline': return identify(block,<section className="stx-timeline"><h2>{block.collection === 'experience' ? 'Experience' : 'Education'}</h2><ol>{block.itemIds.map(id=>{const v=block.collection==='experience'?items.experience.find(x=>x.id===id):items.education.find(x=>x.id===id);if(!v)return null;return <li key={id}><strong>{'role' in v?v.role:v.qualification}</strong><span>{'organisation' in v?v.organisation:v.institution}</span><small>{'start' in v?v.start+' – '+(v.end||'Present'):v.period}</small></li>})}</ol></section>)
      case 'group': return identify(block,<div className={'stx-group stx-group-'+block.layout}>{block.children.map(child=>renderBlock(child))}</div>)
      case 'media': return identify(block,<figure className="stx-media-placeholder"><figcaption>{block.caption || 'Media asset'}</figcaption><p>Asset references are not live uploads. Media bytes are required to display this image.</p></figure>)
      case 'embed': return identify(block,<div className="stx-embed"><p>{block.title}</p><p>{block.fallbackText}</p><a href={safeUrl(block.url)} target="_blank" rel="noopener noreferrer">Open external experience ↗</a><small>External content is not loaded in this page.</small></div>)
    }
  }
  return <main className="stx-public" data-system={doc.presentation.system} data-motion={doc.presentation.motion} style={{'--stx-user-accent':doc.presentation.accent} as CSSProperties}>
    <div className="stx-site-nav"><a href="#stx-start" className="stx-site-identity">{doc.identity.displayName || 'Creator'}</a><span>Work / Thought / Process</span><a href="#stx-bottom">Get in touch <span aria-hidden>↗</span></a></div>
    <div id="stx-start" className="stx-document">{page.blocks.map(renderBlock)}</div>
    <div id="stx-bottom" className="stx-end-anchor" aria-hidden />
  </main>
}
