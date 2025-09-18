"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SellerShopProfilePage() {
  return (
    <div className="space-y-6">
      <Card className="bg-white border-emerald-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-emerald-900">Shop Profile</CardTitle>
          <CardDescription className="text-emerald-700">Manage your shop details</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Shop Name</Label>
              <Input placeholder="Your shop name" />
            </div>
            <div>
              <Label>Tagline</Label>
              <Input placeholder="Short tagline" />
            </div>
            <div className="md:col-span-2">
              <Label>Address</Label>
              <Input placeholder="Full address" />
            </div>
            <div className="md:col-span-2">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
