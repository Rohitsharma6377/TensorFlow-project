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
import { ShopsAPI, SocialAPI } from '@/lib/api'
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
        text: `Hi! I'm interested in this product: /products/${current._id}`,
        image: (current.mainImage || (Array.isArray(current.images) && current.images[0])) || undefined,
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('chatPrefill', JSON.stringify(prefill))
      }
      const url = `/chat?seller=${encodeURIComponent(ownerId)}&shop=${encodeURIComponent(shopSlug)}&product=${encodeURIComponent(current._id!)}`
      if (typeof window !== 'undefined') window.location.href = url
    } catch {}
  }

  return (
    <div className="space-y-6">
      {status === 'loading' && <p className="text-slate-500">Loading...</p>}
      {current && (
        <div className="px-2.5 grid gap-8 lg:grid-cols-2">
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
          <div className="space-y-5">
            <h1 className="text-3xl font-bold">{current.title}</h1>
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
                  <Link href={`/shops/${shopCard.slug}`} className="text-sm text-emerald-700 hover:underline">View</Link>
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

      {/* Removed sticky mobile action bar to avoid duplicate Add/Chat/Buy buttons */}
    </div>
  )
}
