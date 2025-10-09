"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";
import { DataTable } from "../components/DataTable";
import { AdminAPI } from "@/lib/api";

export default function SuperAdminLeadsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState<'idle'|'loading'|'error'|'ready'>("idle");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [q, setQ] = useState<string>("");

  const load = async () => {
    setStatus('loading'); setError(null);
    try {
      const res: any = await AdminAPI.contacts.list({ page, limit, q });
      setItems(res?.contacts || []);
      setTotal(res?.total ?? 0);
      setStatus('ready');
    } catch (e: any) {
      setError(e?.message || 'Failed to load leads');
      setStatus('error');
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, limit]);

  const columns = useMemo(() => ([
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'source', header: 'Source' },
    { key: 'score', header: 'Score' },
  ] as const), []);

  return (
    <div className="space-y-4">
      <PageHeader title="Leads" subtitle="Track and score leads" />
      <Section title="Leads" description="Import, export and assign">
        <div className="flex items-center gap-2 mb-3">
          <input
            className="w-full max-w-xs border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900"
            placeholder="Search leads..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); load(); } }}
          />
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 dark:hover:bg-gray-800" onClick={() => { setPage(1); load(); }}>Search</button>
          <div className="ml-auto text-xs text-slate-500">{total || 0} leads</div>
        </div>

        {status === 'loading' && (<div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Loading leads...</div>)}
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
