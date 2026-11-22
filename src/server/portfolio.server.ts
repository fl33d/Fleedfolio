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

type StoredPortfolio = {
  portfolio_json: string
  token_hash: string
}

type Alias = { slug: string; portfolio_id: string }
type Published = { id: string; token: string; slug?: string }

function requestedSlug(value: unknown): string | undefined {
  // Omitted = retain existing alias; empty string = explicitly use the default URL.
  if (value === undefined) return undefined
  if (typeof value !== 'string') throw new Error('Invalid custom link.')
  if (!value.trim()) return ''
  const slug = normalizeCustomSlug(value)
  if (!slug) throw new Error('Custom links must be 3–30 letters, numbers or single hyphens.')
  return slug
}

async function assertSlugAvailable(
  db: typeof env.fleed_portfolios,
  slug: string,
  portfolioId?: string,
): Promise<void> {
  const alias = await db
    .prepare('SELECT portfolio_id FROM portfolio_slugs WHERE slug = ?')
    .bind(slug)
    .first<Alias>()
  if (alias && alias.portfolio_id !== portfolioId) {
    throw new Error('That custom link is already taken.')
  }

  // Older stored IDs also take precedence over aliases in public routing.
  const idCollision = await db
    .prepare('SELECT id FROM portfolios WHERE id = ?')
    .bind(slug)
    .first<{ id: string }>()
  if (idCollision && idCollision.id !== portfolioId) {
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
  const slug = requestedSlug(slugInput)
  const json = JSON.stringify(portfolio)
  const timestamp = new Date().toISOString()

  if (id !== undefined || token !== undefined) {
    // Never silently create a second portfolio after a failed update.
    if (!validId(id) || typeof token !== 'string' || !token) {
      throw new Error('Publishing credentials are invalid.')
    }
    const existing = await db
      .prepare('SELECT portfolio_json, token_hash FROM portfolios WHERE id = ?')
      .bind(id)
      .first<StoredPortfolio>()
    if (!existing || !tokensMatch(existing.token_hash, await hash(token))) {
      throw new Error('This portfolio cannot be updated from this browser.')
    }

    const previous = await db
      .prepare('SELECT slug FROM portfolio_slugs WHERE portfolio_id = ?')
      .bind(id)
      .first<Alias>()
    const chosen = slug === undefined ? previous?.slug ?? '' : slug
    if (chosen) await assertSlugAvailable(db, chosen, id)

    const statements = [
      db.prepare('UPDATE portfolios SET portfolio_json = ?, updated_at = ? WHERE id = ? AND token_hash = ?')
        .bind(json, timestamp, id, existing.token_hash),
    ]
    if (chosen !== (previous?.slug ?? '')) {
      statements.push(db.prepare('DELETE FROM portfolio_slugs WHERE portfolio_id = ?').bind(id))
      if (chosen) {
        statements.push(
          db.prepare('INSERT INTO portfolio_slugs (slug, portfolio_id) VALUES (?, ?)')
            .bind(chosen, id),
        )
      }
    }
    // D1 batch statements execute transactionally; a collision rolls back the update.
    await db.batch(statements)
    return { id, token, ...(chosen ? { slug: chosen } : {}) }
  }

  const newId = randomHex(6)
  const newToken = randomHex(24)
  if (slug) await assertSlugAvailable(db, slug)

  const statements = [
    db.prepare('INSERT INTO portfolios (id, portfolio_json, token_hash, updated_at) VALUES (?, ?, ?, ?)')
      .bind(newId, json, await hash(newToken), timestamp),
  ]
  if (slug) {
    statements.push(
      db.prepare('INSERT INTO portfolio_slugs (slug, portfolio_id) VALUES (?, ?)')
        .bind(slug, newId),
    )
  }
  await db.batch(statements)
  return { id: newId, token: newToken, ...(slug ? { slug } : {}) }
}

export async function loadPortfolio(idOrSlug: string): Promise<Portfolio | null> {
  const db = env.fleed_portfolios
  let stored: { portfolio_json: string } | null = null

  // Existing numeric/hex links always keep working, even when an alias exists.
  if (validId(idOrSlug)) {
    stored = await db
      .prepare('SELECT portfolio_json FROM portfolios WHERE id = ?')
      .bind(idOrSlug)
      .first<{ portfolio_json: string }>()
  }
  if (!stored) {
    const slug = normalizeCustomSlug(idOrSlug)
    if (!slug) return null
    stored = await db
      .prepare('SELECT p.portfolio_json FROM portfolios p JOIN portfolio_slugs s ON s.portfolio_id = p.id WHERE s.slug = ?')
      .bind(slug)
      .first<{ portfolio_json: string }>()
  }

  if (!stored) return null
  try {
    return JSON.parse(stored.portfolio_json) as Portfolio
  } catch {
    return null
  }
}
