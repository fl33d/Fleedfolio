import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CircleHelp, Eye, FileText, Layers3, PenLine, Search, Send } from 'lucide-react'
import { toast } from 'sonner'

import { Customize } from '@/components/portfolio/Customize'
import { ShareDialog } from '@/components/portfolio/ShareDialog'
import { Walkthrough } from '@/components/portfolio/Walkthrough'
import { Portfolio } from '@/components/portfolio/Portfolio'
import { CvView } from '@/components/portfolio/CvView'
import { CommandPalette, type CommandAction } from '@/components/portfolio/CommandPalette'
import { ElementsShelf, type ElementKind, ELEMENT_KINDS } from '@/components/portfolio/ElementsShelf'
import { Backdrop, ScrollProgress } from '@/components/portfolio/effects'
import {
  blankPortfolio,
  normalizePortfolio,
  themeProps,
  type Portfolio as PortfolioData,
} from '@/lib/portfolio'
import { publishPortfolio } from '@/server/portfolio.functions'
import { cn } from '@/lib/utils'
import { normalizeCustomSlug, portfolioPublicPath } from '@/lib/portfolio-slug'
import { addPortfolioElement } from '@/lib/portfolio-elements'

export const Route = createFileRoute('/')({
  component: Editor,
})

// Keys kept from the original "blank." name so existing drafts and edit tokens survive the rename
const DRAFT_KEY = 'blank:draft'
const PUBLISHED_KEY = 'blank:published'
const CUSTOM_SLUG_KEY = 'fleedfolio:custom-slug'
const TOUR_SEEN_KEY = 'fleedfolio:tour:v1'

type Published = { id: string; token: string; slug?: string }

