import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Github, LoaderCircle } from 'lucide-react'

const LANGUAGE_COLOURS: Record<string, string> = {
  python:'#3572A5', javascript:'#f1e05a', typescript:'#3178c6',
  html:'#e34c26', css:'#563d7c', rust:'#dea584', go:'#00add8',
  java:'#b07219', 'c++':'#f34b7d', c:'#555555', 'c#':'#178600',
  ruby:'#701516', php:'#4f5d95', swift:'#f05138', kotlin:'#a97bff',
  shell:'#89e051', bash:'#89e051', dart:'#00b4ab', lua:'#000080',
  vue:'#41b883', scss:'#c6538c', svelte:'#ff3e00',
  'jupyter notebook':'#da5b0b', dockerfile:'#384d54',
}
const LANGUAGES = [
  'Python','JavaScript','TypeScript','HTML','CSS','Rust','Go',
  'Java','C','C++','C#','Ruby','PHP','Swift','Kotlin','Shell',
  'Bash','Dart','Lua','SQL','React','Node.js','Docker','Terraform',
  'Vue','Svelte','SCSS','Jupyter Notebook','Dockerfile',
]

/** Only existing user-selected skills enter the reel. No invented skills. */
export function SkillRail({ skills }: { skills: string[] }) {
  const moving = skills.length >= 3
  const badges = () => skills.map((skill, index) => (
    <span className="pf-reel-badge" key={index} style={{
      '--language-colour': LANGUAGE_COLOURS[skill.toLowerCase()] || '#a9b79c',
    } as CSSProperties}>
      <span className="pf-reel-dot" aria-hidden="true" />{skill}
    </span>
  ))
  return <div className={'pf-skill-reel'+(moving?' is-moving':'')} aria-label={'Skills: '+skills.join(', ')}>
    <div className="pf-reel-track" aria-hidden="true">
      <div className="pf-reel-group">{badges()}</div>
      {moving && <div className="pf-reel-group">{badges()}</div>}
    </div>
  </div>
}

type Repository = {
  language: unknown
  fork: unknown
  archived: unknown
  owner?: { login?: unknown }
}
export function languagesFromRepositories(repos: unknown, username: string): string[] {
  if (!Array.isArray(repos)) return []
  const frequencies = new Map<string, { label: string; count: number }>()
  for (const item of repos as Repository[]) {
    if (!item || item.fork || item.archived ||
      typeof item.language !== 'string' ||
      item.language.length > 40 ||
      !item.language.trim() ||
      (typeof item.owner?.login !== 'string' || item.owner.login.toLowerCase() !== username.toLowerCase())) continue
    const label = item.language.trim()
    const key = label.toLowerCase()
    const found = frequencies.get(key)
    if (found) found.count++
    else frequencies.set(key,{ label, count: 1 })
  }
  return [...frequencies.values()]
    .sort((a,b)=>b.count-a.count || a.label.localeCompare(b.label))
    .slice(0,16).map(item=>item.label)
}
export function mergeLanguages(existing: string[], imported: string[]): string[] {
  const result = [...existing]
  const seen = new Set(existing.map(s=>s.trim().toLowerCase()))
  for (const skill of imported) {
    const name=skill.trim()
    if (!name || name.length>40 || seen.has(name.toLowerCase()) || result.length>=40) continue
    result.push(name)
    seen.add(name.toLowerCase())
  }
  return result
}
export function githubUsernameFromLinks(links: { url: string }[]): string {
  for (const {url} of links) {
    try {
      const candidate = url.startsWith('http')?url:'https://'+url
      const u = new URL(candidate)
      const segments = u.pathname.split('/').filter(Boolean)
      if (['github.com','www.github.com'].includes(u.hostname.toLowerCase())
        && segments.length===1 && /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(segments[0]))
        return segments[0]
    } catch { /* ignore malformed links */ }
  }
  return ''
}

