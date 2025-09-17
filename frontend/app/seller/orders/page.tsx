"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SellerOrdersPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-white border-emerald-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-emerald-900">Orders</CardTitle>
          <CardDescription className="text-emerald-700">View and manage shop orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-emerald-800">Orders list coming soon.</div>
        </CardContent>
      </Card>
    </div>
  );
}
