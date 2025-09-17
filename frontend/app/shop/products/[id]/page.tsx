"use client";
import React, { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchProduct, updateProduct } from '@/store/slice/productSlice'
import { Button, Form, Input, InputNumber, message } from 'antd'

export default function ShopProductDetailPage({ params }: { params: { id: string } }) {
  const dispatch = useAppDispatch()
  const { current, status } = useAppSelector(s => s.products)
  const [form] = Form.useForm()

  useEffect(() => {
    dispatch(fetchProduct(params.id)).unwrap().then((p) => {
      form.setFieldsValue({
        title: p.title,
        price: p.price,
        stock: p.stock ?? 0,
        images: (p.images || []).join(', '),
        sku: p.sku,
        description: p.description,
      })
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, params.id])

  const onSave = async () => {
    try {
      const values = await form.validateFields()
      await dispatch(updateProduct({
        id: params.id,
        payload: {
          title: values.title,
          price: Number(values.price),
          stock: Number(values.stock || 0),
          images: values.images ? String(values.images).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          sku: values.sku,
          description: values.description,
        }
      })).unwrap()
      message.success('Saved')
    } catch (e: any) {
      if (!e?.errorFields) message.error(e?.message || 'Save failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage Product #{params.id}</h1>
        <Button type="primary" onClick={onSave} loading={status === 'loading'}>Save</Button>
      </div>
      <Form layout="vertical" form={form}>
        <Form.Item name="title" label="Title" rules={[{ required: true, min: 2 }]}>
          <Input placeholder="Product title" />
        </Form.Item>
        <Form.Item name="price" label="Price" rules={[{ required: true, type: 'number', min: 0.01 }]}>
          <InputNumber className="w-full" placeholder="0.00" />
        </Form.Item>
        <Form.Item name="stock" label="Stock" rules={[{ type: 'number', min: 0 }]}>
          <InputNumber className="w-full" placeholder="0" />
        </Form.Item>
        <Form.Item name="sku" label="SKU">
          <Input placeholder="SKU" />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={4} placeholder="Description" />
        </Form.Item>
        <Form.Item name="images" label="Images (comma separated URLs)">
          <Input placeholder="https://... , https://..." />
        </Form.Item>
      </Form>
    </div>
  )
}
