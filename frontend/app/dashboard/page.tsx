"use client";
import Protected from '@/components/auth/Protected'
import { Card, Tabs } from 'antd'

export default function DashboardPage() {
  return (
    <Protected roles={['seller','admin','superadmin']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Seller Dashboard</h1>
        <Tabs
          defaultActiveKey="products"
          items={[
            { key: 'products', label: 'Products', children: <Card>Products table coming soon…</Card> },
            { key: 'orders', label: 'Orders', children: <Card>Orders table coming soon…</Card> },
            { key: 'posts', label: 'Posts', children: <Card>Posts management coming soon…</Card> },
            { key: 'payouts', label: 'Payouts', children: <Card>Payouts summary coming soon…</Card> },
          ]}
        />
      </div>
    </Protected>
  )
}
