import { useEffect, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { useLocation } from '@tanstack/react-router'
import { ArrowDown, ArrowUp, ArrowUpRight, Plus, X } from 'lucide-react'

import {
  emptyCustomSection,
  emptyExperience,
  emptyEducation,
  emptyProject,
  emptySocial,
  safeUrl,
  mailtoHref,
  reorderItems,
  type Labels,
  type Portfolio as PortfolioData,
} from '@/lib/portfolio'
import { cn } from '@/lib/utils'
import { Field } from './Field'
import { ImageSlot } from './ImageSlot'
import { SkillAutocomplete } from './SkillAutocomplete'
import { Reveal } from './effects'

type Props = {
  data: PortfolioData
  editing: boolean
  onChange?: (next: PortfolioData) => void
  onOpenCommands?: () => void
}

export function Portfolio({ data, editing, onChange, onOpenCommands }: Props) {
  const set = <K extends keyof PortfolioData>(key: K, value: PortfolioData[K]) =>
    onChange?.({ ...data, [key]: value })

  type ListKey = 'projects' | 'experience' | 'education' | 'socials' | 'extras'

  const updateItem = <K extends ListKey>(
    key: K,
    id: string,
    patch: Partial<PortfolioData[K][number]>,
  ) =>
    set(
      key,
      (data[key] as PortfolioData[K][number][]).map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ) as PortfolioData[K],
    )

  const removeItem = <K extends ListKey>(key: K, id: string) =>
    set(key, (data[key] as { id: string }[]).filter((i) => i.id !== id) as PortfolioData[K])

  const moveProject = (index: number, offset: -1 | 1) =>
    set('projects', reorderItems(data.projects, index, offset))

  const projects = editing ? data.projects : data.projects.filter((p) => p.title || p.description)
  const experience = editing ? data.experience : data.experience.filter((e) => e.role || e.company)
  const education = editing ? data.education : data.education.filter((e) => e.qualification || e.institution)
  const socials = editing ? data.socials : data.socials.filter((s) => s.label && safeUrl(s.url))
  const extras = editing ? data.extras : data.extras.filter((x) => x.title || x.body || x.image)
  const shown = (key: PortfolioData['hidden'][number]) => !data.hidden.includes(key)
  const setLabel = (key: keyof Labels, value: string) => set('labels', { ...data.labels, [key]: value })
  const labels = data.labels
  const emailHref = mailtoHref(data.email)
  const hasContact = Boolean(emailHref) || socials.length > 0

  const showAbout = shown('about') && (editing || !!data.about || !!data.aboutImage)
  const showWork = shown('work') && (editing || projects.length > 0)
  const showExperience = shown('experience') && (editing || experience.length > 0)
  const showEducation = shown('education') && (editing || education.length > 0)
  const showContact = shown('contact') && (editing || hasContact)

  const nav = [
    { id: 'about', label: labels.about || 'About', show: showAbout },
    { id: 'work', label: labels.work || 'Work', show: showWork },
    { id: 'experience', label: labels.experience || 'Experience', show: showExperience },
    { id: 'education', label: labels.education || 'Education', show: showEducation },
    { id: 'contact', label: labels.contact || 'Contact', show: showContact },
  ].filter((n) => n.show)

  // Old shared links may still carry #top and friends; tidy them away
  useEffect(() => {
    if (location.hash) history.replaceState(history.state, '', location.pathname + location.search)
  }, [])

  let section = 0
  const nextNumber = () => String(++section).padStart(2, '0')

  return (
    <div
      className="portfolio"
      data-font={data.theme.font}
      data-layout={data.theme.layout}
      data-scale={data.theme.scale}
      data-align={data.theme.align}
      style={{ '--accent-c': data.accent } as CSSProperties}
    >
      <header className="pf-nav">
        <ScrollLink to="top" className="pf-identity" aria-label="Back to top">
          {editing ? (
            <span className="pf-identity-brand">fleed<span aria-hidden="true">.</span></span>
          ) : (
            <span className="pf-identity-name">{data.name.trim() || 'Portfolio'}</span>
          )}
        </ScrollLink>
        <nav className="pf-main-nav" aria-label="Portfolio sections">
          {nav.map((item) => (
            <ScrollLink key={item.id} to={item.id} className="pf-nav-link">
              {item.label}
            </ScrollLink>
          ))}
        </nav>
        {onOpenCommands ? (
          <button type="button" className="pf-command-trigger" onClick={onOpenCommands} aria-label="Open command menu">
            <span>Quick actions</span><kbd>Ctrl K</kbd>
          </button>
        ) : (
          <span className="pf-header-rule" aria-hidden="true" />
        )}
      </header>

      {/* Hero */}
      <section id="top" className={cn('pf-hero slot-host', data.photo && 'has-photo')}>
        <div className="pf-hero-main">
        {editing && <p className="pf-editor-eyebrow">YOUR SPACE / START HERE</p>}
        {(editing || data.status) && (
          <div className="pf-status">
            {editing ? (
              <Field
                value={data.status}
                onChange={(v) => set('status', v)}
                placeholder="Availability (optional)"
                label="Availability"
                maxLength={80}
              />
            ) : (
              data.status
            )}
          </div>
        )}

        <h1 className="pf-name">
          {editing ? (
            <Field
              value={data.name}
              onChange={(v) => set('name', v)}
              placeholder="Your name"
              label="Name"
              maxLength={80}
            />
          ) : data.name ? (
            data.name
          ) : (
            <span className="opacity-30">Untitled</span>
          )}
        </h1>

        <div className="pf-hero-row">
          <Reveal delay={150} className="pf-role">
            {editing && <span className="pf-field-label">Your role</span>}
            {editing ? (
              <Field
                value={data.role}
                onChange={(v) => set('role', v)}
                placeholder="Designer, developer, artist…"
                label="Role"
                maxLength={120}
              />
            ) : (
              data.role
            )}
          </Reveal>
          <Reveal delay={150} className="pf-tagline">
            {editing && <span className="pf-field-label">A short introduction</span>}
            {editing ? (
              <Field
                value={data.tagline}
                onChange={(v) => set('tagline', v)}
                placeholder="What you make, and what matters to you."
                label="Tagline"
                maxLength={280}
                multiline
              />
            ) : (
              data.tagline
            )}
          </Reveal>
        </div>

        {editing && (
          <Reveal delay={150} className="pf-inline-meta">
            <span className="pf-label">Based in</span>
            <Field
              value={data.location}
              onChange={(v) => set('location', v)}
              placeholder="City or region (optional)"
              label="Location"
              maxLength={80}
            />
          </Reveal>
        )}

        </div>

        <Reveal delay={300} className="pf-hero-photo">
          <ImageSlot
            src={data.photo}
            onChange={(v) => set('photo', v)}
            editing={editing}
            alt={data.name || 'Portrait'}
            shape="portrait"
            hint="Add a portrait"
          />
        </Reveal>

        <ScrollLink to={nav[0]?.id ?? 'top'} className="pf-scroll">
          <span className="pf-scroll-line" />
          Scroll
        </ScrollLink>
      </section>

      {/* Skills */}
      {shown('skills') && (
        editing ? (
          <SkillAutocomplete skills={data.skills} onChange={(s) => set('skills', s)} />
        ) : data.skills.length > 0 ? (
          <section className="pf-skills" aria-label="Skills">
            <span className="pf-skills-heading">Skills & tools</span>
            <div className="pf-skills-list">
              {data.skills.map((skill, index) => (
                <span key={`${skill}-${index}`}>{skill}</span>
              ))}
            </div>
          </section>
        ) : null
      )}

      {/* About */}
      {showAbout && (
        <Section
          id="about"
          number={nextNumber()}
          title={labels.about}
          editing={editing}
          onTitle={(v) => setLabel('about', v)}
        >
          <div className={cn('pf-about-wrap slot-host', data.aboutImage && 'has-image')}>
          <Reveal className="pf-about">
            {editing ? (
              <Field
                value={data.about}
                onChange={(v) => set('about', v)}
                placeholder="A little about your background, interests and work."
                label="About"
                maxLength={3000}
                multiline
              />
            ) : (
              data.about.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)
            )}
          </Reveal>
          <Reveal delay={150} className="pf-about-image">
            <ImageSlot
              src={data.aboutImage}
              onChange={(v) => set('aboutImage', v)}
              editing={editing}
              alt={labels.about}
              shape="portrait"
            />
          </Reveal>
          </div>
        </Section>
      )}

      {/* Work */}
      {showWork ? (
        <Section
          id="work"
          number={nextNumber()}
          title={labels.work}
          editing={editing}
          onTitle={(v) => setLabel('work', v)}
        >
          <div className="pf-works">
            {projects.map((p, i) => {
              const href = safeUrl(p.link)
              return (
                <Reveal
                  key={p.id}
                  delay={Math.min(i, 4) * 80}
                  as="article"
                  className="pf-work slot-host"
                >
                  <span className="pf-work-index">{String(i + 1).padStart(2, '0')}</span>
                  <div className="pf-work-body">
                    <h3 className="pf-work-title">
                      {editing ? (
                        <Field
                          value={p.title}
                          onChange={(v) => updateItem('projects', p.id, { title: v })}
                          placeholder="Project title"
                          maxLength={120}
                        />
                      ) : (
                        p.title
                      )}
                    </h3>
                    <ImageSlot
                      src={p.image}
                      onChange={(v) => updateItem('projects', p.id, { image: v })}
                      editing={editing}
                      alt={p.title || 'Project image'}
                      className="pf-work-image"
                      hint="Add a cover image"
                    />
                    {(editing || p.description) && (
                      <div className="pf-work-desc">
                        {editing ? (
                          <Field
                            value={p.description}
                            onChange={(v) => updateItem('projects', p.id, { description: v })}
                            placeholder="Briefly describe the project and what you did."
                            maxLength={800}
                            multiline
                          />
                        ) : (
                          p.description
                        )}
                      </div>
                    )}
                    <div className="pf-work-foot">
                      {editing ? (
                        <>
                          <span className="flex-1 max-w-sm">
                            <Field
                              value={p.link}
                              onChange={(v) => updateItem('projects', p.id, { link: v })}
                              placeholder="Link (optional)"
                              maxLength={400}
                            />
                          </span>
                          <div className="pf-work-actions" role="group" aria-label={`Order ${p.title || 'project ' + (i + 1)}`}>
                            <button
                              type="button"
                              className="pf-order-button"
                              aria-label={`Move ${p.title || 'project'} up`}
                              title="Move up"
                              disabled={i === 0}
                              onClick={() => moveProject(i, -1)}
                            >
                              <ArrowUp className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              className="pf-order-button"
                              aria-label={`Move ${p.title || 'project'} down`}
                              title="Move down"
                              disabled={i === data.projects.length - 1}
                              onClick={() => moveProject(i, 1)}
                            >
                              <ArrowDown className="size-3.5" />
                            </button>
                            <RemoveButton onClick={() => removeItem('projects', p.id)} />
                          </div>
                        </>
                      ) : (
                        href && (
                          <a href={href} target="_blank" rel="noreferrer" className="pf-link">
                            View project <ArrowUpRight className="size-3.5" />
                          </a>
                        )
                      )}
                    </div>
                  </div>
                  <span className="pf-work-year">
                    {editing ? (
                      <Field
                        value={p.year}
                        onChange={(v) => updateItem('projects', p.id, { year: v })}
                        placeholder="Year"
                        maxLength={20}
                      />
                    ) : (
                      p.year
                    )}
                  </span>
                </Reveal>
              )
            })}
          </div>
          {editing && data.projects.length < 24 && (
            <AddButton
              className="pf-add-inline"
              onClick={() => set('projects', [...data.projects, emptyProject()])}
            >
              Add project
            </AddButton>
          )}
        </Section>
      ) : null}

      {/* Experience */}
      {showExperience ? (
        <Section
          id="experience"
          number={nextNumber()}
          title={labels.experience}
          editing={editing}
          onTitle={(v) => setLabel('experience', v)}
        >
          <ul className="pf-timeline">
            {experience.map((e, i) => (
              <Reveal key={e.id} as="li" delay={i * 80} className="pf-row">
                <div className="pf-row-role">
                  {editing ? (
                    <Field
                      value={e.role}
                      onChange={(v) => updateItem('experience', e.id, { role: v })}
                      placeholder="Role"
                      maxLength={120}
                    />
                  ) : (
                    e.role
                  )}
                </div>
                <div className="pf-row-company">
                  {editing ? (
                    <Field
                      value={e.company}
                      onChange={(v) => updateItem('experience', e.id, { company: v })}
                      placeholder="Company / Client"
                      maxLength={120}
                    />
                  ) : (
                    e.company
                  )}
                </div>
                <div className="pf-row-period">
                  {editing ? (
                    <Field
                      value={e.period}
                      onChange={(v) => updateItem('experience', e.id, { period: v })}
                      placeholder="2022 — Now"
                      maxLength={60}
                    />
                  ) : (
                    e.period
                  )}
                </div>
                {editing && <RemoveButton onClick={() => removeItem('experience', e.id)} />}
              </Reveal>
            ))}
          </ul>
          {editing && data.experience.length < 24 && (
            <AddButton
              className="pf-add-inline"
              onClick={() => set('experience', [...data.experience, emptyExperience()])}
            >
              Add experience
            </AddButton>
          )}
        </Section>
      ) : null}

      {/* Education: reusable on the portfolio and in printable CV mode. */}
      {showEducation ? (
        <Section
          id="education"
          number={nextNumber()}
          title={labels.education}
          editing={editing}
          onTitle={(value) => setLabel('education', value)}
        >
          <ul className="pf-timeline">
            {education.map((entry, index) => (
              <Reveal key={entry.id} as="li" delay={index * 80} className="pf-row">
                <div className="pf-row-role">
                  {editing ? (
                    <Field
                      value={entry.qualification}
                      onChange={(value) => updateItem('education', entry.id, { qualification: value })}
                      placeholder="Qualification or course"
                      maxLength={120}
                    />
                  ) : entry.qualification}
                </div>
                <div className="pf-row-company">
                  {editing ? (
                    <Field
                      value={entry.institution}
                      onChange={(value) => updateItem('education', entry.id, { institution: value })}
                      placeholder="School or institution"
                      maxLength={120}
                    />
                  ) : entry.institution}
                </div>
                <div className="pf-row-period">
                  {editing ? (
                    <Field
                      value={entry.period}
                      onChange={(value) => updateItem('education', entry.id, { period: value })}
                      placeholder="Years"
                      maxLength={60}
                    />
                  ) : entry.period}
                </div>
                {editing && <RemoveButton onClick={() => removeItem('education', entry.id)} />}
              </Reveal>
            ))}
          </ul>
          {editing && data.education.length < 24 && (
            <AddButton
              className="pf-add-inline"
              onClick={() => set('education', [...data.education, emptyEducation()])}
            >Add education</AddButton>
          )}
        </Section>
      ) : null}

      {/* Sections the writer added themselves */}
      {extras.map((x) => (
        <Section
          key={x.id}
          id={`section-${x.id}`}
          number={nextNumber()}
          title={x.title}
          editing={editing}
          onTitle={(v) => updateItem('extras', x.id, { title: v })}
          titlePlaceholder="Section title"
          onRemove={() => removeItem('extras', x.id)}
        >
          <div className={cn('pf-about-wrap slot-host', x.image && 'has-image')}>
            {(editing || x.body) && (
              <Reveal className="pf-extra-body">
                {editing ? (
                  <Field
                    value={x.body}
                    onChange={(v) => updateItem('extras', x.id, { body: v })}
                    placeholder="Add a note about this section."
                    maxLength={3000}
                    multiline
                  />
                ) : (
                  x.body.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)
                )}
              </Reveal>
            )}
            <Reveal delay={150} className="pf-about-image">
              <ImageSlot
                src={x.image}
                onChange={(v) => updateItem('extras', x.id, { image: v })}
                editing={editing}
                alt={x.title || 'Section image'}
                shape="wide"
              />
            </Reveal>
          </div>
        </Section>
      ))}

      {editing && data.extras.length < 12 && (
        <div className="pf-add-section">
          <AddButton onClick={() => set('extras', [...data.extras, emptyCustomSection()])}>
            Add a section of your own
          </AddButton>
        </div>
      )}

      {/* Contact */}
      {showContact && (
        <Section
          id="contact"
          number={nextNumber()}
          title={labels.contact}
          editing={editing}
          onTitle={(v) => setLabel('contact', v)}
        >
          <Reveal>
            <p className="pf-cta">
              {editing ? (
                <>
                  <Field
                    value={labels.ctaTop}
                    onChange={(v) => setLabel('ctaTop', v)}
                    placeholder="Let’s make"
                    label="Closing line"
                    maxLength={60}
                  />
                  <em>
                    <Field
                      value={labels.ctaBottom}
                      onChange={(v) => setLabel('ctaBottom', v)}
                      placeholder="something."
                      label="Closing line, emphasised"
                      maxLength={60}
                    />
                  </em>
                </>
              ) : (
                <>
                  {labels.ctaTop}
                  {labels.ctaTop && labels.ctaBottom && <br />}
                  <em>{labels.ctaBottom}</em>
                </>
              )}
            </p>
          </Reveal>
          <Reveal delay={150} className="mt-12">
            {editing ? (
              <div className="pf-email-edit">
                <Field
                  value={data.email}
                  onChange={(v) => set('email', v)}
                  placeholder="you@email.com"
                  label="Email"
                  maxLength={200}
                />
              </div>
            ) : (
              emailHref && (
                <a href={emailHref} className="pf-email">
                  <span>{data.email}</span>
                  <ArrowUpRight className="size-5" />
                </a>
              )
            )}
          </Reveal>
          <div className="pf-socials">
            {socials.map((s, i) => (
              <Reveal key={s.id} delay={200 + i * 60}>
                {editing ? (
                  <div className="pf-social-edit">
                    <span className="w-32">
                      <Field
                        value={s.label}
                        onChange={(v) => updateItem('socials', s.id, { label: v })}
                        placeholder="Label"
                        maxLength={40}
                      />
                    </span>
                    <span className="flex-1">
                      <Field
                        value={s.url}
                        onChange={(v) => updateItem('socials', s.id, { url: v })}
                        placeholder="https://"
                        maxLength={400}
                      />
                    </span>
                    <RemoveButton onClick={() => removeItem('socials', s.id)} />
                  </div>
                ) : (
                  <a href={safeUrl(s.url)} target="_blank" rel="noreferrer" className="pf-social">
                    <span>{s.label}</span>
                    <ArrowUpRight className="size-3.5" />
                  </a>
                )}
              </Reveal>
            ))}
            {editing && data.socials.length < 12 && (
              <AddButton
                className="pf-add-inline"
                onClick={() => set('socials', [...data.socials, emptySocial()])}
              >
                Add link
              </AddButton>
            )}
          </div>
        </Section>
      )}

      <footer className="pf-footer">
        <span>
          © {new Date().getFullYear()} {data.name || 'Your name'}
        </span>
        <ScrollLink to="top" className="pf-nav-link">
          Back to top
        </ScrollLink>
      </footer>
    </div>
  )
}

