"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SellerWalletPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-white border-emerald-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-emerald-900">Wallet</CardTitle>
          <CardDescription className="text-emerald-700">Track your balance and payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold text-emerald-900">₹0</div>
        </CardContent>
      </Card>
    </div>
  );
}
