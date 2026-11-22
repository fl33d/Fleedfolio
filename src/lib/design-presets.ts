import { type Portfolio, type Theme } from './portfolio.ts'

export type DesignPreset = {
  id: string
  name: string
  description: string
  layout: Theme['layout']
  palette: Theme['palette']
  font: Theme['font']
  accent: string
  scale: Theme['scale']
  align: Theme['align']
}

/** Hand-selected visual recipes. They are editable CSS presets, not templates. */
export const DESIGN_PRESETS: readonly DesignPreset[] = [
  { id: 'folio', name: 'Folio', layout: 'folio', description: 'Modern, focused, unmistakably yours.', palette: 'ink', font: 'sans', accent: '#a9b79c', scale: 'regular', align: 'left' },
  { id: 'atelier', name: 'Atelier', layout: 'atelier', description: 'Soft paper. Bold thinking.', palette: 'paper', font: 'serif', accent: '#9b705d', scale: 'regular', align: 'left' },
  { id: 'index', name: 'Index', layout: 'index', description: 'Precise lines and useful detail.', palette: 'stone', font: 'sans', accent: '#d0d0cf', scale: 'quiet', align: 'left' },
  { id: 'studio', name: 'Studio', layout: 'studio', description: 'A visual stage for selected work.', palette: 'dusk', font: 'serif', accent: '#c9a3ab', scale: 'grand', align: 'left' },
  { id: 'terminal', name: 'Terminal', layout: 'terminal', description: 'A sharp, technical point of view.', palette: 'moss', font: 'mono', accent: '#a7c2a2', scale: 'quiet', align: 'left' },
]

export function applyDesignPreset(current: Portfolio, preset: DesignPreset): Portfolio {
  return {
    ...current,
    accent: preset.accent,
    theme: {
      ...current.theme,
      layout: preset.layout,
      palette: preset.palette,
      font: preset.font,
      scale: preset.scale,
      align: preset.align,
      backdrop: false,
    },
  }
}
