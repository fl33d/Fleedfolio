import { normalizePortfolio, type Portfolio } from './portfolio.ts'

/**
 * Only the explicitly supported, public portfolio fields enter the inspector.
 * The normalizer discards token hashes, alias internals and unknown metadata.
 */
export function publicPortfolioDocument(raw: unknown): {
  schemaVersion: 1
  portfolio: Portfolio
} {
  return {
    schemaVersion: 1,
    portfolio: normalizePortfolio(raw),
  }
}
