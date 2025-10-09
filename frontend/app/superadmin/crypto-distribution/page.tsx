"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";
import { DataTable } from "../components/DataTable";
import { AdminAPI, api } from "@/lib/api";

function exportCSV(rows: any[], filename: string) {
  const headers = ['userId','name','email','wallet','token','balance'];
  const csv = [headers.join(',')].concat(
    rows.map(r => [
      r.userId || r._id || '',
      `"${(r.name||'').toString().replace(/"/g,'""')}"`,
      r.email || '',
      r.wallet || r.address || '',
      r.token || '',
      r.balance ?? r.amount ?? ''
    ].join(','))
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export default function SuperAdminCryptoDistributionPage() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState<'idle'|'loading'|'error'|'ready'>("idle");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [q, setQ] = useState<string>("");
  const [token, setToken] = useState<string>("IND");

  const load = async () => {
    setStatus('loading'); setError(null);
    try {
      // Prefer AdminAPI.web3.holders; fallback to direct API call if undefined
      const holdersFn: any = (AdminAPI as any)?.web3?.holders;
      const res: any = holdersFn
        ? await holdersFn({ page, limit, q, token })
        : await api<{ success: boolean; holders: any[]; total?: number; page?: number; limit?: number }>(
            `/api/v1/admin/web3/holders?page=${page}&limit=${limit}${q?`&q=${encodeURIComponent(q)}`:''}${token?`&token=${encodeURIComponent(token)}`:''}`,
            { method: 'GET' }
          );
      setItems(res?.holders || []);
      setTotal(res?.total ?? 0);
      setStatus('ready');
    } catch (e: any) {
      setError(e?.message || 'Failed to load holders');
      setStatus('error');
    }
  };

  const loadAll = async () => {
    setStatus('loading'); setError(null);
    try {
      const holdersFn: any = (AdminAPI as any)?.web3?.holders;
      const pageSize = 100; // batch size
      let p = 1;
      let all: any[] = [];
      let totalCount = 0;
      // fetch first page to get total
      const first: any = holdersFn
        ? await holdersFn({ page: p, limit: pageSize, q, token })
        : await api<{ success: boolean; holders: any[]; total?: number; page?: number; limit?: number }>(
            `/api/v1/admin/web3/holders?page=${p}&limit=${pageSize}${q?`&q=${encodeURIComponent(q)}`:''}${token?`&token=${encodeURIComponent(token)}`:''}`,
            { method: 'GET' }
          );
      all = (first?.holders || []);
      totalCount = Number(first?.total ?? all.length);
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
      // fetch the rest sequentially
      for (p = 2; p <= totalPages; p++) {
        const res: any = holdersFn
          ? await holdersFn({ page: p, limit: pageSize, q, token })
          : await api<{ success: boolean; holders: any[] }>(
              `/api/v1/admin/web3/holders?page=${p}&limit=${pageSize}${q?`&q=${encodeURIComponent(q)}`:''}${token?`&token=${encodeURIComponent(token)}`:''}`,
              { method: 'GET' }
            );
        all = all.concat(res?.holders || []);
      }
      setItems(all);
      setTotal(all.length);
      setPage(1);
      setStatus('ready');
    } catch (e: any) {
      setError(e?.message || 'Failed to load all holders');
      setStatus('error');
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, limit, token]);

  const columns = useMemo(() => ([
    { key: 'name', header: 'Name', render: (_: any, r: any) => (r?.name || '-') },
    { key: 'email', header: 'Email', render: (_: any, r: any) => (r?.email || '-') },
    { key: 'wallet', header: 'Wallet', render: (_: any, r: any) => (r?.wallet || r?.address || '-') },
    { key: 'token', header: 'Token', render: () => token },
    { key: 'balance', header: 'Balance', render: (_: any, r: any) => (typeof r?.balance === 'number' ? r.balance.toLocaleString() : (r?.amount ?? '-')) },
  ] as const), [token]);

  return (
    <div className="space-y-4">
      <PageHeader title="Crypto Distribution" subtitle="Tokenomics and rewards" />
      <Section title="Holders" description="All users holding the selected token">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <input
            className="w-full max-w-xs border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900"
            placeholder="Search by name/email/wallet..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); load(); } }}
          />
          <input
            className="w-28 border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900"
            placeholder="Token"
            value={token}
            onChange={(e)=> setToken(e.target.value.toUpperCase())}
          />
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 dark:hover:bg-gray-800" onClick={() => { setPage(1); load(); }}>Apply</button>
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 dark:hover:bg-gray-800" onClick={() => { loadAll(); }}>Load All</button>
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 dark:hover:bg-gray-800" onClick={() => exportCSV(items || [], `holders-${token}-${Date.now()}.csv`)}>Export CSV</button>
          <div className="ml-auto text-xs text-slate-500">{total || 0} holders</div>
        </div>

        {status === 'loading' && (<div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Loading holders...</div>)}
        {status === 'error' && (<div className="text-sm text-red-600 mb-2">{error}</div>)}

        <DataTable columns={columns as any} data={items || []} />

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">Page {page} • Showing {items?.length || 0} of {total || 0}</div>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 text-sm rounded-md border disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p)=>Math.max(1, p-1))}>Prev</button>
            <button className="px-2 py-1 text-sm rounded-md border disabled:opacity-50" disabled={(page * limit) >= (total || 0)} onClick={() => setPage((p)=>p+1)}>Next</button>
          </div>
        </div>
      </Section>
    </div>
  );
}
