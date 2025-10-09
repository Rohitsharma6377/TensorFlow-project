"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";
import { DataTable } from "../components/DataTable";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchPayouts, setPayoutPage, setPayoutQuery, setPayoutStatus, setPayoutRange } from "@/store/slice/payoutAdminSlice";

export default function SuperAdminPayoutPage() {
  const dispatch = useAppDispatch();
  const { items, status, page, limit, total, q, statusFilter, from, to, error } = useAppSelector((s) => (s as any).payouts) as any;
  const [search, setSearch] = useState<string>(q || "");
  const [rangeFrom, setRangeFrom] = useState<string>(from || "");
  const [rangeTo, setRangeTo] = useState<string>(to || "");

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchPayouts({ page, limit, q, status: statusFilter || undefined, from, to }) as any);
    }
  }, [status, dispatch]);

  useEffect(() => {
    dispatch(fetchPayouts({ page, limit, q, status: statusFilter || undefined, from, to }) as any);
  }, [dispatch, page, limit, q, statusFilter, from, to]);

  const columns = [
    { key: 'id', header: 'Payout ID' },
    { key: 'shop', header: 'Shop' },
    { key: 'amount', header: 'Amount', render: (v: any) => (typeof v === 'number' ? `$${v.toFixed(2)}` : v) },
    { key: 'status', header: 'Status' },
    { key: 'date', header: 'Date' },
  ] as const;

  return (
    <div className="space-y-4">
      <PageHeader title="Payouts" subtitle="Manage merchant settlements" />
      <Section title="Payouts" description="Initiate, approve, and track">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <input
            className="w-full max-w-xs border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900"
            placeholder="Search payouts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') dispatch(setPayoutQuery(search)); }}
          />
          <select className="px-2 py-2 text-sm border rounded-md dark:bg-gray-900" value={statusFilter || ''} onChange={(e)=> dispatch(setPayoutStatus(e.target.value as any))}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
          <input type="date" className="px-2 py-2 text-sm border rounded-md dark:bg-gray-900" value={rangeFrom} onChange={(e)=> setRangeFrom(e.target.value)} />
          <span className="text-slate-500">to</span>
          <input type="date" className="px-2 py-2 text-sm border rounded-md dark:bg-gray-900" value={rangeTo} onChange={(e)=> setRangeTo(e.target.value)} />
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 dark:hover:bg-gray-800" onClick={() => { dispatch(setPayoutQuery(search)); dispatch(setPayoutRange({ from: rangeFrom || undefined, to: rangeTo || undefined })); dispatch(setPayoutPage(1)); }}>Apply</button>
          <div className="ml-auto text-xs text-slate-500">{total || 0} payouts</div>
        </div>

        {status === 'loading' && (
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Loading payouts...</div>
        )}
        {status === 'failed' && (
          <div className="text-sm text-red-600 mb-2">{error || 'Failed to load payouts'}</div>
        )}

        <DataTable columns={columns as any} data={items || []} />

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">Page {page} • Showing {items?.length || 0} of {total || 0}</div>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 text-sm rounded-md border disabled:opacity-50" disabled={page <= 1} onClick={() => dispatch(setPayoutPage(Math.max(1, page - 1)))}>Prev</button>
            <button className="px-2 py-1 text-sm rounded-md border disabled:opacity-50" disabled={(page * limit) >= (total || 0)} onClick={() => dispatch(setPayoutPage(page + 1))}>Next</button>
          </div>
        </div>
      </Section>
    </div>
  );
}
