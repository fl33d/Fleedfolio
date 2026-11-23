import { useEffect, useRef, useState } from 'react'
import { AlignLeft, BookOpenText, BriefcaseBusiness, Contact, FolderOpen, GraduationCap, Image, Link2, Plus, Quote, Search, Shapes, Sparkles, X, type LucideIcon } from 'lucide-react'

import {
  emptyCustomSection,
  emptyEducation,
  emptyExperience,
  emptyProject,
  emptySocial,
  type Portfolio,
} from '@/lib/portfolio'

type ItemKind = 'text' | 'statement' | 'feature' | 'project' | 'skills' | 'about' | 'experience' | 'education' | 'contact' | 'link'
type ItemCategory = 'All' | 'Write' | 'Show' | 'About'
type LibraryItem = { kind: ItemKind; name: string; description: string; category: Exclude<ItemCategory,'All'>; icon: LucideIcon; target?: string }

const LIBRARY: LibraryItem[] = [
  { kind: 'text', name: 'Freeform section', description: 'A blank canvas for your words.', category:'Write', icon:AlignLeft },
  { kind: 'statement', name: 'Statement', description: 'One thought, beautifully oversized.', category:'Write', icon:Quote },
  { kind: 'feature', name: 'Feature story', description: 'Bring words and imagery together.', category:'Show', icon:Image },
  { kind: 'project', name: 'Project', description: 'A piece of work worth showcasing.', category:'Show', icon:FolderOpen, target:'work' },
  { kind: 'skills', name: 'Skills', description: 'Languages, tools and interests.', category:'About', icon:Shapes, target:'top' },
  { kind: 'about', name: 'About', description: 'The person behind the work.', category:'About', icon:BookOpenText, target:'about' },
  { kind: 'experience', name: 'Experience', description: 'Roles, collaborations and milestones.', category:'About', icon:BriefcaseBusiness, target:'experience' },
  { kind: 'education', name: 'Education', description: 'Learning and qualifications.', category:'About', icon:GraduationCap, target:'education' },
  { kind: 'contact', name: 'Contact', description: 'A welcoming place to say hello.', category:'About', icon:Contact, target:'contact' },
  { kind: 'link', name: 'Social link', description: 'Another place to find you.', category:'About', icon:Link2, target:'contact' },
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
  const [category, setCategory] = useState<ItemCategory>('All')
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
    const textAddition = (kind === 'text' || kind === 'statement' || kind === 'feature')
      ? emptyCustomSection(kind === 'statement' ? 'statement' : kind === 'feature' ? 'feature' : 'essay') : undefined
    const projectAddition = kind === 'project' ? emptyProject() : undefined

    onChange(current => {
      const hidden = current.hidden.filter(section =>
        !(kind === 'project' && section === 'work') &&
        !(kind === 'link' && section === 'contact') &&
        !(section === kind)
      )

      if (textAddition && current.extras.length < 12)
        return { ...current, hidden, extras: [...current.extras, textAddition] }
      if (kind === 'project' && projectAddition && current.projects.length < 24)
        return { ...current, hidden, projects: [...current.projects, projectAddition] }
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
    const target = textAddition ? 'section-' + textAddition.id : item?.target
    if (target) window.setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 90)
    triggerRef.current?.focus()
  }

  const results = LIBRARY.filter(item =>
    (category === 'All' || item.category === category) &&
    (item.name + ' ' + item.description).toLowerCase().includes(query.toLowerCase().trim())
  )

  return <div ref={root} className="el-root">
    <button ref={triggerRef} type="button" className="dock-icon el-trigger"
      aria-label="Add an element" aria-haspopup="dialog" aria-expanded={open}
      title="Add a section" onClick={() => {
        const next = !open
        setOpen(next)
        // Opening the shelf should not summon the on-screen keyboard on phones.
        if (next && window.matchMedia('(min-width: 641px)').matches)
          window.setTimeout(() => searchRef.current?.focus(), 50)
      }}>
      <Plus className="size-5" aria-hidden="true"/>
      <span className="el-trigger-text">Add</span>
    </button>

    {open && <div role="dialog" aria-label="Add to your portfolio" className="el-panel">
      <div className="el-panel-header">
        <div><small>YOUR ELEMENTS</small><h2>Make it yours.</h2></div>
        <button type="button" className="el-close" aria-label="Close element library"
          onClick={() => { setOpen(false); triggerRef.current?.focus() }}><X className="size-4"/></button>
      </div>
      <label className="el-search">
        <Search className="size-4" aria-hidden="true"/>
        <span className="sr-only">Find an element</span>
        <input ref={searchRef} type="search" placeholder="Search elements" value={query}
          onChange={event => setQuery(event.target.value)}/>
      </label>
      <div className="el-tabs" role="group" aria-label="Filter elements">
        {(['All','Write','Show','About'] as const).map(tab=>
          <button key={tab} type="button" aria-pressed={category===tab}
            onClick={()=>setCategory(tab)}>{tab}</button>)}
      </div>
      <div className="el-options">
        {results.map((item) => <button key={item.kind} type="button"
          onClick={() => add(item.kind)} disabled={
            (['text','statement','feature'].includes(item.kind) && data.extras.length >= 12) ||
            (item.kind === 'project' && data.projects.length >= 24) ||
            (item.kind === 'experience' && data.experience.length >= 24) ||
            (item.kind === 'education' && data.education.length >= 24) ||
            (item.kind === 'link' && data.socials.length >= 24)
          }>
          <span className="el-option-icon" aria-hidden="true"><item.icon size={19} strokeWidth={1.8}/></span>
          <span><strong>{item.name}</strong><small>{item.description}</small></span>
          <Plus className="size-4" aria-hidden="true"/>
        </button>)}
        {!results.length && <p className="el-empty">Nothing found. Try another word.</p>}
      </div>
      <p className="el-footnote"><Sparkles size={14} aria-hidden="true"/> Anything here can be edited right on your page.</p>
    </div>}
  </div>
}
