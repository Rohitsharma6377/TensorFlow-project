"use client";
import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button, Form, Input, InputNumber, Modal, Table, message } from 'antd'
import { useAppDispatch, useAppSelector } from '@/store'
import { createProduct, deleteProduct, fetchProducts } from '@/store/slice/productSlice'

export default function ShopProductsPage() {
  const dispatch = useAppDispatch()
  const { items, status } = useAppSelector((s) => s.products)
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    // Optionally pass shopId to filter products per shop if available
    dispatch(fetchProducts(undefined))
  }, [dispatch])

  const columns = useMemo(
    () => [
      { title: 'Title', dataIndex: 'title', key: 'title', render: (t: string, r: any) => (<Link href={`/products/${r._id}`}>{t}</Link>) },
      { title: 'Price', dataIndex: 'price', key: 'price' },
      { title: 'Stock', dataIndex: 'stock', key: 'stock' },
      { title: 'Status', dataIndex: 'status', key: 'status' },
      {
        title: 'Actions', key: 'actions', render: (_: any, r: any) => (
          <div className="flex gap-2">
            <Link href={`/shop/products/${r._id}`} className="text-blue-600">Edit</Link>
            <Button danger size="small" onClick={async () => {
              try {
                await dispatch(deleteProduct(r._id)).unwrap()
                message.success('Deleted')
              } catch (e: any) {
                message.error(e?.message || 'Delete failed')
              }
            }}>Delete</Button>
          </div>
        )
      },
    ],
    [dispatch]
  )

  const onCreate = async () => {
    try {
      const values = await form.validateFields()
      setCreating(true)
      await dispatch(createProduct({
        shopId: values.shopId,
        title: values.title,
        price: Number(values.price),
        stock: Number(values.stock || 0),
        images: values.images ? String(values.images).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        status: 'active',
      })).unwrap()
      setOpen(false)
      form.resetFields()
      message.success('Product created')
      dispatch(fetchProducts(undefined))
    } catch (e: any) {
      if (!e?.errorFields) message.error(e?.message || 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Button type="primary" onClick={() => setOpen(true)}>New Product</Button>
      </div>
      <Table
        rowKey="_id"
        dataSource={items}
        columns={columns as any}
        loading={status === 'loading'}
      />

      <Modal
        title="Create Product"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onCreate}
        confirmLoading={creating}
        okText="Create"
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="shopId" label="Shop ID" rules={[{ required: true, message: 'Enter your shopId' }]}>
            <Input placeholder="shop id" />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true, min: 2 }]}>
            <Input placeholder="Product title" />
          </Form.Item>
          <Form.Item name="price" label="Price" rules={[{ required: true, type: 'number', min: 0.01 }]}>
            <InputNumber className="w-full" placeholder="0.00" />
          </Form.Item>
          <Form.Item name="stock" label="Stock" rules={[{ type: 'number', min: 0 }]}>
            <InputNumber className="w-full" placeholder="0" />
          </Form.Item>
          <Form.Item name="images" label="Images (comma separated URLs)">
            <Input placeholder="https://... , https://..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
