"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SellerAnalyticsPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-white border-emerald-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-emerald-900">Analytics</CardTitle>
          <CardDescription className="text-emerald-700">Traffic, sales, and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-emerald-800">Analytics dashboard coming soon.</div>
        </CardContent>
      </Card>
    </div>
  );
}
