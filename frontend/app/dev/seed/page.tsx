"use client";

import React, { useState } from "react";
import { useAppDispatch } from "@/store";
import { seedShops } from "@/store/slice/shopsSlice";
import { seedProducts } from "@/store/slice/productSlice";
import { seedStories } from "@/store/slice/storySlice";
import { seedNotifications } from "@/store/slice/notificationSlice";
import { mockShops } from "@/store/seed/shops";
import { mockProducts } from "@/store/seed/products";
import { mockStories } from "@/store/seed/stories";
import { mockNotifications } from "@/store/seed/notifications";
import Link from "next/link";
import { api } from "@/lib/api";

export default function SeedPage() {
  const dispatch = useAppDispatch();
  const [dbSeeding, setDbSeeding] = useState(false);
  const [dbSeedMsg, setDbSeedMsg] = useState<string | null>(null);
  const [dbSeedErr, setDbSeedErr] = useState<string | null>(null);

  const seedAll = () => {
    dispatch(seedShops(mockShops));
    dispatch(seedProducts(mockProducts as any));
    dispatch(seedStories(mockStories as any));
    dispatch(seedNotifications(mockNotifications));
  };

  const seedDatabase = async () => {
    setDbSeeding(true);
    setDbSeedMsg(null);
    setDbSeedErr(null);
    try {
      const res = await api<{ success: boolean; message?: string; stdout?: string }>("/api/v1/dev/seed", { method: "POST" });
      if (res?.success) {
        setDbSeedMsg(res.message || "Seed complete");
      } else {
        setDbSeedErr(res?.message || "Failed to seed");
      }
    } catch (e: any) {
      setDbSeedErr(e?.message || "Failed to trigger seed");
    } finally {
      setDbSeeding(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Developer: Seed Demo Data</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Use these buttons to inject demo data into the Redux store for quick UI testing. This does not persist on the backend.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          className="px-4 py-2 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
          onClick={seedAll}
        >
          Seed All
        </button>
        <button className="px-4 py-2 rounded-md bg-blue-600 text-white" onClick={() => dispatch(seedShops(mockShops))}>
          Seed Shops
        </button>
        <button className="px-4 py-2 rounded-md bg-emerald-600 text-white" onClick={() => dispatch(seedProducts(mockProducts as any))}>
          Seed Products
        </button>
        <button className="px-4 py-2 rounded-md bg-violet-600 text-white" onClick={() => dispatch(seedStories(mockStories as any))}>
          Seed Stories
        </button>
        <button className="px-4 py-2 rounded-md bg-rose-600 text-white" onClick={() => dispatch(seedNotifications(mockNotifications))}>
          Seed Notifications
        </button>
        <button
          className="px-4 py-2 rounded-md bg-amber-600 text-white"
          onClick={seedDatabase}
          title="Run backend DB seed script (DEV only)"
          disabled={dbSeeding}
        >
          {dbSeeding ? "Seeding Database..." : "Seed Database (backend)"}
        </button>
      </div>

      <div className="mt-8 text-sm text-muted-foreground">
        {(dbSeedMsg || dbSeedErr) && (
          <div className={`mb-3 text-sm ${dbSeedErr ? 'text-red-600' : 'text-emerald-700'}`}>
            {dbSeedErr || dbSeedMsg}
          </div>
        )}
        <p>
          After seeding, try opening the notifications panel from the navbar bell, or visit your seeded shops/products/stories via the app UI.
        </p>
        <p className="mt-2">
          Back to <Link className="underline" href="/">home</Link>
        </p>
      </div>
    </div>
  );
}


