"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SellerProfilePage() {
  return (
    <div className="space-y-6">
      <Card className="bg-white border-emerald-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-emerald-900">Profile</CardTitle>
          <CardDescription className="text-emerald-700">Update your seller profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input placeholder="Your name" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input placeholder="Phone" />
            </div>
            <div className="md:col-span-2">
              <Label>Bio</Label>
              <Input placeholder="Short bio" />
            </div>
            <div className="md:col-span-2">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
