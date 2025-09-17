"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SellerPaymentsPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-white border-emerald-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-emerald-900">Payments</CardTitle>
          <CardDescription className="text-emerald-700">Incoming payments and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-emerald-800">Payments and settlements UI coming soon.</div>
        </CardContent>
      </Card>
    </div>
  );
}
