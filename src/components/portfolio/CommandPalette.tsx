import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, CornerDownLeft, Search } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'

export type CommandAction = {
  id: string
  title: string
  description?: string
  group: 'Create' | 'Navigate' | 'Share' | 'Appearance'
  run: () => void
}

export function CommandPalette({
  open,
  onOpenChange,
  actions,
}: {
  open: boolean
  onOpenChange: (next: boolean) => void
  actions: CommandAction[]
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    const frame = window.requestAnimationFrame(() => input.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase()
    return actions.filter(a =>
      (a.title + ' ' + (a.description ?? '') + ' ' + a.group)
        .toLowerCase().includes(text),
    )
  }, [query, actions])

  const execute = (action?: CommandAction) => {
    if (!action) return
    onOpenChange(false)
    action.run()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="command-dialog">
        <DialogTitle className="sr-only">Quick actions</DialogTitle>
        <DialogDescription className="sr-only">
          Find an action, navigate with arrow keys and press Enter to run it.
        </DialogDescription>
        <div className="command-search">
          <Search className="size-5" aria-hidden="true" />
          <input
            ref={input}
            aria-label="Search commands"
            placeholder="What would you like to do?"
            value={query}
            autoComplete="off"
            onChange={(event) => { setQuery(event.target.value); setActive(0) }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' && filtered.length) {
                event.preventDefault()
                setActive(i => (i + 1) % filtered.length)
              } else if (event.key === 'ArrowUp' && filtered.length) {
                event.preventDefault()
                setActive(i => (i - 1 + filtered.length) % filtered.length)
              } else if (event.key === 'Enter') {
                event.preventDefault()
                execute(filtered[Math.min(active, filtered.length - 1)])
              }
            }}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="command-results" role="listbox" aria-label="Available commands">
          {filtered.length ? filtered.map((action, index) => (
            <button
              key={action.id}
              type="button"
              role="option"
              aria-selected={index === active}
              className="command-result"
              onMouseEnter={() => setActive(index)}
              onClick={() => execute(action)}
            >
              <span>
                <strong>{action.title}</strong>
                {action.description && <small>{action.description}</small>}
              </span>
              <em>{action.group}</em>
              {index === active && <CornerDownLeft className="size-4" />}
            </button>
          )) : <p className="command-empty">No matching actions. Try “preview” or “CV”.</p>}
        </div>
        <div className="command-footer">
          <span><ArrowUp className="size-3" /><ArrowDown className="size-3" /> navigate</span>
          <span>↵ select</span>
          <span>Esc close</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