function Editor() {
  const [data, setData] = useState<PortfolioData>(blankPortfolio)
  const [editing, setEditing] = useState(true)
  const [cvOpen, setCvOpen] = useState(false)
  const [published, setPublished] = useState<Published | null>(null)
  const [customSlug, setCustomSlug] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [commandsOpen, setCommandsOpen] = useState(false)
  const [customiseOpen, setCustomiseOpen] = useState(false)
  const [elementsOpen, setElementsOpen] = useState(false)
  const [dropTarget, setDropTarget] = useState(false)
  const loaded = useRef(false)
  const storageWarningShown = useRef(false)

  useEffect(() => {
    const onKeys = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandsOpen(open => !open)
      }
    }
    window.addEventListener('keydown', onKeys)
    return () => window.removeEventListener('keydown', onKeys)
  }, [])

  useEffect(() => {
    try {
      if (localStorage.getItem(TOUR_SEEN_KEY) || localStorage.getItem(PUBLISHED_KEY)) return
    } catch {
      // Walkthrough can still be opened manually when browser storage is disabled.
      return
    }
    const timer = window.setTimeout(() => setTourOpen(true), 650)
    return () => window.clearTimeout(timer)
  }, [])

  const closeTour = () => {
    setTourOpen(false)
    try {
      localStorage.setItem(TOUR_SEEN_KEY, '1')
    } catch {
      // Still allow the guide to close if local storage is blocked.
    }
  }

  // Restore the in-progress draft from this browser
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) setData(normalizePortfolio(JSON.parse(draft)))
      const pub = localStorage.getItem(PUBLISHED_KEY)
      if (pub) {
        const restored: Published = JSON.parse(pub)
        setPublished(restored)
        setCustomSlug(restored.slug ?? '')
      }
      const pendingSlug = localStorage.getItem(CUSTOM_SLUG_KEY)
      if (pendingSlug !== null) setCustomSlug(pendingSlug)
    } catch {
      // ignore malformed local data
    }
    loaded.current = true
  }, [])

  useEffect(() => {
    if (!loaded.current) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
      storageWarningShown.current = false
    } catch {
      if (!storageWarningShown.current) {
        toast.error('Draft could not be saved locally. Export a backup from Customise.')
        storageWarningShown.current = true
      }
    }
  }, [data])

  useEffect(() => {
    if (!loaded.current) return
    try {
      localStorage.setItem(CUSTOM_SLUG_KEY, customSlug)
    } catch {
      // Draft contents can still be exported if browser storage is unavailable.
    }
  }, [customSlug])

  const switchMode = (next: boolean) => {
    setCvOpen(false)
    setEditing(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const publish = async (nextSlug = customSlug): Promise<boolean> => {
    if (publishing) return false
    if (!data.name.trim()) {
      toast.error('Add your name before publishing.')
      switchMode(true)
      return false
    }
    if (nextSlug.trim() && !normalizeCustomSlug(nextSlug)) {
      toast.error('Choose 3–30 letters, numbers or single hyphens for your custom link.')
      return false
    }
    setPublishing(true)
    try {
      const result = await publishPortfolio({
        data: { id: published?.id, token: published?.token, slug: nextSlug.trim().toLowerCase(), portfolio: data },
      })
      setPublished(result)
      setCustomSlug(result.slug ?? '')
      try {
        localStorage.setItem(PUBLISHED_KEY, JSON.stringify(result))
      } catch {
        toast.error('Published, but the editing key could not be saved. Keep this browser open.')
      }
      setShareOpen(true)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      toast.error(message.includes('taken') || message.includes('claimed') ? 'That custom link may already be taken. Choose another.' : 'Publishing failed. Try again in a moment.')
      return false
    } finally {
      setPublishing(false)
    }
  }

  const importDraft = (draft: PortfolioData): boolean => {
    if (!window.confirm('Replace this draft with the imported backup? Unsaved changes will be lost.')) {
      return false
    }
    setData(draft)
    setPublished(null)
    setCustomSlug('')
    try {
      localStorage.removeItem(PUBLISHED_KEY)
      localStorage.removeItem(CUSTOM_SLUG_KEY)
    } catch {
      // Import still works if browser storage is unavailable.
    }
    setCvOpen(false)
    setEditing(true)
    return true
  }

  const reset = () => {
    if (!confirm('Clear every line and begin again from a blank page?')) return
    setData(blankPortfolio())
    setPublished(null)
    setCustomSlug('')
    try {
      localStorage.removeItem(PUBLISHED_KEY)
      localStorage.removeItem(CUSTOM_SLUG_KEY)
    } catch {
      // Continue resetting the draft if storage is unavailable.
    }
    switchMode(true)
  }

  const publicUrl = published && typeof window !== 'undefined'
    ? window.location.origin + portfolioPublicPath(published.id, published.slug)
    : undefined

  const addElement = (kind: ElementKind) => {
    setCvOpen(false)
    setEditing(true)
    setElementsOpen(false)
    setDropTarget(false)
    setData(current => addPortfolioElement(current, kind))
    const target = kind === 'text' ? '[id^="extra-"]' : kind === 'project' ? '#work' : kind === 'experience' ? '#experience' : kind === 'education' ? '#education' : kind === 'skills' ? '.pf-skill-editor' : '#contact'
    window.setTimeout(() => {
      const elements = document.querySelectorAll<HTMLElement>(target)
      elements[elements.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 75)
  }

  const commands: CommandAction[] = [
    { id: 'edit', title: 'Edit portfolio', description: 'Return to writing directly on the page.', group: 'Create', run: () => switchMode(true) },
    { id: 'preview', title: 'Preview portfolio', description: 'See what visitors will see.', group: 'Create', run: () => switchMode(false) },
    { id: 'customise', title: 'Open design library', description: 'Change your theme and sections.', group: 'Appearance', run: () => { setCvOpen(false); setCustomiseOpen(true) } },
    { id: 'cv', title: 'Open CV', description: 'Print or download a clean résumé.', group: 'Create', run: () => { setCvOpen(true); window.scrollTo({ top: 0 }) } },
    { id: 'tour', title: 'Show beginner guide', description: 'Walk through the basics again.', group: 'Create', run: () => setTourOpen(true) },
    { id: 'elements', title: 'Open elements library', description: 'Add text, projects and other sections.', group: 'Create', run: () => { setCvOpen(false); setElementsOpen(true) } },
    { id: 'skills', title: 'Go to skills', group: 'Navigate', run: () => {
      setCvOpen(false)
      window.setTimeout(() => document.querySelector<HTMLElement>('.pf-skill-editor, .pf-skills')?.scrollIntoView({ behavior: 'smooth' }), 35)
    } },
    { id: 'work', title: 'Go to selected work', group: 'Navigate', run: () => {
      setCvOpen(false)
      window.setTimeout(() => document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' }), 35)
    } },
    { id: 'about', title: 'Go to about', group: 'Navigate', run: () => {
      setCvOpen(false)
      window.setTimeout(() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }), 35)
    } },
    { id: 'light', title: 'Switch to paper', description: 'A quiet light palette.', group: 'Appearance', run: () =>
      setData(current => ({ ...current, theme: { ...current.theme, palette: 'paper' } })) },
    { id: 'dark', title: 'Switch to ink', description: 'A precise dark palette.', group: 'Appearance', run: () =>
      setData(current => ({ ...current, theme: { ...current.theme, palette: 'ink' } })) },
    { id: 'publish', title: published ? 'Update portfolio' : 'Publish portfolio', group: 'Share', run: () => { void publish() } },
    ...(publicUrl ? [{
      id: 'copy', title: 'Copy public link', description: publicUrl, group: 'Share' as const,
      run: () => { void navigator.clipboard.writeText(publicUrl).then(
        () => toast.success('Link copied.'),
        () => toast.error('Unable to copy. Open Share to copy the address.'),
      ) },
    }] : []),
  ]

  return (
    <div className={cn('app', cvOpen ? 'mode-cv' : editing ? 'mode-edit' : 'mode-view')} {...themeProps(data)}>
      {!cvOpen && !editing && data.theme.backdrop && <Backdrop />}
      <ScrollProgress />

      {cvOpen ? (
        <CvView data={data} publicUrl={publicUrl} onBack={() => setCvOpen(false)} />
      ) : (
        <div
          key={editing ? 'edit' : 'view'}
          className={cn('mode-swap', dropTarget && 'is-drop-target')}
          onDragOver={(event) => {
            if (!editing || !event.dataTransfer.types.includes('application/x-fleed-element')) return
            event.preventDefault()
            event.dataTransfer.dropEffect = 'copy'
            setDropTarget(true)
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropTarget(false)
          }}
          onDrop={(event) => {
            setDropTarget(false)
            const kind = event.dataTransfer.getData('application/x-fleed-element')
            if (!editing || !ELEMENT_KINDS.includes(kind as ElementKind)) return
            event.preventDefault()
            addElement(kind as ElementKind)
          }}
        >
          <Portfolio
            data={data}
            editing={editing}
            onChange={setData}
            onOpenCommands={() => setCommandsOpen(true)}
          />
        </div>
      )}

      {/* Floating dock */}
      <div className="dock chrome">
        <div className="dock-toggle" role="group" aria-label="Editor mode">
          <span className={cn('dock-toggle-pill', !editing && 'is-right')} />
          <button type="button" aria-pressed={editing && !cvOpen} onClick={() => switchMode(true)}>
            <PenLine className="size-4" /> Edit
          </button>
          <button type="button" aria-pressed={!editing && !cvOpen} onClick={() => switchMode(false)}>
            <Eye className="size-4" /> Preview
          </button>
        </div>

        <span className="dock-sep" />
        <button
          type="button"
          className={cn('dock-icon', elementsOpen && 'is-active')}
          aria-label="Open elements library"
          aria-expanded={elementsOpen}
          title="Elements"
          onClick={() => { setCvOpen(false); setEditing(true); setElementsOpen(value => !value) }}
        >
          <Layers3 className="size-4" />
        </button>

        {!cvOpen && (
          <Customize data={data} onChange={setData} onImport={importDraft} customSlug={customSlug} onSlugChange={setCustomSlug} open={customiseOpen} onOpenChange={setCustomiseOpen} onReset={reset} />
        )}

        <button
          type="button"
          className={cn('dock-icon', 'dock-cv', cvOpen && 'is-active')}
          aria-label={cvOpen ? 'Return from CV view' : 'Preview CV'}
          aria-pressed={cvOpen}
          title="CV / résumé"
          onClick={() => setCvOpen((value) => !value)}
        >
          <FileText className="size-4" />
          <span>CV</span>
        </button>

        <button className="dock-icon" onClick={() => setCommandsOpen(true)} aria-label="Open command palette" title="Quick actions · Ctrl+K">
          <Search className="size-4" />
        </button>

        <button className="dock-icon" onClick={() => setTourOpen(true)} aria-label="How to use Fleedfolio" title="How it works">
          <CircleHelp className="size-4" />
        </button>

        <button className="dock-publish" onClick={() => { void publish() }} disabled={publishing}>
          <Send className={cn('size-4', publishing && 'animate-pulse')} />
          {publishing ? 'Publishing…' : published ? 'Update' : 'Publish'}
        </button>
      </div>

      <ElementsShelf open={elementsOpen} onClose={() => setElementsOpen(false)} onAdd={addElement} />

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        published={published}
        saving={publishing}
        onSaveAddress={publish}
      />
      <Walkthrough open={tourOpen} onClose={closeTour} />
      <CommandPalette open={commandsOpen} onOpenChange={setCommandsOpen} actions={commands} />
    </div>
  )
}
