"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SellerDashboardPage() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-white border-emerald-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-emerald-900">Orders</CardTitle>
            <CardDescription className="text-emerald-700">Recent orders summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-emerald-900">0</div>
            <div className="mt-4">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => router.push('/seller/orders')}>
                View Orders
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-emerald-900">Products</CardTitle>
            <CardDescription className="text-emerald-700">Your catalog status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-emerald-900">0</div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="border-emerald-200 text-emerald-800 hover:bg-emerald-50" onClick={() => router.push('/seller/products')}>
                Manage
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => router.push('/seller/products/new')}>
                Add Product
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-emerald-900">Revenue</CardTitle>
            <CardDescription className="text-emerald-700">This month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-emerald-900">₹0</div>
            <div className="mt-4">
              <Button variant="outline" className="border-emerald-200 text-emerald-800 hover:bg-emerald-50" onClick={() => router.push('/seller/payouts')}>
                View Payouts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-emerald-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-emerald-900">Your Shop</CardTitle>
          <CardDescription className="text-emerald-700">Manage your shop profile and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => router.push('/seller/shopprofie')}>
            Open Shop Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