export function GithubLanguages({ skills, socials, onChange }: {
  skills: string[]
  socials: { url: string }[]
  onChange: (skills: string[]) => void
}) {
  const linkedUsername = useMemo(()=>githubUsernameFromLinks(socials),[socials])
  const [username,setUsername] = useState('')
  const [suggested,setSuggested] = useState<string[]>([])
  const [pending,setPending] = useState(false)
  const [notice,setNotice] = useState('')
  const [suggestionOpen,setSuggestionOpen] = useState(false)

  useEffect(()=>{ if(linkedUsername && !username) setUsername(linkedUsername) },[linkedUsername])
  const importGithub = async () => {
    const user=username.trim().replace(/^@/,'')
    if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(user)) {
      setNotice('Enter a valid GitHub username.');return
    }
    setPending(true);setNotice('');setSuggested([])
    const abort=new AbortController()
    const timeout=window.setTimeout(()=>abort.abort(),10000)
    try {
      const response=await fetch('https://api.github.com/users/'+encodeURIComponent(user)+
        '/repos?per_page=100&type=owner&sort=updated',{
          headers:{Accept:'application/vnd.github+json'},
          signal:abort.signal,
        })
      if(response.status===404)throw Error('No public GitHub profile found.')
      if(response.status===403 || response.status===429)throw Error('GitHub is limiting requests. Try again later, or add languages yourself.')
      if(!response.ok)throw Error('GitHub could not load your public repositories.')
      const found=languagesFromRepositories(await response.json(),user)
      if(!found.length) {
        setNotice('No recognised primary languages in recent public, non-fork repositories. You can still add them yourself.')
      } else {
        setSuggested(found);setNotice('These are detected from public repository languages, not proof of proficiency.')
      }
    } catch(error) {
      setNotice(error instanceof Error && error.name==='AbortError'
        ? 'GitHub took too long. Try again later.'
        : error instanceof Error?error.message:'Could not import public languages.')
    } finally {window.clearTimeout(timeout);setPending(false)}
  }
  const available = suggested.filter(name=>!skills.some(skill=>skill.toLowerCase()===name.toLowerCase()))
  return <div className="pf-github-import">
    <div className="pf-github-heading"><Github size={17} aria-hidden="true"/><strong>Languages from GitHub</strong></div>
    <p>Use the main language detected in your public repositories. Review before adding anything.</p>
    <div className="pf-github-row">
      <label className="sr-only" htmlFor="fleed-github-user">GitHub username</label>
      <input id="fleed-github-user" value={username} onChange={event=>{
        setUsername(event.target.value.slice(0,39));setSuggested([]);setNotice('')
      }} placeholder="GitHub username" autoCapitalize="off" autoCorrect="off" spellCheck={false}/>
      <button type="button" disabled={pending} onClick={()=>void importGithub()}>
        {pending?<LoaderCircle size={15} className="animate-spin" aria-hidden="true"/>:'Find languages'}
      </button>
    </div>
    {notice && <p className="pf-github-status" role="status">{notice}</p>}
    {suggested.length>0 && <div className="pf-github-results">
      <div className="pf-github-found">{suggested.map(name=><span key={name}>{name}</span>)}</div>
      <button type="button" disabled={!available.length} onClick={()=>{
        onChange(mergeLanguages(skills,available));setSuggested([])
        setNotice(available.length+' language'+(available.length===1?'':'s')+' added. You can remove any above.')
      }}>Add {available.length} new language{available.length===1?'':'s'}</button>
    </div>}
    <div className="pf-github-suggestions">
      <button type="button" aria-expanded={suggestionOpen}
        onClick={()=>setSuggestionOpen(!suggestionOpen)}>
        {suggestionOpen?'Hide':'Browse'} language suggestions
      </button>
      {suggestionOpen && <div className="pf-language-presets">
        {LANGUAGES.filter(name=>!skills.some(skill=>skill.toLowerCase()===name.toLowerCase())).map(name=>
          <button key={name} type="button" onClick={()=>onChange(mergeLanguages(skills,[name]))}
            disabled={skills.length>=40}>+ {name}</button>)}
      </div>}
    </div>
  </div>
}
