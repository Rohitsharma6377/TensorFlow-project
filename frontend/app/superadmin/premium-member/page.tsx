"use client";

import { useEffect } from "react";
import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";
import { DataTable } from "../components/DataTable";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchPremiumMembers, sendRenewalReminder } from "@/store/slice/premiumMemberSlice";

export default function SuperAdminPremiumMemberPage() {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((s) => (s as any).premiumMembers) as any;

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchPremiumMembers() as any);
    }
  }, [status, dispatch]);

  const columns = [
    { key: 'name', header: 'Member' },
    { key: 'tier', header: 'Tier' },
    { key: 'renewal', header: 'Renewal' },
    { key: 'status', header: 'Status' },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          <button
            className="px-2 py-1 text-xs rounded-md border border-amber-300 text-amber-800 hover:bg-amber-50"
            onClick={() => dispatch(sendRenewalReminder({ id: row.id, channel: 'email' }) as any)}
          >
            Send Reminder
          </button>
        </div>
      )
    }
  ] as const;

  return (
    <div className="space-y-4">
      <PageHeader title="Premium Members" subtitle="Loyalty and subscriptions" />
      <Section title="Members" description="Manage tiers and benefits">
        {status === 'loading' && (
          <div className="text-sm text-slate-600 mb-2">Loading members...</div>
        )}
        <DataTable columns={columns as any} data={items || []} />
      </Section>
    </div>
  );
}
