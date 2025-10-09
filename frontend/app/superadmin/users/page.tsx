"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";
import { DataTable } from "../components/DataTable";
import { useAppDispatch, useAppSelector } from "@/store";
import { deactivateUser, fetchAdminUsers, notifyUser, setPage, setQuery, unblockUser, setUserStatus } from "@/store/slice/adminUsersSlice";

export default function SuperAdminUsersPage() {
  const dispatch = useAppDispatch();
  const { items, status, page, limit, total, q, error } = useAppSelector((s) => (s as any).adminUsers) as any;
  const [search, setSearch] = useState<string>(q || "");
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const setRowLoading = (id: string, v: boolean) => setLoadingMap((m) => ({ ...m, [id]: v }));

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchAdminUsers({ page, limit, q }) as any);
    }
  }, [status, dispatch]);

  useEffect(() => {
    dispatch(fetchAdminUsers({ page, limit, q }) as any);
  }, [dispatch, page, limit, q]);

  const onDeactivate = async (id: string) => {
    try {
      setRowLoading(id, true);
      // optimistic: set to deactivated
      dispatch(setUserStatus({ id, status: 'deactivated' }));
      const result: any = await dispatch(deactivateUser({ id, until: undefined }) as any);
      // if needed, check: result.meta?.requestStatus === 'fulfilled'
      // Ensure latest data
      dispatch(fetchAdminUsers({ page, limit, q }) as any);
    } catch (e) {
      console.error('Deactivate failed', e);
      // rollback
      dispatch(setUserStatus({ id, status: 'active' }));
      // optional: toast
    } finally { setRowLoading(id, false); }
  };

  const onActivate = async (id: string) => {
    try {
      setRowLoading(id, true);
      // optimistic: set to active
      dispatch(setUserStatus({ id, status: 'active' }));
      const result: any = await dispatch(unblockUser({ id }) as any);
      dispatch(fetchAdminUsers({ page, limit, q }) as any);
    } catch (e) {
      console.error('Activate failed', e);
      // rollback
      dispatch(setUserStatus({ id, status: 'deactivated' }));
    } finally { setRowLoading(id, false); }
  };

  const onNotify = async (id: string) => {
    try {
      setRowLoading(id, true);
      const result: any = await dispatch(notifyUser({ id, channel: 'email', message: 'Admin notification' }) as any);
    } catch (e) {
      console.error('Notify failed', e);
    } finally { setRowLoading(id, false); }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (v: any, row: any) => row?.name || row?.username || row?.email || 'User' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    { key: 'status', header: 'Status', render: (v: any, row: any) => (row?.status ? row.status : (row?.isBanned ? 'deactivated' : 'active')) },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          {((row?.status ? row.status === 'active' : !row?.isBanned)) && (
            <button
              className="px-2 py-1 text-xs rounded-md border border-amber-300 text-amber-800 hover:bg-amber-50 disabled:opacity-50"
              disabled={!!loadingMap[row._id]}
              onClick={() => onDeactivate(row._id)}
            >
              Deactivate
            </button>
          )}
          {(!(row?.status ? row.status === 'active' : !row?.isBanned)) && (
            <button
              className="px-2 py-1 text-xs rounded-md border border-emerald-300 text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
              disabled={!!loadingMap[row._id]}
              onClick={() => onActivate(row._id)}
            >
              Activate
            </button>
          )}
          <button
            className="px-2 py-1 text-xs rounded-md border border-sky-300 text-sky-800 hover:bg-sky-50 disabled:opacity-50"
            disabled={!!loadingMap[row._id]}
            onClick={() => onNotify(row._id)}
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
        <div className="flex items-center gap-2 mb-3">
          <input
            className="w-full max-w-xs border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') dispatch(setQuery(search)); }}
          />
          <button className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 dark:hover:bg-gray-800" onClick={() => dispatch(setQuery(search))}>Search</button>
          <div className="ml-auto text-xs text-slate-500">{total || 0} users</div>
        </div>

        {status === 'loading' && (
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Loading users...</div>
        )}
        {status === 'failed' && (
          <div className="text-sm text-red-600 mb-2">{error || 'Failed to load users'}</div>
        )}

        <DataTable columns={columns as any} data={items || []} />

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">Page {page} • Showing {items?.length || 0} of {total || 0}</div>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 text-sm rounded-md border disabled:opacity-50" disabled={page <= 1} onClick={() => dispatch(setPage(Math.max(1, page - 1)))}>Prev</button>
            <button className="px-2 py-1 text-sm rounded-md border disabled:opacity-50" disabled={(page * limit) >= (total || 0)} onClick={() => dispatch(setPage(page + 1))}>Next</button>
          </div>
        </div>
      </Section>
    </div>
  );
}
