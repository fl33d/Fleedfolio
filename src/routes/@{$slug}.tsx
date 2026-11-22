// Personal portfolio paths use /@name. Legacy /p/{id} routes remain supported.
import { createFileRoute, Link, notFound } from '@tanstack/react-router'

import { PublicPage } from '@/components/portfolio/PublicPage'
import { Backdrop } from '@/components/portfolio/effects'
import { getCustomPortfolio } from '@/server/portfolio.functions'

export const Route = createFileRoute('/@{$slug}')({
  loader: async ({ params }) => {
    const portfolio = await getCustomPortfolio({ data: { slug: params.slug } })
    if (!portfolio) throw notFound()
    return portfolio
  },
  head: ({ loaderData }) => {
    const title = loaderData
      ? [loaderData.name, loaderData.role].filter(Boolean).join(' — ')
      : 'Portfolio'
    const description = loaderData?.tagline || 'A portfolio made with fleed.'
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
      ],
    }
  },
  component: PublicPortfolio,
  notFoundComponent: () => (
    <div className="app mode-view min-h-screen grid place-items-center text-center px-6">
      <Backdrop />
      <div className="relative">
        <p className="font-display text-6xl md:text-8xl">Still blank.</p>
        <p className="mt-5 text-sm opacity-50">This page hasn’t been written yet.</p>
        <Link to="/" className="pf-add pf-add-inline mt-10 inline-flex">
          Write your own →
        </Link>
      </div>
    </div>
  ),
})

function PublicPortfolio() {
  return <PublicPage data={Route.useLoaderData()} />
}
