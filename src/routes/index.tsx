import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CircleHelp, Eye, PenLine, RotateCcw, Send } from 'lucide-react'
import { toast } from 'sonner'

import { Customize } from '@/components/portfolio/Customize'
import { ShareDialog } from '@/components/portfolio/ShareDialog'
import { Walkthrough } from '@/components/portfolio/Walkthrough'
import { Portfolio } from '@/components/portfolio/Portfolio'
import { Backdrop, ScrollProgress } from '@/components/portfolio/effects'
import {
  blankPortfolio,
  normalizePortfolio,
  themeProps,
  type Portfolio as PortfolioData,
} from '@/lib/portfolio'
import { publishPortfolio } from '@/server/portfolio.functions'
import { cn } from '@/lib/utils'
import { normalizeCustomSlug } from '@/lib/portfolio-slug'

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
  const [published, setPublished] = useState<Published | null>(null)
  const [customSlug, setCustomSlug] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const loaded = useRef(false)
  const storageWarningShown = useRef(false)

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

  return (
    <div className={cn('app', editing ? 'mode-edit' : 'mode-view')} {...themeProps(data)}>
      {!editing && data.theme.backdrop && <Backdrop />}
      <ScrollProgress />

      <div key={editing ? 'edit' : 'view'} className="mode-swap">
        <Portfolio data={data} editing={editing} onChange={setData} />
      </div>

      {/* Floating dock */}
      <div className="dock chrome">
        <div className="dock-toggle" role="group" aria-label="Editor mode">
          <span className={cn('dock-toggle-pill', !editing && 'is-right')} />
          <button type="button" aria-pressed={editing} onClick={() => switchMode(true)}>
            <PenLine className="size-4" /> Edit
          </button>
          <button type="button" aria-pressed={!editing} onClick={() => switchMode(false)}>
            <Eye className="size-4" /> Preview
          </button>
        </div>

        <span className="dock-sep" />

        <Customize data={data} onChange={setData} onImport={importDraft} customSlug={customSlug} onSlugChange={setCustomSlug} />

        <button className="dock-icon" onClick={() => setTourOpen(true)} aria-label="How to use Fleedfolio" title="How it works">
          <CircleHelp className="size-4" />
        </button>

        <button className="dock-icon" onClick={reset} aria-label="Reset draft" title="Reset draft">
          <RotateCcw className="size-4" />
        </button>

        <button className="dock-publish" onClick={() => { void publish() }} disabled={publishing}>
          <Send className={cn('size-4', publishing && 'animate-pulse')} />
          {publishing ? 'Publishing…' : published ? 'Update' : 'Publish'}
        </button>
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        published={published}
        saving={publishing}
        onSaveAddress={publish}
      />
      <Walkthrough open={tourOpen} onClose={closeTour} />
    </div>
  )
}
