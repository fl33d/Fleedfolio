import { useEffect, useState, type FormEvent } from 'react'
import { ArrowUpRight, Check, Copy, Link2, Pencil, Save } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { normalizeCustomSlug, portfolioPublicPath } from '@/lib/portfolio-slug'

type Published = { id: string; token: string; slug?: string }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  published: Published | null
  saving: boolean
  onSaveAddress: (slug: string) => Promise<boolean>
}

/**
 * Share the canonical URL, or claim/change a personal /@username address.
 * Never display or export the user's editing token.
 */
export function ShareDialog({ open, onOpenChange, published, saving, onSaveAddress }: Props) {
  const [editingAddress, setEditingAddress] = useState(false)
  const [draftSlug, setDraftSlug] = useState('')
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    if (!open) return
    setDraftSlug(published?.slug ?? '')
    setEditingAddress(false)
    setCopied(false)
  }, [open, published?.slug])

  const url = published && origin
    ? origin + portfolioPublicPath(published.id, published.slug)
    : ''
  const normalized = draftSlug.trim() ? normalizeCustomSlug(draftSlug) : ''
  const isValid = !draftSlug.trim() || Boolean(normalized)
  const isChanged = (normalized ?? draftSlug) !== (published?.slug ?? '')
  const previewUrl = origin && published
    ? origin + portfolioPublicPath(published.id, normalized || undefined)
    : ''

  const copyLink = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Portfolio link copied.')
    } catch {
      toast.error('Could not copy. Select the link to copy it manually.')
    }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!published || !isValid || !isChanged || saving) return
    const success = await onSaveAddress(normalized || '')
    if (success) {
      setEditingAddress(false)
      toast.success('Your portfolio address is updated.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="share-dialog fleed-frosted-dialog" overlayClassName="fleed-frosted-overlay">
        <div className="share-kicker"><Check className="size-3.5" /> Published successfully</div>
        <DialogHeader>
          <DialogTitle className="share-heading">Your portfolio is live.</DialogTitle>
          <DialogDescription className="share-description">
            Share this page with anyone. You can change its address here, or return
            to the editor and press Update whenever you make changes.
          </DialogDescription>
        </DialogHeader>

        <div className="share-section">
          <label className="share-field-label" htmlFor="fleed-public-link">Your public link</label>
          <div className="share-url-row">
            <input
              id="fleed-public-link"
              className="share-url-input"
              readOnly
              value={url}
              aria-label="Published portfolio URL"
              onFocus={(event) => event.currentTarget.select()}
            />
            <button type="button" className="share-copy-button" onClick={() => void copyLink()} disabled={!url}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="share-link-actions">
            <button
              type="button"
              className="share-text-action"
              onClick={() => {
                setDraftSlug(published?.slug ?? '')
                setEditingAddress((current) => !current)
              }}
              aria-expanded={editingAddress}
              aria-controls="fleed-share-address-editor"
            >
              <Pencil className="size-3.5" />
              {editingAddress ? 'Cancel editing' : 'Edit address'}
            </button>
            <a className="share-text-action" href={url || undefined} target="_blank" rel="noopener noreferrer">
              Open portfolio <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>

        {editingAddress && (
          <form id="fleed-share-address-editor" onSubmit={(event) => void submit(event)} className="share-address-editor">
            <label className="share-field-label" htmlFor="fleed-share-handle">
              Custom username <span>optional</span>
            </label>
            <div className="share-handle-row">
              <span className="share-handle-prefix">{origin ? new URL(origin).host : 'your-site'}/@</span>
              <input
                id="fleed-share-handle"
                className="share-handle-input"
                autoComplete="off"
                spellCheck={false}
                value={draftSlug}
                onChange={(event) => setDraftSlug(event.target.value.toLowerCase())}
                maxLength={30}
                placeholder="yourname"
                aria-invalid={!isValid}
                aria-describedby="fleed-share-handle-help"
              />
            </div>
            <p id="fleed-share-handle-help" className="share-field-help">
              {!isValid
                ? 'Use 3–30 letters, numbers or single hyphens. Some names are reserved.'
                : 'Changing your name retires the previous custom link. The original generated link still works.'}
            </p>
            <div className="share-address-foot">
              <span className="share-address-preview" title={previewUrl}>
                <Link2 className="size-3.5" />
                {normalized ? '/@' + normalized : published ? '/p/' + published.id : ''}
              </span>
              <button className="share-save-button" type="submit" disabled={!isValid || !isChanged || saving}>
                <Save className="size-3.5" />
                {saving ? 'Saving…' : 'Save address'}
              </button>
            </div>
          </form>
        )}

        <p className="share-footnote">
          Your edit access stays in this browser. Export a backup from Customise before clearing browser data.
        </p>
      </DialogContent>
    </Dialog>
  )
}
