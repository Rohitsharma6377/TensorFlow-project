"use client";

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";
import { DataTable } from "../components/DataTable";
import { AdminAPI } from "@/lib/api";

function exportCSV(rows: any[], filename: string) {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(',')].concat(
    rows.map((r) => headers.map((h) => {
      const val = r[h];
      const s = (val ?? '').toString();
      return `"${s.replace(/"/g,'""')}"`;
    }).join(','))
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export default function SuperAdminAnalyticsPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [range, setRange] = useState<string>('30d');
  const [series, setSeries] = useState<any[]>([]);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      // Summary (tolerate 404)
      try {
        const s = await AdminAPI.analytics.summary();
        setSummary((s as any).summary || {});
      } catch (e: any) {
        const msg = String(e?.message || '').toLowerCase();
        if (!msg.includes('not found') && !msg.includes('404')) { throw e; }
        setSummary({});
      }
      // Timeseries (tolerate errors)
      try {
        const t = await AdminAPI.analytics.timeseries({ range });
        setSeries((t as any).series || []);
      } catch {
        setSeries([]);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [range]);

  const columns = useMemo(() => ([
    { key: 'date', header: 'Date' },
    { key: 'orders', header: 'Orders' },
    { key: 'revenue', header: 'Revenue' },
    { key: 'newUsers', header: 'New Users' },
    { key: 'newShops', header: 'New Shops' },
  ] as const), []);

  return (
    <div className="space-y-4">
      <PageHeader title="Analytics & Reports" subtitle="KPIs and time-series insights" />

      <Section title="Summary" description="Key performance indicators">
        {loading && (<div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Loading analytics…</div>)}
        {error && !String(error).toLowerCase().includes('not found') && (<div className="text-sm text-red-600 mb-2">{error}</div>)}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-white dark:bg-gray-900 p-3">
            <div className="text-xs text-slate-500">Revenue Total</div>
            <div className="text-lg font-semibold">{summary?.revenueTotalFormatted || summary?.revenueTotal || '—'}</div>
          </div>
          <div className="rounded-lg border bg-white dark:bg-gray-900 p-3">
            <div className="text-xs text-slate-500">Orders Total</div>
            <div className="text-lg font-semibold">{summary?.ordersTotal ?? '—'}</div>
          </div>
          <div className="rounded-lg border bg-white dark:bg-gray-900 p-3">
            <div className="text-xs text-slate-500">Users Total</div>
            <div className="text-lg font-semibold">{summary?.usersTotal ?? '—'}</div>
          </div>
          <div className="rounded-lg border bg-white dark:bg-gray-900 p-3">
            <div className="text-xs text-slate-500">Shops Total</div>
            <div className="text-lg font-semibold">{summary?.shopsTotal ?? '—'}</div>
          </div>
        </div>
      </Section>

      <Section title="Time Series" description="Daily metrics">
        <div className="flex items-center gap-2 mb-3">
          <select className="px-2 py-2 text-sm border rounded-md dark:bg-gray-900" value={range} onChange={(e)=> setRange(e.target.value)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 dark:hover:bg-gray-800" onClick={() => exportCSV(series, `analytics-${range}-${Date.now()}.csv`)} disabled={!series?.length}>Export CSV</button>
          <div className="ml-auto text-xs text-slate-500">{series?.length || 0} rows</div>
        </div>

        <DataTable columns={columns as any} data={series || []} />
      </Section>
    </div>
  )
}
