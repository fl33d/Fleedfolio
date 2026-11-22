import { useId, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { suggestSkills, type CatalogSkill } from '@/lib/skill-catalog'

function SkillIcon({ skill }: { skill: CatalogSkill }) {
  return (
    <span className="pf-suggestion-icon" aria-hidden="true">
      <span>{skill.name[0]?.toUpperCase()}</span>
      {skill.icon && (
        <img
          src={'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/' + skill.icon}
          width={20} height={20} loading="lazy" alt=""
          onError={(event) => { event.currentTarget.style.display = 'none' }}
        />
      )}
    </span>
  )
}

/** Suggests skills in place. Custom values and comma-separated entry still work. */
export function SkillAutocomplete({ skills, onChange }: {
  skills: string[]
  onChange: (next: string[]) => void
}) {
  const [draft, setDraft] = useState('')
  const [active, setActive] = useState(0)
  const [focused, setFocused] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const options = useMemo(() => suggestSkills(draft, skills), [draft, skills])
  const open = focused && !dismissed && options.length > 0 && skills.length < 40
  const highlighted = Math.min(active, Math.max(0, options.length - 1))

  const add = (value: string) => {
    const known = new Set(skills.map(s => s.toLowerCase()))
    const additions = value.split(',').map(s => s.trim()).filter(s => {
      if (!s || known.has(s.toLowerCase())) return false
      known.add(s.toLowerCase())
      return true
    })
    if (additions.length) onChange([...skills, ...additions].slice(0, 40))
    setDraft('')
    setActive(0)
    setDismissed(false)
  }

  return (
    <section className="pf-skill-editor" aria-label="Skills and tools">
      <div className="pf-skill-heading-row">
        <label className="pf-skills-heading" htmlFor={id}>Skills & tools</label>
        <span className="pf-skill-count">{skills.length} / 40</span>
      </div>
      <div className="pf-skill-input-wrap">
        <div className="pf-skill-entries">
          {skills.map((skill, index) => (
            <span className="pf-chip" key={skill + '-' + index}>
              {skill}
              <button type="button" aria-label={'Remove ' + skill}
                onClick={() => onChange(skills.filter((_, i) => i !== index))}>
                <X className="size-3" />
              </button>
            </span>
          ))}
          <input
            ref={input} id={id} type="text" className="pf-chip-input"
            autoComplete="off" spellCheck={false} maxLength={80}
            disabled={skills.length >= 40} value={draft}
            role="combobox" aria-autocomplete="list" aria-expanded={open}
            aria-controls={id + '-options'}
            aria-activedescendant={open ? id + '-option-' + highlighted : undefined}
            placeholder={skills.length ? 'Add another skill…' : 'Try Vite, video editing, photography…'}
            onChange={(event) => { setDraft(event.target.value); setActive(0); setDismissed(false) }}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); if (draft.trim()) add(draft) }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' && open) {
                event.preventDefault()
                setActive(i => (i + 1) % options.length)
              } else if (event.key === 'ArrowUp' && open) {
                event.preventDefault()
                setActive(i => (i - 1 + options.length) % options.length)
              } else if (event.key === 'Escape' && open) {
                event.preventDefault()
                setDismissed(true)
              } else if (event.key === 'Tab' && open && !event.shiftKey) {
                event.preventDefault()
                add(options[highlighted]?.name ?? draft)
              } else if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault()
                add(open && event.key === 'Enter' ? options[highlighted]?.name ?? draft : draft)
              } else if (event.key === 'Backspace' && !draft && skills.length) {
                onChange(skills.slice(0, -1))
              }
            }}
          />
        </div>
        {open && (
          <div className="pf-skill-popover" id={id + '-options'} role="listbox" aria-label="Suggested skills">
            {options.map((skill, index) => (
              <button
                key={skill.name} type="button" role="option"
                id={id + '-option-' + index} aria-selected={index === highlighted}
                className="pf-suggestion"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => { add(skill.name); input.current?.focus() }}
              >
                <SkillIcon skill={skill} />
                <span className="pf-suggestion-text">{skill.name}</span>
                <small>{skill.category}</small>
                {index === highlighted && <kbd>Enter</kbd>}
              </button>
            ))}
            <p className="pf-suggestion-hint">↑↓ navigate · Enter/Tab add · Esc dismiss</p>
          </div>
        )}
      </div>
      <p className="pf-hint">Choose a suggestion or enter your own skill. Separate multiple skills with commas.</p>
    </section>
  )
}
