"use client";

import { useEffect } from "react";
import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";
import { DataTable } from "../components/DataTable";
import { useAppDispatch, useAppSelector } from "@/store";
import { deactivateUser, fetchAdminUsers, notifyUser } from "@/store/slice/adminUsersSlice";

export default function SuperAdminUsersPage() {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((s) => (s as any).adminUsers) as any;

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchAdminUsers() as any);
    }
  }, [status, dispatch]);

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    { key: 'status', header: 'Status' },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          <button
            className="px-2 py-1 text-xs rounded-md border border-emerald-300 text-emerald-800 hover:bg-emerald-50"
            onClick={() => dispatch(deactivateUser({ id: row._id, until: undefined }) as any)}
          >
            Deactivate
          </button>
          <button
            className="px-2 py-1 text-xs rounded-md border border-sky-300 text-sky-800 hover:bg-sky-50"
            onClick={() => dispatch(notifyUser({ id: row._id, channel: 'email', message: 'Admin notification' }) as any)}
          >
            Notify
          </button>
        </div>
      )
    }
  ] as const;

  return (
    <div className="space-y-4">
      <PageHeader title="Users" subtitle="Manage platform users" />
      <Section title="Users" description="Invite, suspend, and assign roles">
        {status === 'loading' && (
          <div className="text-sm text-slate-600 mb-2">Loading users...</div>
        )}
        <DataTable columns={columns as any} data={items || []} />
      </Section>
    </div>
  );
}
