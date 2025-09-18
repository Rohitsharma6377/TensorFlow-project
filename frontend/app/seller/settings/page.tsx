"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SellerSettingsPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-white border-emerald-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-emerald-900">Settings</CardTitle>
          <CardDescription className="text-emerald-700">Configure your seller preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-emerald-900">Enable notifications</Label>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-emerald-900">Show profile publicly</Label>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
