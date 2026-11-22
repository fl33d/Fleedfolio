import { mailtoHref, safeUrl, type Portfolio } from './portfolio'

/** A portable single-column text version alongside the browser's print-ready CV. */
export function portfolioCvText(data: Portfolio, publicUrl?: string): string {
  const parts: string[] = []
  const section = (name: string, entries: string[]) => {
    const items = entries.map((entry) => entry.trim()).filter(Boolean)
    if (items.length) parts.push(name.toUpperCase(), ...items, '')
  }

  if (data.name.trim()) parts.push(data.name.trim())
  if (data.role.trim()) parts.push(data.role.trim())
  if (data.location.trim()) parts.push(data.location.trim())
  if (mailtoHref(data.email)) parts.push(data.email.trim())
  if (publicUrl && safeUrl(publicUrl)) parts.push(publicUrl)
  parts.push('')

  section('Profile', [data.about || data.tagline])
  section('Experience', data.experience
    .filter((entry) => entry.role || entry.company)
    .map((entry) => [entry.role, entry.company, entry.period].filter(Boolean).join(' | ')))
  section('Education', data.education
    .filter((entry) => entry.qualification || entry.institution)
    .map((entry) => [entry.qualification, entry.institution, entry.period].filter(Boolean).join(' | ')))
  section('Skills', data.skills.length ? [data.skills.join(', ')] : [])
  section('Selected projects', data.projects
    .filter((entry) => entry.title || entry.description)
    .map((entry) => [
      [entry.title, entry.year].filter(Boolean).join(' | '),
      entry.description,
      safeUrl(entry.link) ?? '',
    ].filter(Boolean).join('\n')))
  section('Additional information', data.extras
    .filter((entry) => entry.title || entry.body)
    .map((entry) => [entry.title, entry.body].filter(Boolean).join('\n')))
  section('Links', data.socials
    .filter((entry) => entry.label && safeUrl(entry.url))
    .map((entry) => entry.label + ': ' + safeUrl(entry.url)))

  return parts.join('\n').trimEnd() + '\n'
}
