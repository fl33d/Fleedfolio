import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ChevronDown, CircleHelp, Download, FileText, RotateCcw, SlidersHorizontal, Upload } from 'lucide-react'
import { toast } from 'sonner'

import {
  ACCENTS,
  DEFAULT_LABELS,
  DEFAULT_THEME,
  FONTS,
  PALETTES,
  LOOKS,
  TEXTURES,
  type LookKey,
  type TextureKey,
  type FontKey,
  type PaletteKey,
  type Portfolio,
  type SectionKey,
  type Theme,
} from '@/lib/portfolio'
import { cn } from '@/lib/utils'
import { createPortfolioBackup, parsePortfolioBackup } from '@/lib/portfolio-backup.ts'
import { normalizeCustomSlug } from '@/lib/portfolio-slug'

const EXPRESSIONS: Record<LookKey, {
  palette: PaletteKey; font: FontKey; accent: string; texture: TextureKey
}> = {
  classic: { palette: 'ink', font: 'serif', accent: '#a9b79c', texture: 'none' },
  editorial: { palette: 'paper', font: 'serif', accent: '#c56f55', texture: 'bloom' },
  glass: { palette: 'stone', font: 'sans', accent: '#92d9df', texture: 'bloom' },
  brutal: { palette: 'paper', font: 'sans', accent: '#e85f47', texture: 'grid' },
  aero: { palette: 'paper', font: 'sans', accent: '#69b8d3', texture: 'bloom' },
  print: { palette: 'paper', font: 'serif', accent: '#ae665e', texture: 'halftone' },
  neo: { palette: 'ink', font: 'mono', accent: '#c7fa50', texture: 'grid' },
  playful: { palette: 'paper', font: 'sans', accent: '#ed7d59', texture: 'halftone' },
}
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
  onPreviewCv,
  onHelp,
  onResetDraft,
}: {
  data: Portfolio
  onChange: (fn: (d: Portfolio) => Portfolio) => void
  onImport: (draft: Portfolio) => boolean
  customSlug: string
  onSlugChange: (slug: string) => void
  onPreviewCv?: () => void
  onHelp?: () => void
  onResetDraft?: () => void
}) {
  const [open, setOpen] = useState(false)
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
  const applyLook = (look: LookKey) => {
    const preset = EXPRESSIONS[look]
    onChange(current => ({
      ...current, accent: preset.accent,
      theme: {
        ...current.theme, look,
        palette: preset.palette,
        font: preset.font,
        texture: preset.texture,
        background: '', foreground: '',
      },
    }))
  }

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
        <span className="cz-trigger-dot" />
        <ChevronDown className="size-3.5 cz-chevron" />
      </button>

      {open && (
        <div className="cz-panel" role="dialog" aria-label="Customise">
          <div className="cz-panel-intro"><span>Make it yours.</span><p>Start with a feeling. Change anything later.</p></div>
          <Group title="Expression">
            <div className="cz-looks">
              {(Object.keys(LOOKS) as LookKey[]).map((key) => {
                const option = LOOKS[key]
                const preset = EXPRESSIONS[key]
                return <button key={key} type="button"
                  className={cn('cz-look', theme.look === key && 'is-active')}
                  aria-label={option.label + ' expression'}
                  aria-pressed={theme.look === key}
                  onClick={() => applyLook(key)}>
                  <span className="cz-look-preview" data-look={key}
                    style={{
                      '--look-paper':PALETTES[preset.palette].paper,
                      '--look-ink':PALETTES[preset.palette].ink,
                      '--look-accent':preset.accent,
                    } as CSSProperties}
                    aria-hidden="true">
                    <i className="cz-look-orb"/><i className="cz-look-text">Aa</i><i className="cz-look-rule"/>
                  </span>
                  <span className="cz-look-title">{option.label}</span>
                </button>
              })}
            </div>
            <p className="cz-look-hint">Looks are starting points, not locked templates. Your words and projects stay exactly where they are.</p>
          </Group>
          <Group title="Colour story">
            <div className="cz-palettes">
              {(Object.keys(PALETTES) as PaletteKey[]).map((key) => {
                const p = PALETTES[key]
                return (
                  <button
                    key={key}
                    className={cn('cz-palette', theme.palette === key && 'is-active')}
                    aria-pressed={theme.palette === key}
                    aria-label={p.label + ' palette'}
                    onClick={() => onChange(current => ({
                      ...current, theme:{ ...current.theme, palette:key, background:'',foreground:'' },
                    }))}
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

          <Group title="Surface">
            <div className="cz-surface-options">
              {(Object.keys(TEXTURES) as TextureKey[]).map(key=>
                <button key={key} type="button" aria-pressed={theme.texture===key}
                  onClick={()=>setTheme('texture',key)}>{TEXTURES[key]}</button>)}
            </div>
          </Group>
          <Group title="Show your work">
            <div className="cz-layout-picks" role="group" aria-label="Project layout">
              {([
                ['list','Index'],
                ['grid','Gallery'],
                ['spotlight','Showcase'],
              ] as const).map(([key,label])=>
                <button key={key} type="button"
                  aria-pressed={theme.workLayout===key}
                  onClick={()=>setTheme('workLayout',key)}>
                  <span className={'cz-layout-preview cz-layout-'+key} aria-hidden="true">
                    <i/><i/><i/>
                  </span>
                  <span>{label}</span>
                </button>)}
            </div>
          </Group>

          <details className="cz-advanced">
            <summary>More control <ChevronDown className="size-4" aria-hidden="true"/></summary>
            <div className="cz-advanced-content">
            <Group title="Background & text">
              <div className="cz-colour-pair">
                <label>Background<input type="color" aria-label="Custom background colour"
                  value={theme.background || PALETTES[theme.palette].paper}
                  onChange={e=>setTheme('background',e.target.value)}/></label>
                <label>Text<input type="color" aria-label="Custom text colour"
                  value={theme.foreground || PALETTES[theme.palette].ink}
                  onChange={e=>setTheme('foreground',e.target.value)}/></label>
              </div>
              <button type="button" className="cz-muted-action" onClick={()=>
                onChange(current=>({...current,theme:{...current.theme,background:'',foreground:''}}))}>
                Reset custom colours
              </button>
            </Group>
            <Group title="Spacing">
              <Segmented
                value={theme.spacing}
                options={ [['compact','Close'],['balanced','Balanced'],['airy','Open']] }
                onChange={v=>setTheme('spacing',v)}
              />
            </Group>
            <Group title="Corners">
              <Segmented
                value={theme.corners}
                options={ [['sharp','Sharp'],['soft','Soft'],['round','Round']] }
                onChange={v=>setTheme('corners',v)}
              />
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
            {onPreviewCv && <button type="button" className="cz-utility" onClick={() => { setOpen(false); onPreviewCv() }}>
              <FileText className="size-3.5" /> Preview CV
            </button>}
            {onHelp && <button type="button" className="cz-utility" onClick={() => { setOpen(false); onHelp() }}>
              <CircleHelp className="size-3.5" /> How it works
            </button>}
            {onResetDraft && <button type="button" className="cz-utility" onClick={() => { setOpen(false); onResetDraft() }}>
              <RotateCcw className="size-3.5" /> Start over
            </button>}
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
          </details>
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
