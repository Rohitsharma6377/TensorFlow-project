"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { KpiGrid } from "../components/KpiGrid";
import { StatCard } from "../components/StatCard";
import { Section } from "../components/Section";
import { DataTable } from "../components/DataTable";
import { AdminAPI } from "@/lib/api";

export default function SuperAdminDashboardPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        // Try analytics summary; if not found, silently fallback to empty
        try {
          const s = await AdminAPI.analytics.summary();
          setSummary((s as any).summary || {});
        } catch (e: any) {
          const msg = String(e?.message || '').toLowerCase();
          if (!msg.includes('not found') && !msg.includes('404')) {
            throw e;
          }
          setSummary({});
        }
        // Timeseries is optional; ignore failures
        try {
          const t = await AdminAPI.analytics.timeseries({ range: '30d' });
          setSeries((t as any).series || []);
        } catch {}
        // Derive totals for users/shops/customers if not present in summary
        try {
          const [uTotalRes, sTotalRes, cTotalRes] = await Promise.all([
            AdminAPI.users.list({ page: 1, limit: 1 }),
            AdminAPI.shops.list({ page: 1, limit: 1 }),
            AdminAPI.users.list({ page: 1, limit: 1, role: 'user' as any }),
          ]);
          setSummary((prev: any) => ({
            ...(prev || {}),
            totalUsers: (uTotalRes as any)?.total ?? (prev?.totalUsers ?? 0),
            totalShops: (sTotalRes as any)?.total ?? (prev?.totalShops ?? 0),
            totalCustomers: (cTotalRes as any)?.total ?? (prev?.totalCustomers ?? 0),
          }));
        } catch {}
        // Recent orders for table
        try {
          const o = await AdminAPI.orders.list({ page: 1, limit: 5 });
          setRecentOrders((o as any).orders || []);
        } catch {}
      } catch (e: any) {
        setError(e?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const ordersColumns = [
    { key: 'id', header: 'Order' },
    { key: 'shop', header: 'Shop' },
    { key: 'amount', header: 'Amount' },
    { key: 'status', header: 'Status' },
  ] as const;

  // recentOrders is loaded above

  return (
    <div className="space-y-4">
      <PageHeader title="Super Admin Dashboard" subtitle="Global KPIs, revenue, users and shops" />

      {loading && (<div className="text-sm text-slate-600 dark:text-slate-400">Loading KPIs…</div>)}
      {error && !String(error).toLowerCase().includes('not found') && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      {!loading && (
        <KpiGrid>
          <StatCard label="Total Revenue" value={(summary?.revenueTotalFormatted || summary?.revenueTotal || '—')} hint="This month" trend={{ value: summary?.revenueTrend ?? '', positive: (summary?.revenueTrend || '').startsWith('+') }} />
          <StatCard label="Active Users" value={summary?.activeUsers ?? '—'} hint="Last 7 days" trend={{ value: summary?.usersTrend ?? '', positive: (summary?.usersTrend || '').startsWith('+') }} />
          <StatCard label="Active Shops" value={summary?.activeShops ?? '—'} hint="Onboarded" trend={{ value: summary?.shopsTrend ?? '', positive: (summary?.shopsTrend || '').startsWith('+') }} />
          <StatCard label="Pending Payouts" value={summary?.pendingPayouts ?? '—'} hint="Awaiting approval" trend={{ value: summary?.payoutsTrend ?? '', positive: (summary?.payoutsTrend || '').startsWith('+') }} />
          <StatCard label="Total Users" value={summary?.totalUsers ?? '—'} hint="All roles" trend={{ value: '', positive: true }} />
          <StatCard label="Total Shops" value={summary?.totalShops ?? '—'} hint="All shops" trend={{ value: '', positive: true }} />
          <StatCard label="Customers" value={summary?.totalCustomers ?? '—'} hint="Role: user" trend={{ value: '', positive: true }} />
        </KpiGrid>
      )}

      <Section title="Recent Orders" description="Latest activity across the platform">
        <DataTable columns={ordersColumns as any} data={recentOrders} />
      </Section>
    </div>
  )
}
