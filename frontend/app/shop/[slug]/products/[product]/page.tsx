import { redirect } from 'next/navigation'

async function resolveProductId(product: string): Promise<string | null> {
  // if looks like Mongo ObjectId, use directly
  if (/^[a-fA-F0-9]{24}$/.test(product)) return product
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE || ''
    const res = await fetch(`${base}/api/v1/products/slug/${encodeURIComponent(product)}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    const data = await res.json()
    return data?.product?._id || null
  } catch {
    return null
  }
}

async function shopOwnsProduct(shopSlug: string, productId: string): Promise<boolean> {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE || ''
    const shopRes = await fetch(`${base}/api/v1/shops/${encodeURIComponent(shopSlug)}`, { next: { revalidate: 60 } })
    if (!shopRes.ok) return true // if we can't verify, allow
    const shopData = await shopRes.json()
    const shopId = shopData?.shop?._id
    if (!shopId) return true
    const prodRes = await fetch(`${base}/api/v1/products/${encodeURIComponent(productId)}`, { next: { revalidate: 60 } })
    if (!prodRes.ok) return true
    const prodData = await prodRes.json()
    const prodShopId = prodData?.product?.shopId
    return String(prodShopId) === String(shopId)
  } catch {
    return true
  }
}

export default async function ShopProductBySlugPage({ params }: { params: { slug: string; product: string } }) {
  const id = await resolveProductId(params.product)
  if (!id) redirect('/_not-found')
  const ok = await shopOwnsProduct(params.slug, id)
  if (!ok) redirect('/_not-found')
  // Redirect to existing ID-based product page to render UI
  redirect(`/products/${id}`)
}
