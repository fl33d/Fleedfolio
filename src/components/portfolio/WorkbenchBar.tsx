import { ArrowUpRight, CircleHelp, Eye, FileText, Menu, Search, Send } from 'lucide-react'
import type { Portfolio } from '@/lib/portfolio'
import { Customize } from './Customize'

type Props = {
  data: Portfolio
  onChange: (update: (data: Portfolio) => Portfolio) => void
  onImport: (draft: Portfolio) => boolean
  customSlug: string
  onSlugChange: (slug: string) => void
  onReset: () => void
  libraryOpen: boolean
  onToggleLibrary: () => void
  customiseOpen: boolean
  onOpenCustomise: (open: boolean) => void
  onPreview: () => void
  onCv: () => void
  onCommands: () => void
  onTour: () => void
  onPublish: () => void
  published: boolean
  publishing: boolean
}

/**
 * Fleed's workbench chrome is separate from visitor portfolio typography.
 * Library, design settings, and page content remain independently interactive.
 */
export function WorkbenchBar({
  data, onChange, onImport, customSlug, onSlugChange, onReset,
  libraryOpen, onToggleLibrary, customiseOpen, onOpenCustomise,
  onPreview, onCv, onCommands, onTour, onPublish, published, publishing,
}: Props) {
  return <header className="ff-workbench-topbar" aria-label="Fleedfolio editor toolbar">
    <div className="ff-workbench-left">
      <button
        type="button" className="ff-workbench-menu"
        aria-label={libraryOpen ? 'Close elements library' : 'Open elements library'}
        aria-expanded={libraryOpen} aria-controls="ff-elements-library"
        onClick={onToggleLibrary}
        title="Elements library"
      >
        <Menu size={20} strokeWidth={1.8} />
      </button>
      <span className="ff-workbench-logo">fleed<span>.</span></span>
      <span className="ff-workbench-rule" aria-hidden="true" />
      <div className="ff-workbench-document">
        <strong>{data.name.trim() || 'Untitled portfolio'}</strong>
        <span>{published ? 'Published portfolio' : 'Personal draft'} <span aria-hidden="true">·</span> Classic editor</span>
      </div>
    </div>
    <div className="ff-workbench-center" role="group" aria-label="Portfolio editing mode">
      <span className="ff-mode-current" aria-current="page">Edit</span>
      <button type="button" onClick={onPreview}><Eye size={16}/> Preview</button>
    </div>
    <div className="ff-workbench-right">
      <button type="button" className="ff-workbench-tool ff-workbench-search" onClick={onCommands} title="Quick actions · Ctrl+K">
        <Search size={17} /><span>Search</span><kbd>Ctrl K</kbd>
      </button>
      <button type="button" className="ff-workbench-tool" onClick={onCv} title="Preview CV"><FileText size={17}/><span>CV</span></button>
      <div className="ff-workbench-design">
        <Customize
          data={data} onChange={onChange} onImport={onImport}
          customSlug={customSlug} onSlugChange={onSlugChange}
          open={customiseOpen} onOpenChange={onOpenCustomise} onReset={onReset}
        />
      </div>
      <a href="/studio" className="ff-workbench-studio" title="Open the separate experimental Studio editor">
        Studio <ArrowUpRight size={14}/>
      </a>
      <button type="button" className="ff-workbench-help" onClick={onTour} aria-label="How to use the editor" title="How it works"><CircleHelp size={18}/></button>
      <button type="button" className="ff-workbench-publish" onClick={onPublish} disabled={publishing}>
        <Send size={16} className={publishing ? 'animate-pulse' : ''}/>
        {publishing ? 'Publishing…' : published ? 'Update' : 'Publish'}
      </button>
    </div>
  </header>
}
