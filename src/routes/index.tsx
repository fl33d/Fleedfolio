import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CircleHelp, Eye, PenLine, RotateCcw, Send } from 'lucide-react'
import { toast } from 'sonner'

import { Customize } from '@/components/portfolio/Customize'
import { ShareDialog } from '@/components/portfolio/ShareDialog'
import { Walkthrough } from '@/components/portfolio/Walkthrough'
import { Portfolio } from '@/components/portfolio/Portfolio'
import { Backdrop, Enso, ScrollProgress, Wordmark } from '@/components/portfolio/effects'
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
const HINT_KEY = 'blank:hint-dismissed'
const CUSTOM_SLUG_KEY = 'fleedfolio:custom-slug'
const TOUR_SEEN_KEY = 'fleedfolio:tour:v1'

type Published = { id: string; token: string; slug?: string }

function completeness(p: PortfolioData) {
  const checks = [
    p.name,
    p.role,
    p.tagline,
    p.about,
    p.skills.length,
    p.projects.some((x) => x.title),
    p.experience.some((x) => x.role),
    p.email || p.socials.some((s) => s.url),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

// Hint shown at the top of the editor. Ticking the box, typing anywhere or scrolling
// closes it, and once closed it stays closed in this browser.
function EditBanner() {
  const [state, setState] = useState<'pending' | 'shown' | 'leaving' | 'gone'>('pending')
  const [ticked, setTicked] = useState(false)

  useEffect(() => {
    setState(localStorage.getItem(HINT_KEY) ? 'gone' : 'shown')
  }, [])

  useEffect(() => {
    if (state !== 'shown') return
    const close = () => setState('leaving')
    const onScroll = () => window.scrollY > 24 && close()
    const onInput = (e: Event) => {
      if (!(e.target as Element | null)?.closest?.('.edit-banner')) close()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('input', onInput)
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('input', onInput)
    }
  }, [state])

  useEffect(() => {
    if (state === 'leaving' || state === 'gone') localStorage.setItem(HINT_KEY, '1')
  }, [state])

  if (state === 'pending' || state === 'gone') return null

  return (
    <div
      className={cn('edit-banner chrome', state === 'leaving' && 'is-leaving')}
      onAnimationEnd={(e) => {
        if (e.animationName === 'drop-out') setState('gone')
      }}
    >
      <span className="edit-banner-dot" />
      Click any line and begin writing. Everything saves as you go.
      <label className="edit-banner-check">
        <input
          type="checkbox"
          checked={ticked}
          onChange={() => {
            setTicked(true)
            setTimeout(() => setState('leaving'), 350)
          }}
        />
        <span className="edit-banner-box">
          <Check className="size-2.5" strokeWidth={3} />
        </span>
        Got it
      </label>
    </div>
  )
}

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
    // The opening brand animation should finish before the first-use guide appears.
    const timer = window.setTimeout(() => setTourOpen(true), 3200)
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

  const percent = useMemo(() => completeness(data), [data])
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
      <Intro />
      {data.theme.backdrop && <Backdrop />}
      <ScrollProgress />

      {editing && <EditBanner />}

      <div key={editing ? 'edit' : 'view'} className="mode-swap">
        <Portfolio data={data} editing={editing} onChange={setData} />
      </div>

      {/* Floating dock */}
      <div className="dock chrome">
        <div className="dock-toggle" role="tablist" aria-label="Mode">
          <span className={cn('dock-toggle-pill', !editing && 'is-right')} />
          <button role="tab" aria-selected={editing} onClick={() => switchMode(true)}>
            <PenLine className="size-4" /> Edit
          </button>
          <button role="tab" aria-selected={!editing} onClick={() => switchMode(false)}>
            <Eye className="size-4" /> Preview
          </button>
        </div>

        <span className="dock-sep" />

        <Customize data={data} onChange={setData} onImport={importDraft} customSlug={customSlug} onSlugChange={setCustomSlug} />

        <div className="dock-progress" title={`${percent}% filled in`}>
          <svg viewBox="0 0 36 36" className="size-9 -rotate-90">
            <circle cx="18" cy="18" r="15" className="dock-ring-bg" />
            <circle
              cx="18"
              cy="18"
              r="15"
              className="dock-ring"
              style={{ strokeDashoffset: 94.25 - (94.25 * percent) / 100 }}
            />
          </svg>
          <span>{percent}</span>
        </div>

        <button className="dock-icon" onClick={() => setTourOpen(true)} aria-label="How to use Fleedfolio" title="How it works">
          <CircleHelp className="size-4" />
        </button>

        <button className="dock-icon" onClick={reset} aria-label="Start over">
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

/** An ensō draws itself around the wordmark, then the whole screen fades away. */
function Intro() {
  const [gone, setGone] = useState(false)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setGone(true)
      return
    }

    try {
      if (sessionStorage.getItem('fleed:intro-seen')) {
        setGone(true)
        return
      }
      sessionStorage.setItem('fleed:intro-seen', '1')
    } catch {
      // Session storage may be disabled; the intro can still finish normally.
    }

    const t = setTimeout(() => setGone(true), 2700)
    return () => clearTimeout(t)
  }, [])
  if (gone) return null
  return (
    <div className="intro" aria-hidden>
      <div className="intro-mark">
        <Enso />
        <Wordmark className="intro-word" />
      </div>
      <div className="intro-sub">begin with a blank page</div>
    </div>
  )
}
