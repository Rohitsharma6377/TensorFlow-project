"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";
import { DataTable } from "../components/DataTable";
import { useAppDispatch, useAppSelector } from "@/store";
import { approveShop, banShop, fetchAdminShops, setShopsFilter, setShopsPage, setShopsQuery, setShopsRange } from "@/store/slice/adminShopsSlice";

function exportCSV(rows: any[], filename: string) {
  const headers = ['_id','name','owner','status','ordersCount'];
  const csv = [headers.join(',')].concat(
    rows.map(r => [r._id, `"${(r.name||'').replace(/"/g,'""')}"`, `"${(r.owner?.name||r.ownerName||'').replace(/"/g,'""')}"`, (r.status || (r.approved?'approved':'pending')), r.ordersCount ?? '' ].join(','))
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export default function SuperAdminShopsPage() {
  const dispatch = useAppDispatch();
  const { items, status, error, page, limit, total, q, filter, from, to } = useAppSelector((s)=> (s as any).adminShops) as any;
  const [search, setSearch] = useState<string>(q || "");
  const [rangeFrom, setRangeFrom] = useState<string>(from || "");
  const [rangeTo, setRangeTo] = useState<string>(to || "");

  useEffect(() => {
    if (status === 'idle') dispatch(fetchAdminShops(undefined) as any);
  }, [status, dispatch]);

  useEffect(() => {
    dispatch(fetchAdminShops(undefined) as any);
  }, [dispatch, page, limit, filter, q, from, to]);

  const columns = useMemo(() => ([
    { key: 'name', header: 'Shop' },
    { key: 'owner', header: 'Owner', render: (_: any, r: any) => (r?.owner?.name || r?.ownerName || '-') },
    { key: 'orders', header: 'Orders', render: (_: any, r: any) => (r?.ordersCount ?? '-') },
    { key: 'status', header: 'Status', render: (_: any, r: any) => (r?.status || (r?.approved ? 'approved' : 'pending')) },
    { key: 'actions', header: 'Actions', render: (_: any, r: any) => (
      <div className="flex gap-2">
        <button
          className="px-2 py-1 text-xs rounded-md border border-emerald-300 text-emerald-800 hover:bg-emerald-50"
          onClick={() => dispatch(approveShop({ id: r._id, approved: true }) as any)}
        >Approve</button>
        <button
          className="px-2 py-1 text-xs rounded-md border border-amber-300 text-amber-800 hover:bg-amber-50"
          onClick={() => dispatch(approveShop({ id: r._id, approved: false }) as any)}
        >Revoke</button>
        <button
          className="px-2 py-1 text-xs rounded-md border border-rose-300 text-rose-800 hover:bg-rose-50"
          onClick={() => dispatch(banShop({ id: r._id, banned: true }) as any)}
        >Ban</button>
        <button
          className="px-2 py-1 text-xs rounded-md border border-slate-300 text-slate-800 hover:bg-slate-50"
          onClick={() => dispatch(banShop({ id: r._id, banned: false }) as any)}
        >Unban</button>
      </div>
    ) },
  ] as const), []);

  return (
    <div className="space-y-4">
      <PageHeader title="Shops" subtitle="Manage merchant stores" />
      <Section title="All Shops" description="Approve, suspend, and review">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <input
            className="w-full max-w-xs border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900"
            placeholder="Search shops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { dispatch(setShopsQuery(search)); dispatch(setShopsPage(1)); } }}
          />
          <select className="px-2 py-2 text-sm border rounded-md dark:bg-gray-900" value={filter || ''} onChange={(e)=>{ dispatch(setShopsFilter(e.target.value as any)); dispatch(setShopsPage(1)); }}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="banned">Banned</option>
          </select>
          <input type="date" className="px-2 py-2 text-sm border rounded-md dark:bg-gray-900" value={rangeFrom} onChange={(e)=> setRangeFrom(e.target.value)} />
          <span className="text-slate-500">to</span>
          <input type="date" className="px-2 py-2 text-sm border rounded-md dark:bg-gray-900" value={rangeTo} onChange={(e)=> setRangeTo(e.target.value)} />
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 dark:hover:bg-gray-800" onClick={() => { dispatch(setShopsQuery(search)); dispatch(setShopsRange({ from: rangeFrom || undefined, to: rangeTo || undefined })); dispatch(setShopsPage(1)); }}>Apply</button>
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 dark:hover:bg-gray-800" onClick={() => exportCSV(items || [], `shops-${Date.now()}.csv`)}>Export CSV</button>
          <div className="ml-auto text-xs text-slate-500">{total || 0} shops</div>
        </div>

        {status === 'loading' && (<div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Loading shops...</div>)}
        {status === 'failed' && (<div className="text-sm text-red-600 mb-2">{error}</div>)}

        <DataTable columns={columns as any} data={items || []} />

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">Page {page} • Showing {items?.length || 0} of {total || 0}</div>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 text-sm rounded-md border disabled:opacity-50" disabled={page <= 1} onClick={() => dispatch(setShopsPage(Math.max(1, page - 1)))}>Prev</button>
            <button className="px-2 py-1 text-sm rounded-md border disabled:opacity-50" disabled={(page * limit) >= (total || 0)} onClick={() => dispatch(setShopsPage(page + 1))}>Next</button>
          </div>
        </div>
      </Section>
    </div>
  );
}
