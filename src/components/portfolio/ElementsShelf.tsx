import {
  BookOpenText, BriefcaseBusiness, GraduationCap, Link2, Plus, Wrench, X,
  type LucideIcon,
} from 'lucide-react'

export type ElementKind = 'text' | 'project' | 'experience' | 'education' | 'skills' | 'contact'

export const ELEMENT_KINDS: readonly ElementKind[] = [
  'text', 'project', 'experience', 'education', 'skills', 'contact',
]

const ELEMENTS: readonly {
  kind: ElementKind
  title: string
  description: string
  icon: LucideIcon
}[] = [
  { kind: 'text', title: 'Text section', description: 'A new section for your story.', icon: BookOpenText },
  { kind: 'project', title: 'Selected work', description: 'Show a project or creation.', icon: Plus },
  { kind: 'experience', title: 'Experience', description: 'A role, job or contribution.', icon: BriefcaseBusiness },
  { kind: 'education', title: 'Education', description: 'Courses and qualifications.', icon: GraduationCap },
  { kind: 'skills', title: 'Skills & tools', description: 'Build a searchable skills list.', icon: Wrench },
  { kind: 'contact', title: 'Contact & links', description: 'Let visitors reach you.', icon: Link2 },
]

export function ElementsShelf({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (kind: ElementKind) => void
}) {
  if (!open) return null
  return (
    <aside className="element-shelf chrome" role="dialog" aria-label="Elements library">
      <div className="element-shelf-head">
        <div>
          <span className="element-shelf-kicker">Fleed workbench</span>
          <h2>Add something</h2>
        </div>
        <button type="button" className="element-shelf-close" onClick={onClose} aria-label="Close Elements">
          <X className="size-4" />
        </button>
      </div>
      <p className="element-shelf-intro">Click an element, or drag it onto the page. Fleed keeps everything responsive.</p>
      <div className="element-options">
        {ELEMENTS.map(({ kind, title, description, icon: Icon }) => (
          <button
            key={kind}
            type="button"
            className="element-option"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('application/x-fleed-element', kind)
              event.dataTransfer.effectAllowed = 'copy'
            }}
            onClick={() => onAdd(kind)}
          >
            <span className="element-option-icon"><Icon className="size-4" /></span>
            <span className="element-option-text"><strong>{title}</strong><small>{description}</small></span>
            <span className="element-option-add" aria-hidden="true">+</span>
          </button>
        ))}
      </div>
      <p className="element-shelf-foot">Sections stay structured for mobile layouts and CVs. Fine-grained positioning comes later.</p>
    </aside>
  )
}
