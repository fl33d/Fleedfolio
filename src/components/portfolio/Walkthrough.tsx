import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileText,
  Eye,
  MousePointer2,
  Send,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const STEPS: { title: string; description: string; example: string; icon: LucideIcon }[] = [
  {
    title: 'Create freely, no account required.',
    description: 'Fleed starts with a blank page. No sign-up, no setup. Click any placeholder to write your name and begin building a portfolio you can publish when ready.',
    example: 'Click “Your name” to begin',
    icon: MousePointer2,
  },
  {
    title: 'Make it your own.',
    description: 'Browse five designed starting points in Customise, then change their colours, typography and layout. Your content stays yours when you switch.',
    example: 'Customise → Your link → @yourname',
    icon: SlidersHorizontal,
  },
  {
    title: 'See what others see.',
    description: 'Switch from Edit to Preview any time. Only your finished content appears on the public page — visitors never see editing controls.',
    example: 'Edit  /  Preview',
    icon: Eye,
  },
  {
    title: 'Publish when you’re ready.',
    description: 'Press Publish to put your portfolio online. The share panel gives you a link you can copy, open or rename. After making edits, press Update.',
    example: 'Publish → Copy your link',
    icon: Send,
  },
  {
    title: 'Prepare your CV.',
    description: 'Add education, experience, projects and skills to the portfolio. Open CV from the dock to preview a clean résumé you can print or save as a PDF.',
    example: 'CV → Print / Save PDF',
    icon: FileText,
  },
  {
    title: 'Keep a copy of your work.',
    description: 'Guest drafts save in this browser. Export a JSON backup to move between devices or keep a secure copy. An account is never required to begin.',
    example: 'Customise → Your work → Export backup',
    icon: Download,
  },
]

export function Walkthrough({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (open) setStepIndex(0)
  }, [open])

  const step = STEPS[stepIndex]
  const Icon = step.icon
  const last = stepIndex === STEPS.length - 1

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="tour-dialog">
        <div className="tour-topline">
          <span>Get to know fleed</span>
          <span>{String(stepIndex + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}</span>
        </div>
        <div className="tour-progress" style={{ gridTemplateColumns: `repeat(${STEPS.length}, 1fr)` }} aria-label={`Step ${stepIndex + 1} of ${STEPS.length}`}>
          {STEPS.map((item, index) => (
            <span key={item.title} className={index <= stepIndex ? 'is-complete' : undefined} />
          ))}
        </div>
        <div className="tour-step" key={stepIndex}>
          <div className="tour-icon" aria-hidden><Icon className="size-6" strokeWidth={1.5} /></div>
          <DialogHeader>
            <DialogTitle className="tour-heading">{step.title}</DialogTitle>
            <DialogDescription className="tour-description">{step.description}</DialogDescription>
          </DialogHeader>
          <div className="tour-example">
            <span className="tour-example-label">Try this</span>
            <span>{step.example}</span>
          </div>
        </div>
        <div className="tour-controls">
          <button className="tour-skip" type="button" onClick={onClose}>{last ? 'Close guide' : 'Skip tour'}</button>
          <div className="tour-buttons">
            {stepIndex > 0 && (
              <button className="tour-back" type="button" onClick={() => setStepIndex((i) => i - 1)}>
                <ArrowLeft className="size-4" /> Back
              </button>
            )}
            <button className="tour-next" type="button" onClick={() => last ? onClose() : setStepIndex((i) => i + 1)}>
              {last ? <>Start creating <Check className="size-4" /></> : <>Next <ArrowRight className="size-4" /></>}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
