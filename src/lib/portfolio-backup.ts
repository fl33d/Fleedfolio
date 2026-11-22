import { normalizePortfolio, type Portfolio } from './portfolio.ts'

export const PORTFOLIO_BACKUP_FORMAT = 'fleedfolio-draft'
export const PORTFOLIO_BACKUP_VERSION = 1

/** Exports public portfolio content only, never the local publishing edit token. */
export function createPortfolioBackup(portfolio: Portfolio): string {
  return JSON.stringify(
    {
      format: PORTFOLIO_BACKUP_FORMAT,
      version: PORTFOLIO_BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      portfolio,
    },
    null,
    2,
  )
}

/** Reject arbitrary JSON rather than silently replacing a draft with an empty page. */
export function parsePortfolioBackup(content: string): Portfolio {
  const parsed: unknown = JSON.parse(content)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid portfolio backup')
  }
  const backup = parsed as Record<string, unknown>
  if (backup.format !== PORTFOLIO_BACKUP_FORMAT || backup.version !== PORTFOLIO_BACKUP_VERSION) {
    throw new Error('Unsupported portfolio backup format')
  }
  const raw = backup.portfolio
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Missing portfolio data')
  }
  const candidate = raw as Record<string, unknown>
  if (typeof candidate.name !== 'string' || !Array.isArray(candidate.projects) ||
      !candidate.theme || typeof candidate.theme !== 'object') {
    throw new Error('Malformed portfolio data')
  }
  return normalizePortfolio(candidate)
}
