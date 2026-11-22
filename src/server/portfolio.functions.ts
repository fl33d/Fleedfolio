import { createServerFn } from '@tanstack/react-start'

import { normalizePortfolio } from '@/lib/portfolio'
import { loadCustomPortfolio, loadPortfolio, savePortfolio } from './portfolio.server'

export const publishPortfolio = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { id?: string; token?: string; slug?: string; portfolio: unknown }) => data,
  )
  .handler(({ data }) =>
    savePortfolio(normalizePortfolio(data.portfolio), data.id, data.token, data.slug),
  )

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
