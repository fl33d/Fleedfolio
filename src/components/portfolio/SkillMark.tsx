import { findCatalogSkill } from '@/lib/skill-catalog'

/** An optional branded technology mark with a stable text fallback. No untrusted URLs. */
export function SkillMark({ name, size = 20 }: { name: string; size?: number }) {
  const known = findCatalogSkill(name)
  const letter = name.trim().slice(0, 1).toUpperCase() || '?'
  return <span className="pf-skill-mark" aria-hidden="true" style={{ width: size + 8, height: size + 8 }}>
    <span className="pf-skill-mark-fallback">{letter}</span>
    {known?.icon && <img
      src={'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/' + known.icon}
      alt="" width={size} height={size} loading="lazy" decoding="async"
      onError={event => { event.currentTarget.style.display = 'none' }}
    />}
  </span>
}
