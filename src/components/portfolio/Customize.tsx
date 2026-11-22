import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Download, RotateCcw, SlidersHorizontal, Upload } from 'lucide-react'
import { toast } from 'sonner'

import {
  ACCENTS,
  DEFAULT_LABELS,
  DEFAULT_THEME,
  FONTS,
  PALETTES,
  type FontKey,
  type PaletteKey,
  type Portfolio,
  type SectionKey,
  type Theme,
} from '@/lib/portfolio'
import { cn } from '@/lib/utils'
import { createPortfolioBackup, parsePortfolioBackup } from '@/lib/portfolio-backup.ts'
import { normalizeCustomSlug } from '@/lib/portfolio-slug'
import { applyDesignPreset, DESIGN_PRESETS } from '@/lib/design-presets'

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'skills', label: 'Skills & tools' },
  { key: 'about', label: 'About' },
  { key: 'work', label: 'Work' },
  { key: 'experience', label: 'Experience' },
  { key: 'education', label: 'Education' },
  { key: 'contact', label: 'Contact' },
]

/** The dock's "Customise" button and the panel that unfolds above it. */
export function Customize({
  data,
  onChange,
  onImport,
  customSlug,
  onSlugChange,
  open: externalOpen,
  onOpenChange,
  onReset,
}: {
  data: Portfolio
  onChange: (fn: (d: Portfolio) => Portfolio) => void
  onImport: (draft: Portfolio) => boolean
  customSlug: string
  onSlugChange: (slug: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onReset?: () => void
}) {
  const [localOpen, setLocalOpen] = useState(false)
  const open = externalOpen ?? localOpen
  const setOpen = (next: boolean | ((current: boolean) => boolean)) => {
    const resolved = typeof next === 'function' ? next(open) : next
    if (onOpenChange) onOpenChange(resolved)
    else setLocalOpen(resolved)
  }
  const root = useRef<HTMLDivElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const exportDraft = () => {
    const blob = new Blob([createPortfolioBackup(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'fleedfolio-' + new Date().toISOString().slice(0, 10) + '.json'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.success('Portfolio backup downloaded.')
  }

  const importFile = async (file?: File) => {
    if (!file) return
    if (file.size > 2_000_000) {
      toast.error('This backup is too large (2 MB maximum).')
      return
    }

    try {
      const draft = parsePortfolioBackup(await file.text())
      if (onImport(draft)) {
        setOpen(false)
        toast.success('Backup imported. Publish to create a new share link.')
      }
    } catch {
      toast.error('Invalid Fleedfolio backup. No changes were made.')
    }
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const theme = data.theme
  const setTheme = <K extends keyof Theme>(key: K, value: Theme[K]) =>
    onChange((d) => ({ ...d, theme: { ...d.theme, [key]: value } }))
  const toggleSection = (key: SectionKey) =>
    onChange((d) => ({
      ...d,
      hidden: d.hidden.includes(key) ? d.hidden.filter((k) => k !== key) : [...d.hidden, key],
    }))
  const isCustomAccent = !ACCENTS.includes(data.accent)

  return (
    <div ref={root} className="cz">
      <button
        className={cn('cz-trigger', open && 'is-open')}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Customise your portfolio"
        aria-haspopup="dialog"
      >
        <SlidersHorizontal className="size-4" />
        <span className="cz-trigger-label">Customise</span>
        <ChevronDown className="size-3.5 cz-chevron" />
      </button>

      {open && (
        <div className="cz-panel" role="dialog" aria-label="Customise">
          <Group title="Design library">
            <p className="cz-group-intro">A complete look, ready to make yours. Every detail stays editable.</p>
            <div className="cz-designs">
              {DESIGN_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="cz-design"
                  onClick={() => onChange((portfolio) => applyDesignPreset(portfolio, preset))}
                  title={preset.description}
                >
                  <span className="cz-design-swatch" style={{ background: PALETTES[preset.palette].paper, color: PALETTES[preset.palette].ink, fontFamily: FONTS[preset.font].family }}>
                    <span>Ag</span>
                    <i style={{ background: preset.accent }} />
                  </span>
                  <span className="cz-design-info"><strong>{preset.name}</strong><small>{preset.description}</small></span>
                </button>
              ))}
            </div>
          </Group>
          <Group title="Tone">
            <div className="cz-palettes">
              {(Object.keys(PALETTES) as PaletteKey[]).map((key) => {
                const p = PALETTES[key]
                return (
                  <button
                    key={key}
                    className={cn('cz-palette', theme.palette === key && 'is-active')}
                    aria-pressed={theme.palette === key}
                    aria-label={p.label + ' palette'}
                    onClick={() => setTheme('palette', key)}
                    style={{ background: p.paper, color: p.ink }}
                  >
                    <span className="cz-palette-aa">Aa</span>
                    <span className="cz-palette-name">{p.label}</span>
                  </button>
                )
              })}
            </div>
          </Group>

          <Group title="Accent">
            <div className="cz-accents">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  aria-label={`Accent ${c}`}
                  onClick={() => onChange((d) => ({ ...d, accent: c }))}
                  className={cn('cz-accent', data.accent === c && 'is-active')}
                  aria-pressed={data.accent === c}
                  style={{ background: c }}
                />
              ))}
              <label
                className={cn('cz-accent cz-accent-custom', isCustomAccent && 'is-active')}
                style={isCustomAccent ? { background: data.accent } : undefined}
                title="Pick any colour"
              >
                <input
                  type="color"
                  value={data.accent}
                  onChange={(e) => onChange((d) => ({ ...d, accent: e.target.value }))}
                  aria-label="Custom accent colour"
                />
              </label>
            </div>
          </Group>

          <Group title="Typeface">
            <div className="cz-fonts">
              {(Object.keys(FONTS) as FontKey[]).map((key) => (
                <button
                  key={key}
                  className={cn('cz-font', theme.font === key && 'is-active')}
                  aria-pressed={theme.font === key}
                  onClick={() => setTheme('font', key)}
                >
                  <span style={{ fontFamily: FONTS[key].family }}>Aa</span>
                  <small>{FONTS[key].label}</small>
                </button>
              ))}
            </div>
          </Group>

          <div className="cz-row">
            <Group title="Scale">
              <Segmented
                value={theme.scale}
                options={[
                  ['quiet', 'Quiet'],
                  ['regular', 'Regular'],
                  ['grand', 'Grand'],
                ]}
                onChange={(v) => setTheme('scale', v)}
              />
            </Group>
            <Group title="Align">
              <Segmented
                value={theme.align}
                options={[
                  ['left', 'Left'],
                  ['center', 'Centre'],
                ]}
                onChange={(v) => setTheme('align', v)}
              />
            </Group>
          </div>

          <Group title="Sections">
            <div className="cz-toggles">
              {SECTIONS.map((s) => (
                <Toggle
                  key={s.key}
                  label={s.label}
                  checked={!data.hidden.includes(s.key)}
                  onChange={() => toggleSection(s.key)}
                />
              ))}
            </div>
          </Group>

          <Group title="Atmosphere">
            <div className="cz-toggles">
              <Toggle
                label="Ensō backdrop"
                checked={theme.backdrop}
                onChange={() => setTheme('backdrop', !theme.backdrop)}
              />
              <Toggle
                label="Gentle motion"
                checked={theme.motion}
                onChange={() => setTheme('motion', !theme.motion)}
              />
            </div>
          </Group>

          <Group title="Your link">
            <label className="cz-slug-label" htmlFor="fleedfolio-custom-link">
              Personal URL <span>optional</span>
            </label>
            <div className="cz-slug-row">
              <span>/@</span>
              <input
                id="fleedfolio-custom-link"
                type="text"
                autoComplete="off"
                spellCheck={false}
                maxLength={30}
                value={customSlug}
                placeholder="yourname"
                onChange={(event) => onSlugChange(event.target.value.toLowerCase())}
                aria-describedby="fleedfolio-slug-help"
                aria-invalid={Boolean(customSlug.trim() && !normalizeCustomSlug(customSlug))}
              />
            </div>
            <p id="fleedfolio-slug-help" className="cz-slug-help">
              {customSlug.trim() && !normalizeCustomSlug(customSlug)
                ? 'Use 3–30 letters, numbers or single hyphens; some names are reserved.'
                : 'Published as /@yourname on this site. Leave blank for a generated link. Renaming retires the old custom URL.'}
            </p>
          </Group>

          <Group title="Your work">
            <div className="cz-utilities">
              <button type="button" className="cz-utility" onClick={exportDraft}>
                <Download className="size-3.5" /> Export backup
              </button>
              <button type="button" className="cz-utility" onClick={() => fileInput.current?.click()}>
                <Upload className="size-3.5" /> Import backup
              </button>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept=".json,application/json"
              className="sr-only"
              aria-label="Choose a Fleedfolio backup file"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                event.currentTarget.value = ''
                void importFile(file)
              }}
            />
          </Group>

          {onReset && (
            <button className="cz-reset" type="button" onClick={onReset}>
              Start over with a blank page
            </button>
          )}

          <button
            className="cz-reset"
            onClick={() =>
              onChange((d) => ({
                ...d,
                theme: { ...DEFAULT_THEME },
                labels: { ...DEFAULT_LABELS },
                hidden: [],
                accent: ACCENTS[0],
              }))
            }
          >
            <RotateCcw className="size-3" /> Restore defaults
          </button>
        </div>
      )}
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="cz-group">
      <div className="cz-title">{title}</div>
      {children}
    </div>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: [T, string][]
  onChange: (value: T) => void
}) {
  return (
    <div className="cz-seg" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map(([key, label]) => (
        <button
          key={key}
          className={cn(value === key && 'is-active')}
          aria-pressed={value === key}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <button role="switch" aria-checked={checked} className="cz-toggle" onClick={onChange}>
      <span>{label}</span>
      <span className="cz-switch" />
    </button>
  )
}
