import { env } from 'cloudflare:workers'

import type { Portfolio } from '@/lib/portfolio'
import { normalizeCustomSlug } from '@/lib/portfolio-slug'

const hash = async (token: string): Promise<string> => {
  const bytes = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

const randomHex = (byteLength: number): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength))
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

const tokensMatch = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false
  let difference = 0
  for (let i = 0; i < a.length; i++) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return difference === 0
}

export const validId = (id: unknown): id is string =>
  typeof id === 'string' && /^[a-z0-9]{6,32}$/.test(id)

type StoredRecord = {
  portfolio_json: string
  token_hash: string
}
type Published = { id: string; token: string; slug?: string }

// Alias IDs begin with @, so they cannot overlap with generated portfolio IDs.
// This uses the existing D1 table; no database schema migration is necessary.
const aliasId = (slug: string) => '@' + slug

function storedSlug(json: string): string | undefined {
  try {
    const data: unknown = JSON.parse(json)
    if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined
    const raw = (data as Record<string, unknown>).__fleed_slug
    return normalizeCustomSlug(raw) ?? undefined
  } catch {
    return undefined
  }
}

function requestedSlug(value: unknown): string | undefined {
  // Omitted means retain the existing name; empty means use the generated URL.
  if (value === undefined) return undefined
  if (typeof value !== 'string') throw new Error('Invalid custom link.')
  if (!value.trim()) return ''
  const slug = normalizeCustomSlug(value)
  if (!slug) throw new Error('Custom links must be 3–30 letters, numbers or single hyphens.')
  return slug
}

async function ensureAvailable(
  db: typeof env.fleed_portfolios,
  slug: string,
  ownerHash: string,
): Promise<void> {
  const existing = await db.prepare('SELECT token_hash FROM portfolios WHERE id = ?')
    .bind(aliasId(slug)).first<{ token_hash: string }>()
  if (existing && !tokensMatch(existing.token_hash, ownerHash)) {
    throw new Error('That custom link is already taken.')
  }
}

export async function savePortfolio(
  portfolio: Portfolio,
  id?: string,
  token?: string,
  slugInput?: string,
): Promise<Published> {
  const db = env.fleed_portfolios
  const requested = requestedSlug(slugInput)
  const now = new Date().toISOString()

  if (id !== undefined || token !== undefined) {
    if (!validId(id) || typeof token !== 'string' || !token) {
      throw new Error('Publishing credentials are invalid.')
    }
    const previous = await db.prepare(
      'SELECT portfolio_json, token_hash FROM portfolios WHERE id = ?',
    ).bind(id).first<StoredRecord>()
    if (!previous || !tokensMatch(previous.token_hash, await hash(token))) {
      throw new Error('This portfolio cannot be updated from this browser.')
    }
    const slug = requested === undefined ? storedSlug(previous.portfolio_json) ?? '' : requested
    if (slug) await ensureAvailable(db, slug, previous.token_hash)
    const json = JSON.stringify({
      ...portfolio,
      ...(slug ? { __fleed_slug: slug } : {}),
    })
    const statements = [
      db.prepare(
        'UPDATE portfolios SET portfolio_json = ?, updated_at = ? WHERE id = ? AND token_hash = ?',
      ).bind(json, now, id, previous.token_hash),
      // Remove any older alias for this edit credential before assigning the new one.
      db.prepare("DELETE FROM portfolios WHERE id LIKE '@%' AND token_hash = ?")
        .bind(previous.token_hash),
    ]
    if (slug) {
      statements.push(db.prepare(
        'INSERT INTO portfolios (id, portfolio_json, token_hash, updated_at) VALUES (?, ?, ?, ?)',
      ).bind(
        aliasId(slug),
        JSON.stringify({ __fleed_alias: 1, portfolioId: id }),
        previous.token_hash,
        now,
      ))
    }
    // D1 batches are atomic. Duplicate usernames roll back the entire update.
    try {
      await db.batch(statements)
    } catch {
      throw new Error('The custom link could not be claimed. It may already be taken.')
    }
    return { id, token, ...(slug ? { slug } : {}) }
  }

  const newId = randomHex(6)
  const newToken = randomHex(24)
  const tokenHash = await hash(newToken)
  const slug = requested || ''
  if (slug) await ensureAvailable(db, slug, tokenHash)
  const json = JSON.stringify({
    ...portfolio,
    ...(slug ? { __fleed_slug: slug } : {}),
  })
  const statements = [
    db.prepare(
      'INSERT INTO portfolios (id, portfolio_json, token_hash, updated_at) VALUES (?, ?, ?, ?)',
    ).bind(newId, json, tokenHash, now),
  ]
  if (slug) {
    statements.push(db.prepare(
      'INSERT INTO portfolios (id, portfolio_json, token_hash, updated_at) VALUES (?, ?, ?, ?)',
    ).bind(
      aliasId(slug),
      JSON.stringify({ __fleed_alias: 1, portfolioId: newId }),
      tokenHash,
      now,
    ))
  }
  try {
    await db.batch(statements)
  } catch {
    throw new Error('Publishing failed. The custom link may already be taken.')
  }
  return { id: newId, token: newToken, ...(slug ? { slug } : {}) }
}

/** Existing /p/{id} URLs continue to resolve directly. */
export async function loadPortfolio(id: string): Promise<Portfolio | null> {
  if (!validId(id)) return null
  const stored = await env.fleed_portfolios.prepare(
    'SELECT portfolio_json FROM portfolios WHERE id = ?',
  ).bind(id).first<{ portfolio_json: string }>()
  if (!stored) return null
  try {
    return JSON.parse(stored.portfolio_json) as Portfolio
  } catch {
    return null
  }
}

/** Resolve /@name to the published portfolio, with an ownership check. */
export async function loadCustomPortfolio(rawSlug: string): Promise<Portfolio | null> {
  const slug = normalizeCustomSlug(rawSlug)
  if (!slug) return null
  const db = env.fleed_portfolios
  const alias = await db.prepare(
    'SELECT portfolio_json, token_hash FROM portfolios WHERE id = ?',
  ).bind(aliasId(slug)).first<StoredRecord>()
  if (!alias) return null

  try {
    const pointer: unknown = JSON.parse(alias.portfolio_json)
    if (!pointer || typeof pointer !== 'object' || Array.isArray(pointer)) return null
    const data = pointer as Record<string, unknown>
    if (data.__fleed_alias !== 1 || !validId(data.portfolioId)) return null
    const owner = await db.prepare(
      'SELECT portfolio_json, token_hash FROM portfolios WHERE id = ?',
    ).bind(data.portfolioId).first<StoredRecord>()
    if (!owner || !tokensMatch(owner.token_hash, alias.token_hash)) return null
    if (storedSlug(owner.portfolio_json) !== slug) return null
    return JSON.parse(owner.portfolio_json) as Portfolio
  } catch {
    return null
  }
}
