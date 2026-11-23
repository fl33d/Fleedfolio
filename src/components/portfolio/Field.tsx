import { useLayoutEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

/**
 * A text box that looks like the finished typography. Grows with its content,
 * uses a quiet placeholder and an accent underline only while focused.
 */
export function Field({
  value,
  onChange,
  placeholder,
  multiline,
  className,
  label,
  maxLength = 400,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  multiline?: boolean
  className?: string
  label?: string
  maxLength?: number
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const fitHeight = () => {
    const el = ref.current
    if (!el) return
    // Reset before measuring, otherwise switching to a smaller typeface leaves
    // oversized whitespace. This runs for visual expression changes as well.
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }

  // The exact same field participates in every visual expression.
  // Updating a theme can change font metrics without changing the text.
  useLayoutEffect(fitHeight)

  useLayoutEffect(() => {
    const el = ref.current
    const wrapper = el?.parentElement
    if (!el || !wrapper) return

    let active = true
    let observedWidth = -1
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? -1
      if (width >= 0 && Math.abs(width - observedWidth) > 0.5) {
        observedWidth = width
        fitHeight()
      }
    })
    observer?.observe(wrapper)
    window.addEventListener('resize', fitHeight, { passive: true })
    // Web fonts may finish loading after initial hydration.
    if (document.fonts) {
      void document.fonts.ready.then(() => {
        if (active) fitHeight()
      })
    }
    return () => {
      active = false
      observer?.disconnect()
      window.removeEventListener('resize', fitHeight)
    }
  }, [])

  return (
    <span className={cn('field', !value && 'is-empty')}>
      <textarea
        ref={ref}
        rows={1}
        value={value}
        maxLength={maxLength}
        aria-label={label ?? placeholder}
        placeholder={placeholder}
        spellCheck={multiline}
        onChange={(e) =>
          onChange(multiline ? e.target.value : e.target.value.replace(/\n/g, ''))
        }
        onKeyDown={(e) => {
          if (!multiline && e.key === 'Enter') e.preventDefault()
        }}
        className={cn('field-input', className)}
      />
      <span className="field-line" aria-hidden />
    </span>
  )
}
