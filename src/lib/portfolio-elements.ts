import {
  emptyCustomSection, emptyEducation, emptyExperience,
  emptyProject, emptySocial, type Portfolio,
} from './portfolio.ts'

export type ElementKind = 'text' | 'project' | 'experience' | 'education' | 'skills' | 'contact'

const missing = (value: string) => !value.trim()

/**
 * Add or reveal an element without changing the published data schema.
 * Sections remain responsive and support the existing CV exporter.
 */
export function addPortfolioElement(current: Portfolio, kind: ElementKind): Portfolio {
  const show = (key: Portfolio['hidden'][number]): Portfolio => ({
    ...current,
    hidden: current.hidden.filter(item => item !== key),
  })

  switch (kind) {
    case 'text':
      return current.extras.length < 24
        ? { ...current, extras: [...current.extras, emptyCustomSection()] }
        : current
    case 'project': {
      const base = show('work')
      const hasEmpty = base.projects.some(p =>
        missing(p.title) && missing(p.description) && missing(p.link) && missing(p.image),
      )
      return hasEmpty || base.projects.length >= 24
        ? base : { ...base, projects: [...base.projects, emptyProject()] }
    }
    case 'experience': {
      const base = show('experience')
      const hasEmpty = base.experience.some(e => missing(e.role) && missing(e.company) && missing(e.period))
      return hasEmpty || base.experience.length >= 24
        ? base : { ...base, experience: [...base.experience, emptyExperience()] }
    }
    case 'education': {
      const base = show('education')
      const hasEmpty = base.education.some(e =>
        missing(e.qualification) && missing(e.institution) && missing(e.period),
      )
      return hasEmpty || base.education.length >= 24
        ? base : { ...base, education: [...base.education, emptyEducation()] }
    }
    case 'skills':
      return show('skills')
    case 'contact': {
      const base = show('contact')
      const hasEmpty = base.socials.some(s => missing(s.label) && missing(s.url))
      return hasEmpty || base.socials.length >= 12
        ? base : { ...base, socials: [...base.socials, emptySocial()] }
    }
  }
}
