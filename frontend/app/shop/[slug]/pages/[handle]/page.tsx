import React from 'react'
import Link from 'next/link'

async function getShop(slug: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE || ''
  const res = await fetch(`${base}/api/v1/shops/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } })
  if (!res.ok) return null
  const data = await res.json()
  return data?.shop || null
}

async function getProducts(shopId: string, limit = 100) {
  const base = process.env.NEXT_PUBLIC_API_BASE || ''
  const res = await fetch(`${base}/api/v1/products?shopId=${encodeURIComponent(shopId)}&limit=${limit}`, { next: { revalidate: 60 } })
  if (!res.ok) return []
  const data = await res.json()
  return data?.products || []
}

export default async function ShopCustomPage({ params }: { params: { slug: string; handle: string } }) {
  const shop = await getShop(params.slug)
  if (!shop) {
    return <div className="max-w-4xl mx-auto p-6">Shop not found</div>
  }
  const products = await getProducts(shop._id, 100)
  const pages: any[] = shop?.metadata?.pages || []
  const page = pages.find((p) => String(p.handle) === String(params.handle) && p.visibility !== 'hidden')

  const builder = shop?.metadata?.builder || {}
  const blocks = builder?.pages && builder.pages[params.handle] && Array.isArray(builder.pages[params.handle].blocks)
    ? builder.pages[params.handle].blocks
    : null

  const colors = { primary: shop?.metadata?.theme?.colors?.primary || shop?.metadata?.themeColor || '#10b981' }

  function renderHeader(block: any) {
    const logo = block?.props?.logoUrl || shop.logo?.url
    const menu = Array.isArray(block?.props?.menu) ? block.props.menu : []
    return (
      <header className="w-full bg-white border rounded-xl p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logo ? <img src={logo} alt="logo" className="h-10 w-10 rounded" /> : <div className="h-10 w-10 bg-slate-100 rounded" />}
          <div className="font-semibold">{shop.name}</div>
        </div>
        <nav className="hidden sm:flex items-center gap-4 text-sm">
          {menu.map((m: any, i: number) => (
            <Link key={i} href={m.href || '#'} className="hover:underline">
              {m.label}
            </Link>
          ))}
        </nav>
      </header>
    )
  }

  function renderHero(block: any) {
    const b = block?.props || {}
    return (
      <section className="rounded-xl overflow-hidden border">
        {b.image ? (
          <div className="relative">
            <img src={b.image} alt="hero" className="w-full h-56 sm:h-72 object-cover" />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
              {b.heading && <h2 className="text-2xl sm:text-3xl font-semibold">{b.heading}</h2>}
              {b.subheading && <p className="mt-2 max-w-2xl">{b.subheading}</p>}
              {b.ctaText && (
                <Link href={b.ctaHref || '#'} className="mt-4 inline-block">
                  <button className="px-5 py-2 rounded-md font-medium" style={{ background: colors.primary, color: '#fff' }}>{b.ctaText}</button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            {b.heading && <h2 className="text-2xl font-semibold" style={{ color: colors.primary }}>{b.heading}</h2>}
            {b.subheading && <p className="mt-2 text-slate-600">{b.subheading}</p>}
          </div>
        )}
      </section>
    )
  }

  function renderBanner(block: any) {
    const b = block?.props || {}
    const img = b.image
    const inner = (
      <img src={img} alt={b.alt || 'banner'} className="w-full h-40 sm:h-52 object-cover" />
    )
    return (
      <section className="rounded-xl overflow-hidden border">
        {b.href ? <Link href={b.href}>{inner}</Link> : inner}
      </section>
    )
  }

  function renderProductSlider(block: any) {
    const b = block?.props || {}
    const list = Array.isArray(b.productIds) && b.productIds.length
      ? products.filter((p: any) => b.productIds.includes(p._id)).slice(0, b.limit || 8)
      : products.slice(0, b.limit || 8)
    return (
      <section className="space-y-3">
        {b.title && <h2 className="text-lg font-semibold">{b.title}</h2>}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.map((p: any) => (
            <Link key={p._id} href={`/shop/${shop.slug}/products/${p.slug ?? p._id}`} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
              <div className="aspect-square bg-slate-100">
                <img src={p.mainImage || p.images?.[0] || '/product-placeholder.png'} alt={p.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-2">
                <div className="text-sm font-medium line-clamp-2">{p.title}</div>
                <div className="font-semibold mt-1" style={{ color: colors.primary }}>₹{Number(p.price || 0).toLocaleString()}</div>
              </div>
            </Link>
          ))}
          {list.length === 0 && <div className="text-sm text-slate-500">No products yet.</div>}
        </div>
      </section>
    )
  }

  function renderRichText(block: any) {
    const html = String(block?.props?.html || '')
    return (
      <section className="rounded-xl border bg-white p-4">
        <article className="prose max-w-none dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      </section>
    )
  }

  function renderFooter(block: any) {
    const b = block?.props || {}
    const links = Array.isArray(b.links) ? b.links : []
    return (
      <footer className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="text-slate-600">{b.copyright || `© ${new Date().getFullYear()} ${shop.name}`}</div>
          <nav className="flex items-center gap-4">
            {links.map((l: any, i: number) => (
              <Link key={i} href={l.href || '#'} className="hover:underline">{l.label}</Link>
            ))}
          </nav>
        </div>
      </footer>
    )
  }

  function renderBlock(block: any, idx: number) {
    switch (block?.type) {
      case 'Header': return <div key={block.id || idx}>{renderHeader(block)}</div>
      case 'Hero': return <div key={block.id || idx}>{renderHero(block)}</div>
      case 'Banner': return <div key={block.id || idx}>{renderBanner(block)}</div>
      case 'ProductSlider': return <div key={block.id || idx}>{renderProductSlider(block)}</div>
      case 'RichText': return <div key={block.id || idx}>{renderRichText(block)}</div>
      case 'Footer': return <div key={block.id || idx}>{renderFooter(block)}</div>
      default: return null
    }
  }

  if (!page && !blocks) return <div className="max-w-4xl mx-auto p-6">Page not found</div>

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{page?.title || params.handle}</h1>
      {blocks && blocks.length > 0 ? (
        <div className="space-y-4">
          {blocks.map((b: any, i: number) => renderBlock(b, i))}
        </div>
      ) : (
        <article className="prose max-w-none dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: String(page?.content || '') }} />
        </article>
      )}
    </div>
  )
}
