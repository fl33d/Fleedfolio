import { type Portfolio, type Theme } from './portfolio.ts'

export type DesignPreset = {
  id: string
  name: string
  description: string
  palette: Theme['palette']
  font: Theme['font']
  accent: string
  scale: Theme['scale']
  align: Theme['align']
}

/** Hand-selected visual recipes. They are editable CSS presets, not templates. */
export const DESIGN_PRESETS: readonly DesignPreset[] = [
  { id: 'folio', name: 'Folio', description: 'An understated starting point.', palette: 'ink', font: 'sans', accent: '#a9b79c', scale: 'regular', align: 'left' },
  { id: 'atelier', name: 'Atelier', description: 'Warm paper and editorial type.', palette: 'paper', font: 'serif', accent: '#9b705d', scale: 'regular', align: 'left' },
  { id: 'index', name: 'Index', description: 'Monochrome and architectural.', palette: 'stone', font: 'sans', accent: '#d0d0cf', scale: 'quiet', align: 'left' },
  { id: 'studio', name: 'Studio', description: 'A gallery-like expression.', palette: 'dusk', font: 'serif', accent: '#c9a3ab', scale: 'grand', align: 'left' },
  { id: 'terminal', name: 'Terminal', description: 'Code-inspired but welcoming.', palette: 'moss', font: 'mono', accent: '#a7c2a2', scale: 'quiet', align: 'left' },
]

export function applyDesignPreset(current: Portfolio, preset: DesignPreset): Portfolio {
  return {
    ...current,
    accent: preset.accent,
    theme: {
      ...current.theme,
      palette: preset.palette,
      font: preset.font,
      scale: preset.scale,
      align: preset.align,
      backdrop: false,
    },
  }
}
