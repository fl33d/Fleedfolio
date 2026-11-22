/** Canonical custom paths use lowercase letters, numbers and single hyphens. */
export const RESERVED_SLUGS = new Set([
  'admin', 'api', 'app', 'billing', 'bot', 'contact', 'dashboard',
  'edit', 'fleed', 'fleedfolio', 'help', 'home', 'index', 'login',
  'logout', 'new', 'null', 'privacy', 'settings', 'signup',
  'support', 'terms', 'undefined', 'www',
])

export function normalizeCustomSlug(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const slug = input.trim().toLowerCase()
  if (
    !/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(slug) ||
    slug.includes('--') ||
    /^[0-9a-f]{12}$/.test(slug) ||
    RESERVED_SLUGS.has(slug)
  ) return null
  return slug
}
