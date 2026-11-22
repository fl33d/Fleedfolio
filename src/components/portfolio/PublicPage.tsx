import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Check, Clipboard, Code2, Download } from 'lucide-react'
import { toast } from 'sonner'

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { type Portfolio, themeProps } from '@/lib/portfolio'
import { publicPortfolioDocument } from '@/lib/public-data'
import { Backdrop, ScrollProgress, Wordmark } from './effects'
import { Portfolio as PortfolioView } from './Portfolio'

export function PublicPage({ data }: { data: Portfolio }) {
  const [inspectOpen, setInspectOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(publicPortfolioDocument(data), null, 2)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      toast.success('Public portfolio JSON copied.')
    } catch {
      toast.error('Could not copy. You can select the JSON text manually.')
    }
  }

  const download = () => {
    const blob = new Blob([json + '\n'], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const name = data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'portfolio'
    link.href = url
    link.download = name + '-public.json'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="app mode-view" {...themeProps(data)}>
      {data.theme.backdrop && <Backdrop />}
      <ScrollProgress />
      <PortfolioView data={data} editing={false} />
      <footer className="pf-powered">
        <Link to="/" aria-label="Create a portfolio with Fleed">
          Made with <Wordmark />
        </Link>
        <button
          type="button"
          className="pf-inspect-link"
          onClick={() => { setCopied(false); setInspectOpen(true) }}
          aria-label="Inspect public portfolio data"
          title="View the public structured information behind this page"
        >
          <Code2 className="size-3.5" /> Inspect this page
        </button>
      </footer>
      <Dialog open={inspectOpen} onOpenChange={setInspectOpen}>
        <DialogContent className="pf-source-dialog">
          <div className="pf-source-heading">
            <div>
              <span className="pf-source-kicker">Behind the page</span>
              <DialogTitle className="pf-source-title">The structured view.</DialogTitle>
              <DialogDescription className="pf-source-description">
                A read-only look at the content behind this portfolio. No editing credentials are included.
              </DialogDescription>
            </div>
          </div>
          <div className="pf-source-actions">
            <button type="button" onClick={() => void copy()}>
              {copied ? <Check className="size-3.5" /> : <Clipboard className="size-3.5" />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
            <button type="button" onClick={download}>
              <Download className="size-3.5" /> Download
            </button>
          </div>
          <pre className="pf-source-code" tabIndex={0}><code>{json}</code></pre>
          <p className="pf-source-note">The page and this source use the same published data. Future editors can build on this documented structure.</p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
