import { useState } from 'react'
import {
  BookOpenText, BriefcaseBusiness, GraduationCap, Link2, Plus,
  Search, Sparkles, Wrench, X, type LucideIcon,
} from 'lucide-react'

export type ElementKind = 'text' | 'project' | 'experience' | 'education' | 'skills' | 'contact'

export const ELEMENT_KINDS: readonly ElementKind[] = [
  'text', 'project', 'experience', 'education', 'skills', 'contact',
]

type LibraryItem = {
  kind: ElementKind
  title: string
  description: string
  icon: LucideIcon
  group: 'Content' | 'Your profile'
}
const ELEMENTS: readonly LibraryItem[] = [
  { kind: 'text', title: 'Text section', description: 'Write an introduction, story or reflection.', icon: BookOpenText, group: 'Content' },
  { kind: 'project', title: 'Project', description: 'Add another piece of selected work.', icon: Plus, group: 'Content' },
  { kind: 'skills', title: 'Skills & tools', description: 'Describe what you know and use.', icon: Wrench, group: 'Content' },
  { kind: 'experience', title: 'Experience', description: 'A job, contribution or role.', icon: BriefcaseBusiness, group: 'Your profile' },
  { kind: 'education', title: 'Education', description: 'School, training or qualifications.', icon: GraduationCap, group: 'Your profile' },
  { kind: 'contact', title: 'Contact & links', description: 'How visitors can reach you.', icon: Link2, group: 'Your profile' },
]

/** Not modal: people can keep writing directly on their portfolio with this open. */
export function ElementsShelf({
  open, onClose, onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (kind: ElementKind) => void
}) {
  const [query, setQuery] = useState('')
  if (!open) return null
  const filtered = ELEMENTS.filter(({ title, description, kind }) =>
    [title, description, kind].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
  return <aside id="ff-elements-library" className="element-shelf ff-library" aria-label="Elements library">
    <div className="element-shelf-head">
      <div><span className="element-shelf-kicker">YOUR WORKSPACE</span><h2>Library</h2></div>
      <button type="button" className="element-shelf-close" onClick={onClose} aria-label="Close elements library"><X size={19}/></button>
    </div>
    <p className="element-shelf-intro">Add something new. Or keep typing directly on your page — both work together.</p>
    <label className="ff-library-search"><Search size={17} aria-hidden="true"/>
      <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Find an element…" aria-label="Search elements"/>
      {query && <button type="button" aria-label="Clear element search" onClick={() => setQuery('')}><X size={14}/></button>}
    </label>
    <div className="ff-library-sections">
      {(['Content', 'Your profile'] as const).map(group => {
        const section = filtered.filter(item => item.group === group)
        if (!section.length) return null
        return <section className="ff-library-category" key={group} aria-label={group}>
          <h3>{group}</h3>
          <div className="element-options">
            {section.map(({ kind, title, description, icon: Icon }) => <button
              key={kind} type="button" className="element-option"
              draggable
              onDragStart={event => {
                event.dataTransfer.setData('application/x-fleed-element', kind)
                event.dataTransfer.effectAllowed = 'copy'
              }}
              onClick={() => onAdd(kind)}
            >
              <span className="element-option-icon"><Icon size={19}/></span>
              <span className="element-option-text"><strong>{title}</strong><small>{description}</small></span>
              <span className="element-option-add" aria-hidden="true">+</span>
            </button>)}
          </div>
        </section>
      })}
      {!filtered.length && <p className="ff-library-empty">No matching elements. Try another name.</p>}
    </div>
    <div className="ff-library-tip"><Sparkles size={17} aria-hidden="true"/><p><strong>Make it your own.</strong> Every element is editable on the canvas. You can drag supported elements or click to insert them.</p></div>
    <a href="/studio" className="ff-library-studio">Want advanced layouts? Explore Studio <span aria-hidden="true">↗</span></a>
  </aside>
}
