import { ArrowLeft, Download, Printer } from 'lucide-react'

import { portfolioCvText } from '@/lib/cv'
import { mailtoHref, safeUrl, type Portfolio } from '@/lib/portfolio'

type Props = {
  data: Portfolio
  publicUrl?: string
  onBack: () => void
}

/** One source of truth: no duplicate CV fields or invented qualifications. */
export function CvView({ data, publicUrl, onBack }: Props) {
  const experience = data.experience.filter((entry) => entry.role || entry.company)
  const education = data.education.filter((entry) => entry.qualification || entry.institution)
  const projects = data.projects.filter((entry) => entry.title || entry.description)
  const socials = data.socials
    .map((entry) => ({ ...entry, href: safeUrl(entry.url) }))
    .filter((entry) => entry.href && entry.label)
  const extras = data.extras.filter((entry) => entry.title || entry.body)
  const email = mailtoHref(data.email)

  const downloadText = () => {
    const text = portfolioCvText(data, publicUrl)
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const filename = (data.name || 'Portfolio')
      .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'portfolio'
    link.href = url
    link.download = filename + '-cv.txt'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="cv-screen">
      <div className="cv-controls">
        <button className="cv-back" type="button" onClick={onBack}>
          <ArrowLeft className="size-4" /> Back to portfolio
        </button>
        <div className="cv-actions">
          <button className="cv-text-button" type="button" onClick={downloadText}>
            <Download className="size-4" /> Download text
          </button>
          <button className="cv-print-button" type="button" onClick={() => window.print()}>
            <Printer className="size-4" /> Print / Save PDF
          </button>
        </div>
      </div>
      <p className="cv-intro">
        A simple CV built from your portfolio. Edit the content in your portfolio, then
        return here to print or save it. Nothing is published automatically from this view.
      </p>

      <article className="cv-paper" aria-label="CV preview">
        <header className="cv-header">
          <h1>{data.name || 'Your name'}</h1>
          {data.role && <p className="cv-role">{data.role}</p>}
          <div className="cv-contact">
            {data.location && <span>{data.location}</span>}
            {email && <a href={email}>{data.email}</a>}
            {publicUrl && safeUrl(publicUrl) && <a href={publicUrl}>{publicUrl}</a>}
          </div>
        </header>
        {(data.about || data.tagline) && (
          <section className="cv-section">
            <h2>Profile</h2>
            <p className="cv-copy">{data.about || data.tagline}</p>
          </section>
        )}
        {experience.length > 0 && (
          <section className="cv-section">
            <h2>Experience</h2>
            {experience.map((entry) => (
              <div className="cv-entry" key={entry.id}>
                <div className="cv-entry-heading">
                  <h3>{entry.role || 'Experience'}</h3>
                  {entry.period && <span>{entry.period}</span>}
                </div>
                {entry.company && <p>{entry.company}</p>}
              </div>
            ))}
          </section>
        )}
        {education.length > 0 && (
          <section className="cv-section">
            <h2>Education</h2>
            {education.map((entry) => (
              <div className="cv-entry" key={entry.id}>
                <div className="cv-entry-heading">
                  <h3>{entry.qualification || 'Qualification'}</h3>
                  {entry.period && <span>{entry.period}</span>}
                </div>
                {entry.institution && <p>{entry.institution}</p>}
              </div>
            ))}
          </section>
        )}
        {data.skills.length > 0 && (
          <section className="cv-section">
            <h2>Skills</h2>
            <p>{data.skills.join(' · ')}</p>
          </section>
        )}
        {projects.length > 0 && (
          <section className="cv-section">
            <h2>Selected projects</h2>
            {projects.map((entry) => {
              const href = safeUrl(entry.link)
              return (
                <div className="cv-entry" key={entry.id}>
                  <div className="cv-entry-heading">
                    <h3>{entry.title || 'Project'}</h3>
                    {entry.year && <span>{entry.year}</span>}
                  </div>
                  {entry.description && <p className="cv-copy">{entry.description}</p>}
                  {href && <a className="cv-link" href={href}>{href}</a>}
                </div>
              )
            })}
          </section>
        )}
        {extras.map((entry) => (
          <section className="cv-section" key={entry.id}>
            {entry.title && <h2>{entry.title}</h2>}
            {entry.body && <p className="cv-copy">{entry.body}</p>}
          </section>
        ))}
        {socials.length > 0 && (
          <section className="cv-section">
            <h2>Links</h2>
            <ul className="cv-links">
              {socials.map((entry) => (
                <li key={entry.id}>{entry.label}: <a href={entry.href}>{entry.href}</a></li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  )
}
