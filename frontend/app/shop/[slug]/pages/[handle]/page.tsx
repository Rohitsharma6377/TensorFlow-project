import React from 'react'

async function getShop(slug: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE || ''
  const res = await fetch(`${base}/api/v1/shops/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } })
  if (!res.ok) return null
  const data = await res.json()
  return data?.shop || null
}

export default async function ShopCustomPage({ params }: { params: { slug: string; handle: string } }) {
  const shop = await getShop(params.slug)
  if (!shop) {
    return <div className="max-w-4xl mx-auto p-6">Shop not found</div>
  }
  const pages: any[] = shop?.metadata?.pages || []
  const page = pages.find((p) => String(p.handle) === String(params.handle) && p.visibility !== 'hidden')

  if (!page) return <div className="max-w-4xl mx-auto p-6">Page not found</div>

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{page.title || params.handle}</h1>
      <article className="prose max-w-none dark:prose-invert">
        <div dangerouslySetInnerHTML={{ __html: String(page.content || '') }} />
      </article>
    </div>
  )
}
