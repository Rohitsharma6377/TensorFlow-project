"use client";
import React, { useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { Button, Form, Input, Radio, message } from 'antd'
import { clear } from '@/store/slice/cartSlice'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const { items } = useAppSelector(s => s.cart)
  const dispatch = useAppDispatch()
  const [form] = Form.useForm()
  const router = useRouter()

  const total = useMemo(() => items.reduce((sum, i) => sum + i.qty * i.price, 0), [items])

  const onPlaceOrder = async () => {
    try {
      await form.validateFields()
      // Here we would call backend order API; for now simulate success
      dispatch(clear())
      message.success('Order placed!')
      router.replace('/orders')
    } catch (e) {
      // validation errors auto shown
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <Form layout="vertical" form={form}>
            <Form.Item name="fullname" label="Full Name" rules={[{ required: true }]}>
              <Input placeholder="Your name" />
            </Form.Item>
            <Form.Item name="address" label="Address" rules={[{ required: true, min: 6 }]}>
              <Input.TextArea rows={3} placeholder="Street, City, State" />
            </Form.Item>
            <Form.Item name="pincode" label="Pincode" rules={[{ required: true, len: 6 }]}>
              <Input placeholder="000000" />
            </Form.Item>
            <Form.Item name="payment" label="Payment Method" rules={[{ required: true }]}> 
              <Radio.Group>
                <Radio value="cod">Cash on Delivery</Radio>
                <Radio value="card">Card</Radio>
              </Radio.Group>
            </Form.Item>
            <Button type="primary" onClick={onPlaceOrder} disabled={!items.length}>Place Order</Button>
          </Form>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-2 text-lg font-semibold">Summary</div>
          <div className="text-slate-700">Items: {items.length}</div>
          <div className="text-slate-700">Total: ₹{total.toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}
