"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SellerSubscriptionPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-white border-emerald-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-emerald-900">Subscription</CardTitle>
          <CardDescription className="text-emerald-700">Manage your plan and billing</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Upgrade Plan</Button>
          <Button variant="outline" className="border-emerald-200 text-emerald-800 hover:bg-emerald-50">View Invoices</Button>
        </CardContent>
      </Card>
    </div>
  );
}
