"use client";

import { useEffect } from "react";
import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";
import { DataTable } from "../components/DataTable";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchPayouts } from "@/store/slice/payoutAdminSlice";

export default function SuperAdminPayoutPage() {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((s) => (s as any).payouts) as any;

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchPayouts() as any);
    }
  }, [status, dispatch]);

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
        {status === 'loading' && (
          <div className="text-sm text-slate-600 mb-2">Loading payouts...</div>
        )}
        <DataTable columns={columns as any} data={items || []} />
      </Section>
    </div>
  );
}
