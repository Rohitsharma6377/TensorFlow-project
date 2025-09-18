"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SellerPostsPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-white border-emerald-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-emerald-900">Posts</CardTitle>
          <CardDescription className="text-emerald-700">Create and manage your social posts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">New Post</Button>
            <Button variant="outline" className="border-emerald-200 text-emerald-800 hover:bg-emerald-50">Drafts</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
