"use client";

import React from "react";
import Link from "next/link";
import { useAppSelector } from "@/store";
import { mockShops } from "@/store/seed/shops";

export default function ShopsPage() {
  // Use existing state if available; fallback to seed
  const state: any = useAppSelector((s) => (s as any).shops);
  const items = state?.items as any[] | undefined;
  const status = state?.status as string | undefined;
  const shops = items && items.length > 0 ? items : mockShops;

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Shops</h1>
        <p className="text-sm text-muted-foreground">Discover featured shops and start following your favorites.</p>
      </div>

      {status === "loading" && (
        <div className="text-sm text-gray-500 mb-4">Loading shops...</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {shops.map((shop: any) => {
          const logo = typeof shop.logo === "object" ? shop.logo?.url : shop.logo || shop.avatar;
          return (
            <Link
              key={shop._id || shop.slug}
              href={`/shop/${shop.slug}`}
              className="group rounded-lg border bg-white/70 dark:bg-gray-900/60 backdrop-blur hover:shadow-md transition overflow-hidden"
            >
              <div className="p-3 flex items-center gap-3">
                <img
                  src={logo || "/shop-placeholder.png"}
                  alt={shop.name}
                  className="w-10 h-10 rounded-full object-cover"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{shop.name}</div>
                  {typeof shop.followers === "number" && (
                    <div className="text-xs text-muted-foreground">{shop.followers.toLocaleString()} followers</div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

