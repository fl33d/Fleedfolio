import { useEffect, useRef, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'

import {
  emptyCustomSection,
  emptyEducation,
  emptyExperience,
  emptyProject,
  emptySocial,
  type Portfolio,
} from '@/lib/portfolio'

type ItemKind = 'text' | 'project' | 'skills' | 'about' | 'experience' | 'education' | 'contact' | 'link'
type LibraryItem = { kind: ItemKind; name: string; description: string; target?: string }

const LIBRARY: LibraryItem[] = [
  { kind: 'text', name: 'Freeform section', description: 'Write anything, with an optional image.' },
  { kind: 'project', name: 'Project', description: 'Show what you made and why.', target: 'work' },
  { kind: 'skills', name: 'Skills', description: 'List the things you work with.', target: 'top' },
  { kind: 'about', name: 'About', description: 'Tell your story in your own words.', target: 'about' },
  { kind: 'experience', name: 'Experience', description: 'Add a position or collaboration.', target: 'experience' },
  { kind: 'education', name: 'Education', description: 'Add a school, course or qualification.', target: 'education' },
  { kind: 'contact', name: 'Contact', description: 'Make it easy to reach you.', target: 'contact' },
  { kind: 'link', name: 'Social link', description: 'Add another place to find your work.', target: 'contact' },
]

/**
 * A small, inline library for the original homepage builder.
 * Content uses the existing legacy Portfolio shape: no duplicate
 * document source, no new persistence key, no editor-mode switch.
 */
export function Elements({ data, onChange }: {
  data: Portfolio
  onChange: (updater: (current: Portfolio) => Portfolio) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeEscape)
    }
  }, [open])

  const add = (kind: ItemKind) => {
    const item = LIBRARY.find(entry => entry.kind === kind)
    const addition = kind === 'text' ? emptyCustomSection()
      : kind === 'project' ? emptyProject() : undefined

    onChange(current => {
      const hidden = current.hidden.filter(section =>
        !(kind === 'project' && section === 'work') &&
        !(kind === 'link' && section === 'contact') &&
        !(section === kind)
      )

      if (kind === 'text' && addition && current.extras.length < 12)
        return { ...current, hidden, extras: [...current.extras, addition as Portfolio['extras'][number]] }
      if (kind === 'project' && addition && current.projects.length < 24)
        return { ...current, hidden, projects: [...current.projects, addition as Portfolio['projects'][number]] }
      if (kind === 'experience' && current.experience.length < 24)
        return { ...current, hidden, experience: [...current.experience, emptyExperience()] }
      if (kind === 'education' && current.education.length < 24)
        return { ...current, hidden, education: [...current.education, emptyEducation()] }
      if (kind === 'link' && current.socials.length < 24)
        return { ...current, hidden, socials: [...current.socials, emptySocial()] }
      return { ...current, hidden }
    })

    setOpen(false)
    setQuery('')
    const target = kind === 'text' && addition ? 'section-' + addition.id : item?.target
    if (target) window.setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 90)
    triggerRef.current?.focus()
  }

  const results = LIBRARY.filter(item =>
    (item.name + ' ' + item.description).toLowerCase().includes(query.toLowerCase().trim())
  )

  return <div ref={root} className="el-root">
    <button ref={triggerRef} type="button" className="dock-icon el-trigger"
      aria-label="Add an element" aria-haspopup="dialog" aria-expanded={open}
      title="Add a section" onClick={() => {
        const next = !open
        setOpen(next)
        if (next) window.setTimeout(() => searchRef.current?.focus(), 50)
      }}>
      <Plus className="size-5" aria-hidden="true"/>
      <span className="el-trigger-text">Add</span>
    </button>

    {open && <div role="dialog" aria-label="Add to your portfolio" className="el-panel">
      <div className="el-panel-header">
        <div><small>YOUR PAGE</small><h2>Add something.</h2></div>
        <button type="button" className="el-close" aria-label="Close element library"
          onClick={() => { setOpen(false); triggerRef.current?.focus() }}><X className="size-4"/></button>
      </div>
      <label className="el-search">
        <Search className="size-4" aria-hidden="true"/>
        <span className="sr-only">Find an element</span>
        <input ref={searchRef} type="search" placeholder="Search elements" value={query}
          onChange={event => setQuery(event.target.value)}/>
      </label>
      <div className="el-options">
        {results.map((item, index) => <button key={item.kind} type="button"
          onClick={() => add(item.kind)} disabled={
            (item.kind === 'text' && data.extras.length >= 12) ||
            (item.kind === 'project' && data.projects.length >= 24) ||
            (item.kind === 'experience' && data.experience.length >= 24) ||
            (item.kind === 'education' && data.education.length >= 24) ||
            (item.kind === 'link' && data.socials.length >= 24)
          }>
          <span className="el-option-icon" aria-hidden="true">{String(index + 1).padStart(2,'0')}</span>
          <span><strong>{item.name}</strong><small>{item.description}</small></span>
          <Plus className="size-4" aria-hidden="true"/>
        </button>)}
        {!results.length && <p className="el-empty">Nothing found. Try another word.</p>}
      </div>
      <p className="el-footnote">Write directly on the page. Customise more whenever you like.</p>
    </div>}
  </div>
}
