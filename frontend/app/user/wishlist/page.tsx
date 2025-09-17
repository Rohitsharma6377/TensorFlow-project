"use client";
import React from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { Button, Table } from 'antd'
import { remove as removeWish } from '@/store/slice/wishlistSlice'
import { addItem } from '@/store/slice/cartSlice'

export default function WishlistPage() {
  const { items } = useAppSelector(s => s.wishlist)
  const dispatch = useAppDispatch()

  const columns = [
    { title: 'Product', dataIndex: 'title', key: 'title', render: (t: string, r: any) => t || r.productId },
    { title: 'Actions', key: 'actions', render: (_: any, r: any) => (
      <div className="flex gap-2">
        <Button type="primary" size="small" onClick={() => dispatch(addItem({ productId: r.productId, title: r.title || 'Item', price: r.price || 0, qty: 1 }))}>Move to Cart</Button>
        <Button danger size="small" onClick={() => dispatch(removeWish(r.productId))}>Remove</Button>
      </div>
    )}
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Wishlist</h1>
      <Table rowKey="productId" dataSource={items} columns={columns as any} pagination={false} />
    </div>
  )
}
