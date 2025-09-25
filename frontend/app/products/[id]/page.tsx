"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchProduct } from '@/store/slice/productSlice'
import { addItem } from '@/store/slice/cartSlice'
import { addToWishlist, addLocal as addWishlistLocal } from '@/store/slice/wishlistSlice'
import { Button } from 'antd'

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

  // Gallery state
  const [activeIdx, setActiveIdx] = useState(0)
  const [hovering, setHovering] = useState(false)
  const slideTimer = useRef<NodeJS.Timeout | null>(null)

  // Variant state
  const [variantIndex, setVariantIndex] = useState<number | null>(null)

  useEffect(() => {
    dispatch(fetchProduct(params.id))
  }, [dispatch, params.id])

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
    const image = images[activeIdx]
    dispatch(addItem({ productId: current._id!, title: current.title, price, qty: 1, image }))
  }

  const onBuyNow = () => {
    onAddToCart()
    // Navigate to cart (adjust if you have a dedicated checkout page)
    if (typeof window !== 'undefined') window.location.href = '/cart'
  }

  const onWishlist = async () => {
    try {
      await dispatch(addToWishlist({ productId: params.id })).unwrap()
    } catch {
      dispatch(addWishlistLocal({ productId: params.id, title: current?.title || '' }))
    }
  }

  return (
    <div className="space-y-6">
      {status === 'loading' && <p className="text-slate-500">Loading...</p>}
      {current && (
        <div className="grid gap-8 lg:grid-cols-2">
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

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button type="primary" onClick={onAddToCart}>Add to Cart</Button>
              <Button onClick={onWishlist}>Wishlist</Button>
              <Button type="default" onClick={onBuyNow}>Buy Now</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
