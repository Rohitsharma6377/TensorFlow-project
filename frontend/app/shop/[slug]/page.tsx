import Link from 'next/link'

type Theme = {
  colors?: { primary?: string; accent?: string; background?: string; text?: string }
  sections?: {
    hero?: { enabled?: boolean; image?: string; heading?: string; subheading?: string; ctaText?: string; ctaHref?: string }
    featuredProducts?: { enabled?: boolean; ids?: string[] }
    grid?: { enabled?: boolean; columns?: 2 | 3 | 4; limit?: number }
  }
}

async function getShop(slug: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE || ''
  const res = await fetch(`${base}/api/v1/shops/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } })
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

export default async function ThemedShopPage({ params }: { params: { slug: string } }) {
  const shop = await getShop(params.slug)
  if (!shop) return <div className="max-w-6xl mx-auto p-6">Shop not found</div>

  const products = await getProducts(shop._id, 100)
  const theme: Theme = shop?.metadata?.theme || {}
  const builder = shop?.metadata?.builder || {}

  // Fallback colors
  const colors = {
    primary: theme.colors?.primary || shop?.metadata?.themeColor || '#10b981',
    accent: theme.colors?.accent || '#0ea5e9',
    background: theme.colors?.background || '#ffffff',
    text: theme.colors?.text || '#0f172a',
  }

  const hero = theme.sections?.hero ?? { enabled: false }
  const featured = theme.sections?.featuredProducts ?? { enabled: true, ids: [] }
  const grid = theme.sections?.grid ?? { enabled: true, columns: 4, limit: 12 }

  // Compute featured list
  const featuredList = (featured.ids && featured.ids.length)
    ? products.filter((p: any) => featured.ids!.includes(p._id)).slice(0, 8)
    : products.slice(0, 8)

  const gridList = products.slice(0, Math.max(1, grid.limit || 12))

  // ===== Builder renderer (if present) =====
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

  // If builder.home exists, render it
  const builderBlocks = Array.isArray(builder?.home?.blocks) ? builder.home.blocks : null

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8" style={{ color: colors.text }}>
      {builderBlocks && builderBlocks.length > 0 ? (
        <>
          {builderBlocks.map((b: any, i: number) => renderBlock(b, i))}
        </>
      ) : (
        <>
      {/* Header */}
      <div className="rounded-xl border bg-white p-4 sm:p-5">
        <div className="grid grid-cols-[72px_1fr] sm:grid-cols-[96px_1fr_auto] gap-4 items-start">
          {shop.logo?.url ? (
            <img src={shop.logo.url} alt="logo" className="h-18 w-18 sm:h-24 sm:w-24 rounded-md border object-cover" />
          ) : (
            <div className="h-18 w-18 sm:h-24 sm:w-24 rounded-md border bg-slate-100" />
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: colors.primary }}>{shop.name}</h1>
            {shop.description && <p className="text-slate-600 mt-1 text-sm sm:text-base">{shop.description}</p>}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs sm:text-sm text-slate-600">
              {!!(shop.categories && shop.categories.length) && (
                <span>Categories: {shop.categories.join(', ')}</span>
              )}
              <Link className="text-emerald-700 hover:underline" href={`/shop/${shop.slug}/about`}>About</Link>
            </div>
          </div>
          <div className="hidden sm:flex shrink-0 flex-col items-end gap-2">
            <Link href={`/chat?shop=${shop._id}${shop.owner?._id ? `&seller=${shop.owner._id}` : ''}`} className="inline-block">
              <button className="px-4 py-2 rounded-md border bg-white hover:bg-slate-50" style={{ borderColor: colors.primary, color: colors.primary }}>Chat</button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      {hero?.enabled && (
        <section className="rounded-xl overflow-hidden border" style={{ background: colors.background }}>
          {hero.image ? (
            <div className="relative">
              <img src={hero.image} alt="hero" className="w-full h-56 sm:h-72 object-cover" />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
                {hero.heading && <h2 className="text-2xl sm:text-3xl font-semibold">{hero.heading}</h2>}
                {hero.subheading && <p className="mt-2 max-w-2xl">{hero.subheading}</p>}
                {hero.ctaText && (
                  <Link href={hero.ctaHref || '#'} className="mt-4 inline-block">
                    <button className="px-5 py-2 rounded-md font-medium" style={{ background: colors.primary, color: '#fff' }}>{hero.ctaText}</button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              {hero.heading && <h2 className="text-2xl font-semibold" style={{ color: colors.primary }}>{hero.heading}</h2>}
              {hero.subheading && <p className="mt-2 text-slate-600">{hero.subheading}</p>}
            </div>
          )}
        </section>
      )}

      {/* Featured Products */}
      {featured?.enabled && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Top Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredList.map((p: any) => (
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
            {featuredList.length === 0 && <div className="text-sm text-slate-500">No products yet.</div>}
          </div>
        </section>
      )}

      {/* Grid */}
      {grid?.enabled && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">All Products</h2>
            <Link href={`/shop/${shop.slug}/products`} className="text-sm hover:underline" style={{ color: colors.primary }}>View all</Link>
          </div>
          <div className={`grid gap-4 grid-cols-2 ${grid.columns === 4 ? 'lg:grid-cols-4' : grid.columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
            {gridList.map((p: any) => (
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
            {gridList.length === 0 && <div className="text-sm text-slate-500">No products yet.</div>}
          </div>
        </section>
      )}
        </>
      )}
    </div>
  )

}
