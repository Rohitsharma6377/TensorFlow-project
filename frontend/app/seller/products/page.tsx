"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SellerProductsPage() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <Card className="bg-white border-emerald-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-emerald-900">Products</CardTitle>
          <CardDescription className="text-emerald-700">Manage your product catalog</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-emerald-800">Start adding products to your shop.</p>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => router.push('/seller/products/new')}>
              Add Product
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
