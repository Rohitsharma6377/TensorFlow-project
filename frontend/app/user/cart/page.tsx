"use client";
import React, { useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { Button, InputNumber, Table } from 'antd'
import { removeItem, updateQty } from '@/store/slice/cartSlice'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const { items } = useAppSelector(s => s.cart)
  const dispatch = useAppDispatch()
  const router = useRouter()

  const columns = [
    { title: 'Product', dataIndex: 'title', key: 'title' },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (v: number) => `₹${v}` },
    { title: 'Qty', dataIndex: 'qty', key: 'qty', render: (_: any, r: any) => (
      <InputNumber min={1} value={r.qty} onChange={(val) => dispatch(updateQty({ productId: r.productId, qty: Number(val || 1) }))} />
    )},
    { title: 'Subtotal', key: 'subtotal', render: (_: any, r: any) => `₹${(r.qty * r.price).toFixed(2)}` },
    { title: 'Actions', key: 'actions', render: (_: any, r: any) => (
      <Button danger size="small" onClick={() => dispatch(removeItem(r.productId))}>Remove</Button>
    )},
  ]

  const total = useMemo(() => items.reduce((sum, i) => sum + i.qty * i.price, 0), [items])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Cart</h1>
      <Table rowKey="productId" dataSource={items} columns={columns as any} pagination={false} />
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Total: ₹{total.toFixed(2)}</div>
        <Button type="primary" disabled={!items.length} onClick={() => router.push('/checkout')}>Checkout</Button>
      </div>
    </div>
  )
}
