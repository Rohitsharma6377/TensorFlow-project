"use client";
import React, { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchProduct } from '@/store/slice/productSlice'
import { addItem } from '@/store/slice/cartSlice'
import { addToWishlist, addLocal as addWishlistLocal } from '@/store/slice/wishlistSlice'
import { Button } from 'antd'

export default function ProductPage({ params }: { params: { id: string } }) {
  const dispatch = useAppDispatch()
  const { current, status } = useAppSelector(s => s.products)

  useEffect(() => {
    dispatch(fetchProduct(params.id))
  }, [dispatch, params.id])

  const onAddToCart = () => {
    if (!current) return
    dispatch(addItem({ productId: current._id!, title: current.title, price: current.price, qty: 1, image: current.images?.[0] }))
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
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.images?.[0] || 'https://via.placeholder.com/600x400?text=Product'} alt={current.title} className="w-full rounded border object-cover" />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold">{current.title}</h1>
            <p className="text-slate-700">{current.description}</p>
            <div className="text-xl font-bold">₹{current.price}</div>
            <div className="flex gap-3">
              <Button type="primary" onClick={onAddToCart}>Add to Cart</Button>
              <Button onClick={onWishlist}>Wishlist</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
