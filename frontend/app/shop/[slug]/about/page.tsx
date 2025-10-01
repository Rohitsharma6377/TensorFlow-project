import React from 'react'

async function getShop(slug: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE || ''
  const res = await fetch(`${base}/api/v1/shops/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } })
  if (!res.ok) return null
  const data = await res.json()
  return data?.shop || null
}

export default async function ShopAboutPage({ params }: { params: { slug: string } }) {
  const shop = await getShop(params.slug)
  if (!shop) {
    return <div className="max-w-4xl mx-auto p-6">Shop not found</div>
  }
  const pages: any[] = shop?.metadata?.pages || []
  const about = pages.find((p) => p.handle === 'about' && p.visibility !== 'hidden')

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">About {shop.name}</h1>
      {about ? (
        <article className="prose max-w-none dark:prose-invert">
          {/* Seller-provided HTML */}
          <div dangerouslySetInnerHTML={{ __html: String(about.content || '') }} />
        </article>
      ) : (
        <p className="text-slate-600">No about content yet.</p>
      )}
    </div>
  )
}