/** Scrolls to a section without writing a #hash into the address bar. */
function ScrollLink({
  to,
  children,
  ...rest
}: { to: string; children: ReactNode; className?: string; 'aria-label'?: string }) {
  const { pathname } = useLocation()
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    if (to === 'top') window.scrollTo({ top: 0, behavior: 'smooth' })
    else document.getElementById(to)?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <a href={to === 'top' ? pathname : `#${to}`} onClick={go} {...rest}>
      {children}
    </a>
  )
}

function Section({
  id,
  number,
  title,
  children,
  editing,
  onTitle,
  onRemove,
  titlePlaceholder = 'Section title',
}: {
  id: string
  number: string
  title: string
  children: ReactNode
  editing?: boolean
  onTitle?: (value: string) => void
  onRemove?: () => void
  titlePlaceholder?: string
}) {
  return (
    <section id={id} className="pf-section">
      <Reveal className="pf-section-head">
        <span className="pf-section-num">{number}</span>
        {editing && onTitle ? (
          <span className="pf-section-title is-editable">
            <Field value={title} onChange={onTitle} placeholder={titlePlaceholder} maxLength={60} />
          </span>
        ) : (
          <span className="pf-section-title">{title}</span>
        )}
        <span className="pf-section-rule" />
        {editing && onRemove && <RemoveButton onClick={onRemove} />}
      </Reveal>
      {children}
    </section>
  )
}

function AddButton({
  children,
  onClick,
  className,
}: {
  children: ReactNode
  onClick: () => void
  className?: string
}) {
  return (
    <button type="button" onClick={onClick} className={cn('pf-add', className)}>
      <span className="pf-add-icon">
        <Plus className="size-4" />
      </span>
      {children}
    </button>
  )
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="pf-remove" aria-label="Remove">
      <X className="size-4" />
    </button>
  )
}
