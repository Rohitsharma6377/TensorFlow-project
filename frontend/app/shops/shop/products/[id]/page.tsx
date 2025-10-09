"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchProduct } from '@/store/slice/productSlice'
import { addItem, removeItem } from '@/store/slice/cartSlice'
import { addToWishlist, addLocal as addWishlistLocal, remove as removeWishlist } from '@/store/slice/wishlistSlice'
import { Button, message } from 'antd'
import ChatBubbleOutlineRounded from '@mui/icons-material/ChatBubbleOutlineRounded'
import FavoriteBorderRounded from '@mui/icons-material/FavoriteBorderRounded'
import FavoriteRounded from '@mui/icons-material/FavoriteRounded'
import ShoppingCartRounded from '@mui/icons-material/ShoppingCartRounded'
import BoltRounded from '@mui/icons-material/BoltRounded'
import { ShopsAPI, SocialAPI, SearchAPI } from '@/lib/api'
import Link from 'next/link'

type Variant = {
  price?: number;
  mrp?: number;
  images?: string[];
  mainImage?: string;
  attributes?: Record<string, any>;
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const dispatch = useAppDispatch()
  const { current, status } = useAppSelector(s => s.products)
  const cartItems = useAppSelector(s => s.cart.items)
  const wishlistItems = useAppSelector(s => s.wishlist.items)

  // Gallery state
  const [activeIdx, setActiveIdx] = useState(0)
  const [hovering, setHovering] = useState(false)
  const slideTimer = useRef<NodeJS.Timeout | null>(null)

  // Variant state
  const [variantIndex, setVariantIndex] = useState<number | null>(null)
  const [shopCard, setShopCard] = useState<{ _id: string; name: string; slug: string; logo?: { url?: string }; owner: string } | null>(null)
  const [inWishlist, setInWishlist] = useState(false)
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null)
  const [related, setRelated] = useState<any[]>([])
  const [loadingRelated, setLoadingRelated] = useState(false)
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const scrollByAmount = 320
  const scrollLeft = () => { try { sliderRef.current?.scrollBy({ left: -scrollByAmount, behavior: 'smooth' }) } catch {}
  }
  const scrollRight = () => { try { sliderRef.current?.scrollBy({ left: scrollByAmount, behavior: 'smooth' }) } catch {}
  }

  useEffect(() => {
    dispatch(fetchProduct(params.id))
  }, [dispatch, params.id])

  // Load shop info for card (name/logo/slug) once product is available
  useEffect(() => {
    (async () => {
      try {
        const sid = (current as any)?.shopId
        if (!sid) return
        const r = await ShopsAPI.bulk([String(sid)])
        const s = r?.shops?.[0] || null
        setShopCard(s)
        try {
          const f = await SocialAPI.following()
          const ids = new Set<string>((f?.shops || []).map(String))
          setIsFollowing(ids.has(String(s?._id)))
        } catch { setIsFollowing(null) }
      } catch {}
    })()
  }, [current])

  // Load more products from the same shop
  useEffect(() => {
    (async () => {
      try {
        const sid = (current as any)?.shopId
        if (!sid) return
        setLoadingRelated(true)
        const res = await SearchAPI.products({ shopId: String(sid), limit: 12 })
        const items = (res as any)?.products || []
        const filtered = items.filter((p: any) => String(p._id) !== String(current?._id))
        setRelated(filtered)
      } catch {
        setRelated([])
      } finally {
        setLoadingRelated(false)
      }
    })()
  }, [current?._id])

  // Reflect wishlist state from Redux when switching products
  useEffect(() => {
    const pid = String(current?._id || '')
    const present = !!wishlistItems.find?.((i:any)=>String(i.productId)===pid)
    setInWishlist(present)
  }, [current?._id, wishlistItems])

  // Build image array from selected variant or base product
  const images: string[] = useMemo(() => {
    if (!current) return []
    const v = (variantIndex !== null && Array.isArray(current.variants)) ? current.variants[variantIndex as number] as Variant : undefined
    const varImages = v?.images && v.images.length ? v.images : []
    const base = current.images || []
    const main = (v?.mainImage || current.mainImage) ? [v?.mainImage || current.mainImage].filter(Boolean) as string[] : []
    const combined = [...new Set([...(main as string[]), ...varImages, ...base])]
    return combined.length ? combined : ['https://via.placeholder.com/800x800?text=Product']
  }, [current, variantIndex])

  // Auto-advance slideshow
  useEffect(() => {
    if (!images.length || hovering) return
    slideTimer.current && clearInterval(slideTimer.current)
    slideTimer.current = setInterval(() => {
      setActiveIdx((idx) => (idx + 1) % images.length)
    }, 3000)
    return () => { if (slideTimer.current) clearInterval(slideTimer.current) }
  }, [images.length, hovering])

  useEffect(() => { setActiveIdx(0) }, [variantIndex])

  const basePrice = current?.price || 0
  const baseMrp = (current as any)?.mrp || undefined
  const vObj: Variant | undefined = useMemo(() => {
    return (variantIndex !== null && current?.variants && current.variants[variantIndex as number]) ? (current.variants[variantIndex as number] as any as Variant) : undefined
  }, [variantIndex, current])
  const price = vObj?.price ?? basePrice
  const mrp = vObj?.mrp ?? baseMrp
  const hasDiscount = mrp && mrp > price
  const discountPct = hasDiscount ? Math.round(((mrp! - price) / mrp!) * 100) : 0

  const onAddToCart = () => {
    if (!current) return
    // If product has variants, require selection first
    if (Array.isArray(current.variants) && current.variants.length > 0 && variantIndex === null) {
      message.warning('Please select a variant');
      return;
    }
    const image = images[activeIdx]
    dispatch(addItem({ productId: current._id!, title: current.title, price, qty: 1, image }))
    message.success('Added to cart')
  }

  const onRemoveFromCart = () => {
    if (!current) return
    dispatch(removeItem(current._id!))
    message.info('Removed from cart')
  }

  const onFollowToggle = async () => {
    if (!shopCard?._id) return
    try {
      if (isFollowing) {
        await SocialAPI.unfollow(shopCard._id)
        setIsFollowing(false)
      } else {
        await SocialAPI.follow(shopCard._id)
        setIsFollowing(true)
      }
    } catch {}
  }

  const onBuyNow = () => {
    onAddToCart()
    // Navigate to cart (adjust if you have a dedicated checkout page)
    if (typeof window !== 'undefined') window.location.href = '/cart'
  }

  const onWishlistToggle = async () => {
    if (!current) return
    const pid = String(current._id)
    if (inWishlist) {
      dispatch(removeWishlist(pid))
      setInWishlist(false)
      message.info('Removed from wishlist')
      return
    }
    try {
      await dispatch(addToWishlist({ productId: pid })).unwrap()
      setInWishlist(true)
      message.success('Added to wishlist')
    } catch {
      dispatch(addWishlistLocal({ productId: pid, title: current?.title || '' }))
      setInWishlist(true)
      message.success('Added to wishlist')
    }
  }

  const onChatWithShop = async () => {
    try {
      if (!current) return
      // Add to cart before opening chat (so the item is saved for the user)
      onAddToCart()
      // Resolve shop owner and slug from product.shopId using bulk
      const resp = await ShopsAPI.bulk([String((current as any).shopId)])
      const info = resp?.shops?.[0]
      if (!info?.owner) return
      const ownerId = String(info.owner)
      const shopSlug = info.slug

      // Prefill message payload stored so Chat page can auto-send once
      const prefill = {
        productId: current._id,
        // Use the canonical route used by this app for single product pages
        text: `Hi! I'm interested in this product: /shops/shop/products/${current._id}`,
        // Do not attach image; chat will render a product card from the link
      } as any
      if (typeof window !== 'undefined') {
        localStorage.setItem('chatPrefill', JSON.stringify(prefill))
      }
      const url = `/chat?seller=${encodeURIComponent(ownerId)}&shop=${encodeURIComponent(shopSlug)}&product=${encodeURIComponent(current._id!)}`
      if (typeof window !== 'undefined') window.location.href = url
    } catch {}
  }

  return (
    <div className="space-y-8">
      {status === 'loading' && <p className="text-slate-500">Loading...</p>}
      {current && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 grid gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <div className="space-y-3">
            <div
              className="relative aspect-square w-full overflow-hidden rounded-xl border bg-white dark:bg-gray-900"
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[activeIdx]} alt={current.title} className="h-full w-full object-contain" />
              {hasDiscount && (
                <div className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded">{discountPct}% OFF</div>
              )}
            </div>
            {/* Thumbnails */}
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {images.map((src, i) => (
                <button
                  key={i}
                  className={`aspect-square rounded-lg overflow-hidden border ${i === activeIdx ? 'ring-2 ring-emerald-500' : 'hover:opacity-80'}`}
                  onClick={() => setActiveIdx(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`thumb-${i}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-5 lg:sticky lg:top-20 self-start">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold">{current.title}</h1>
              {shopCard?.slug && (
                <Link href={`/shop/${shopCard.slug}`} className="text-sm text-emerald-700 hover:underline whitespace-nowrap">Back to shop</Link>
              )}
            </div>
            {current.description && <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: current.description }} />}

            {/* Variant selector */}
            {Array.isArray(current.variants) && current.variants.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-slate-700">Select variant</div>
                <div className="flex flex-wrap gap-2">
                  {current.variants.map((v: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setVariantIndex(idx)}
                      className={`px-3 py-1 rounded-full border text-sm ${variantIndex === idx ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : 'border-slate-300 hover:border-emerald-300'}`}
                    >
                      {v.sku || v.attributes?.name || `Variant ${idx + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-emerald-700">₹{price.toLocaleString()}</div>
              {hasDiscount && (
                <>
                  <div className="text-lg line-through text-slate-500">₹{mrp!.toLocaleString()}</div>
                  <div className="text-sm font-semibold text-rose-500">Save ₹{(mrp! - price).toLocaleString()}</div>
                </>
              )}
            </div>

            {/* Shop card */}
            {shopCard && (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm px-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-sky-100 overflow-hidden flex items-center justify-center">
                    {shopCard.logo && (shopCard.logo as any).url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={(shopCard.logo as any).url} alt="shop" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sky-700 text-sm">{shopCard.name?.[0] || 'S'}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{shopCard.name}</div>
                    <div className="text-xs text-slate-500 truncate">@{shopCard.slug}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/shop/${shopCard.slug}`} className="text-sm text-emerald-700 hover:underline">View</Link>
                  {isFollowing === false && (
                    <Button onClick={onFollowToggle}>Follow</Button>
                  )}
                  {isFollowing === true && (
                    <span className="text-xs text-emerald-600"> </span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {(() => {
                const inCart = cartItems.some((it: any) => String(it.productId) === String(current?._id))
                return inCart ? (
                  <Button danger onClick={onRemoveFromCart} icon={<ShoppingCartRounded fontSize="small" />}>Remove from Cart</Button>
                ) : (
                  <Button type="primary" onClick={onAddToCart} icon={<ShoppingCartRounded fontSize="small" />}>Add to Cart</Button>
                )
              })()}

              <Button onClick={onWishlistToggle} shape="circle" aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'} icon={inWishlist ? <FavoriteRounded fontSize="small" className="text-sky-600"/> : <FavoriteBorderRounded fontSize="small" /> } />
              <Button type="default" onClick={onBuyNow} icon={<BoltRounded fontSize="small" />}>Buy Now</Button>
              <Button onClick={onChatWithShop} icon={<ChatBubbleOutlineRounded fontSize="small" />}>
                Chat with Shop
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* More from this shop */}
      {shopCard && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg sm:text-xl font-semibold">More from {shopCard.name}</h2>
            <Link href={`/shop/${shopCard.slug}`} className="text-sm text-emerald-700 hover:underline">View all</Link>
          </div>
          {loadingRelated && <div className="text-slate-500 text-sm">Loading more products…</div>}
          {!loadingRelated && (
            <div className="relative">
              {/* Controls */}
              <button onClick={scrollLeft} aria-label="Previous" className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full border bg-white/90 shadow hover:bg-white">
                ‹
              </button>
              <button onClick={scrollRight} aria-label="Next" className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full border bg-white/90 shadow hover:bg-white">
                ›
              </button>
              {/* Track */}
              <div ref={sliderRef} className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth pr-2">
                {related.map((p:any) => (
                  <Link
                    key={p._id}
                    href={`/shops/shop/products/${p._id}`}
                    className="group border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow min-w-[160px] sm:min-w-[200px] md:min-w-[220px]"
                  >
                    <div className="aspect-square bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.mainImage || (p.images?.[0]) || '/product-placeholder.png'} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2">
                      <div className="text-xs sm:text-sm font-medium line-clamp-2">{p.title}</div>
                      {typeof p.price === 'number' && (
                        <div className="text-emerald-700 font-semibold mt-1 text-sm">₹{Number(p.price).toLocaleString()}</div>
                      )}
                    </div>
                  </Link>
                ))}
                {related.length === 0 && !loadingRelated && (
                  <div className="text-sm text-slate-500">No other products yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
