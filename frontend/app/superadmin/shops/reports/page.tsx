"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type Report = {
  _id: string;
  shop?: { _id: string; name: string; slug: string };
  reporter?: { _id: string; username?: string; email?: string };
  reason: string;
  details?: string;
  status: "open" | "reviewing" | "resolved";
  createdAt: string;
};

export default function ShopReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);

  const query = useMemo(() => {
    const search = new URLSearchParams();
    if (status) search.set("status", status);
    search.set("page", String(page));
    search.set("limit", String(limit));
    return search.toString();
  }, [status, page, limit]);

  async function load() {
    try {
      setLoading(true);
      const data = await api<any>(`/api/v1/shops/admin/reports?${query}`, { method: "GET" });
      setReports(data.reports || []);
      setTotal(data.total || 0);
      setLimit(data.limit || 20);
    } catch (e) {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function updateStatus(id: string, next: Report["status"]) {
    try {
      await api(`/api/v1/shops/admin/reports/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: next }),
      });
      setReports((prev) => prev.map((r) => (r._id === id ? { ...r, status: next } : r)));
    } catch {}
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Shop Reports</h1>
        <div className="flex items-center gap-2">
          <select
            className="border rounded-md px-2 py-1 text-sm"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="reviewing">Reviewing</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-3 py-2">Created</th>
              <th className="text-left px-3 py-2">Shop</th>
              <th className="text-left px-3 py-2">Reporter</th>
              <th className="text-left px-3 py-2">Reason</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-3 py-3" colSpan={6}>Loading…</td>
              </tr>
            )}
            {!loading && reports.length === 0 && (
              <tr>
                <td className="px-3 py-3" colSpan={6}>No reports</td>
              </tr>
            )}
            {reports.map((r) => (
              <tr key={r._id} className="border-t">
                <td className="px-3 py-2 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2">
                  {r.shop ? (
                    <Link className="text-emerald-700 hover:underline" href={`/shops/${r.shop.slug}`}>{r.shop.name}</Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2">{r.reporter?.username || r.reporter?.email || "—"}</td>
                <td className="px-3 py-2 max-w-[320px]">
                  <div className="font-medium">{r.reason}</div>
                  {r.details && <div className="text-slate-600 line-clamp-2">{r.details}</div>}
                </td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 rounded text-xs border ${
                    r.status === "open" ? "bg-red-50 text-red-700 border-red-200" :
                    r.status === "reviewing" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                    "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>{r.status}</span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {r.status !== "open" && (
                      <button className="px-2 py-1 border rounded text-xs" onClick={() => updateStatus(r._id, "open")}>Mark open</button>
                    )}
                    {r.status !== "reviewing" && (
                      <button className="px-2 py-1 border rounded text-xs" onClick={() => updateStatus(r._id, "reviewing")}>Reviewing</button>
                    )}
                    {r.status !== "resolved" && (
                      <button className="px-2 py-1 border rounded text-xs" onClick={() => updateStatus(r._id, "resolved")}>Resolve</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>
          Page {page} of {totalPages} ({total} items)
        </div>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
          <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      </div>
    </div>
  );
}
