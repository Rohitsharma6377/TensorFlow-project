"use client";

import React from "react";

export type Column<T> = {
  key: keyof T;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
};

export function DataTable<T extends { id?: string | number }>({ columns, data, emptyText = 'No records found' }: {
  columns: Column<T>[];
  data: T[];
  emptyText?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-emerald-100/60 bg-white/70 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-emerald-50/70 text-emerald-900">
            <tr>
              {columns.map((c) => (
                <th key={String(c.key)} className="px-4 py-2 font-semibold">{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={columns.length}>{emptyText}</td>
              </tr>
            )}
            {data.map((row, idx) => (
              <tr key={row.id ?? idx} className="border-t border-emerald-100/60 hover:bg-emerald-50/40">
                {columns.map((c) => (
                  <td key={String(c.key)} className="px-4 py-2 text-slate-700">
                    {c.render ? c.render(row[c.key], row) : String(row[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
