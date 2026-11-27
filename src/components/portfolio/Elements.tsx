import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'

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
type LibraryItem = { kind: ItemKind; name: string; description: string; category: Exclude<ItemCategory,'All'>; target?: string }

const LIBRARY: LibraryItem[] = [
  { kind: 'text', name: 'Freeform section', description: 'A blank canvas for your words.', category:'Write' },
  { kind: 'statement', name: 'Statement', description: 'One thought, beautifully oversized.', category:'Write' },
  { kind: 'feature', name: 'Feature story', description: 'Bring words and imagery together.', category:'Show' },
  { kind: 'project', name: 'Project', description: 'A piece of work worth showcasing.', category:'Show', target:'work' },
  { kind: 'skills', name: 'Skills', description: 'Languages, tools and interests.', category:'About', target:'top' },
  { kind: 'about', name: 'About', description: 'The person behind the work.', category:'About', target:'about' },
  { kind: 'experience', name: 'Experience', description: 'Roles, collaborations and milestones.', category:'About', target:'experience' },
  { kind: 'education', name: 'Education', description: 'Learning and qualifications.', category:'About', target:'education' },
  { kind: 'contact', name: 'Contact', description: 'A welcoming place to say hello.', category:'About', target:'contact' },
  { kind: 'link', name: 'Social link', description: 'Another place to find you.', category:'About', target:'contact' },
]

/** The Add shelf shares the same floating-sheet placement and entrance motion as Customise. */
export function Elements({ data, onChange }: {
  data: Portfolio
  onChange: (updater: (current: Portfolio) => Portfolio) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ItemCategory>('All')
  const [placement, setPlacement] = useState({ left: 12, bottom: 88, width: 360, maxHeight: 480 })
  const root = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const anchor = triggerRef.current?.getBoundingClientRect()
      const dock = root.current?.closest('.dock')?.getBoundingClientRect()
      if (!anchor) return
      const vw = window.innerWidth
      const vh = window.innerHeight
      const width = Math.min(360, Math.max(260, vw - 24))
      const preferredLeft = vw <= 640 ? (vw - width) / 2 : anchor.left + anchor.width / 2 - width / 2
      const left = Math.max(12, Math.min(preferredLeft, vw - width - 12))
      const bottom = Math.max(12, vh - (dock?.top ?? anchor.top) + 12)
      const maxHeight = Math.max(160, Math.min(480, vh - bottom - 16))
      setPlacement(old => old.left === left && old.bottom === bottom &&
        old.width === width && old.maxHeight === maxHeight
        ? old : { left, bottom, width, maxHeight })
    }
    place()
    window.addEventListener('resize', place)
    window.visualViewport?.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.visualViewport?.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node) && !panelRef.current?.contains(event.target as Node)) setOpen(false)
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
  const overlayHost = typeof document === 'undefined' ? null : document.getElementById('fleed-overlay-root')

  return <div ref={root} className="el-root">
    <button ref={triggerRef} type="button" className="cz-trigger el-trigger"
      aria-label="Add an element" aria-haspopup="dialog" aria-expanded={open}
      title="Add a section" onClick={() => {
        const next = !open
        setOpen(next)
        if (next && window.matchMedia('(min-width: 641px)').matches)
          window.setTimeout(() => searchRef.current?.focus(), 50)
      }}>
      <span className="el-trigger-text">Add</span>
    </button>

    {open && overlayHost && createPortal(
      <div ref={panelRef} role="dialog" aria-label="Add to your portfolio"
        className="cz-panel fleed-customize-panel"
        style={{ left: placement.left, bottom: placement.bottom, width: placement.width, maxHeight: placement.maxHeight, ['--accent-c' as string]: data.accent }}>
        <div className="el-compact-heading">
          <span>Elements</span>
          <button type="button" className="cz-sheet-close el-close" aria-label="Close element library"
            onClick={() => { setOpen(false); triggerRef.current?.focus() }}><X size={16} aria-hidden="true"/></button>
        </div>
        <label className="el-search">
          <Search className="size-4" aria-hidden="true"/>
          <span className="sr-only">Find an element</span>
          <input ref={searchRef} type="search" placeholder="Search elements" value={query}
            onChange={event => setQuery(event.target.value)}/>
        </label>
        <div className="cz-depth-tabs" role="group" aria-label="Filter elements">
          {(['All','Write','Show','About'] as const).map(tab=>
            <button key={tab} type="button" aria-selected={category===tab}
              onClick={()=>setCategory(tab)}>{tab}</button>)}
        </div>
        <div className="el-options">
          {results.map(item => {
            const disabled =
              (['text','statement','feature'].includes(item.kind) && data.extras.length >= 12) ||
              (item.kind === 'project' && data.projects.length >= 24) ||
              (item.kind === 'experience' && data.experience.length >= 24) ||
              (item.kind === 'education' && data.education.length >= 24) ||
              (item.kind === 'link' && data.socials.length >= 24)
            return <div key={item.kind} className="el-option-row">
              <span className="el-option-copy"><strong>{item.name}</strong></span>
              <button type="button" className="el-option-action" onClick={() => add(item.kind)} disabled={disabled}>Add</button>
            </div>
          })}
          {!results.length && <p className="el-empty">Nothing found. Try another word.</p>}
        </div>
        
      </div>,
      overlayHost,
    )}
  </div>
}
