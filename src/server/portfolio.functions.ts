import { createServerFn } from '@tanstack/react-start'

import { normalizePortfolio } from '@/lib/portfolio'
import { loadCustomPortfolio, loadPortfolio, savePortfolio } from './portfolio.server'

export const publishPortfolio = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { id?: string; token?: string; slug?: string; portfolio: unknown }) => data,
  )
  .handler(async ({ data }) => {
    try {
      return await savePortfolio(normalizePortfolio(data.portfolio), data.id, data.token, data.slug)
    } catch (error) {
      console.error('[Fleedfolio] Publish server function failed', error)
      throw error
    }
  })

export const getPortfolio = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const portfolio = await loadPortfolio(data.id)
    return portfolio ? normalizePortfolio(portfolio) : null
  })

export const getCustomPortfolio = createServerFn({ method: 'GET' })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const portfolio = await loadCustomPortfolio(data.slug)
    return portfolio ? normalizePortfolio(portfolio) : null
  })
