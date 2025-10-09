"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";
import { DataTable } from "../components/DataTable";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchDeliveryPartners, setPartnerPage, setPartnerQuery } from "@/store/slice/deliveryPartnersSlice";

export default function SuperAdminDeliveryPartnersPage() {
  const dispatch = useAppDispatch();
  const { items, status, error, page, limit, total, q } = useAppSelector((s) => (s as any).deliveryPartners) as any;
  const [search, setSearch] = useState<string>(q || "");

  useEffect(() => {
    if (status === 'idle') dispatch(fetchDeliveryPartners(undefined) as any);
  }, [status, dispatch]);

  useEffect(() => {
    dispatch(fetchDeliveryPartners(undefined) as any);
  }, [dispatch, page, limit, q]);

  const columns = useMemo(() => ([
    { key: 'name', header: 'Partner' },
    { key: 'region', header: 'Region' },
    { key: 'sla', header: 'SLA' },
    { key: 'status', header: 'Status' },
  ] as const), []);

  return (
    <div className="space-y-4">
      <PageHeader title="Delivery Partners" subtitle="Couriers and SLAs" />
      <Section title="Partners" description="Enable/disable and set coverage">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <input
            className="w-full max-w-xs border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900"
            placeholder="Search partners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { dispatch(setPartnerQuery(search)); dispatch(setPartnerPage(1)); } }}
          />
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 dark:hover:bg-gray-800" onClick={() => { dispatch(setPartnerQuery(search)); dispatch(setPartnerPage(1)); }}>Search</button>
          <div className="ml-auto text-xs text-slate-500">{total || 0} partners</div>
        </div>

        {status === 'loading' && (<div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Loading partners...</div>)}
        {status === 'failed' && (<div className="text-sm text-red-600 mb-2">{error}</div>)}

        <DataTable columns={columns as any} data={items || []} />

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">Page {page} • Showing {items?.length || 0} of {total || 0}</div>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 text-sm rounded-md border disabled:opacity-50" disabled={page <= 1} onClick={() => dispatch(setPartnerPage(Math.max(1, page - 1)))}>Prev</button>
            <button className="px-2 py-1 text-sm rounded-md border disabled:opacity-50" disabled={(page * limit) >= (total || 0)} onClick={() => dispatch(setPartnerPage(page + 1))}>Next</button>
          </div>
        </div>
      </Section>
    </div>
  );
}
