"use client";

import React from "react";

export function StatCard({ label, value, hint, trend }: {
  label: string;
  value: string | number;
  hint?: string;
  trend?: { value: string; positive?: boolean };
}) {
  return (
    <div className="rounded-xl border border-emerald-100/60 bg-white/70 p-4 shadow-sm">
      <div className="text-sm text-slate-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-emerald-900">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-sm">
        {trend && (
          <span className={trend.positive ? 'text-emerald-700' : 'text-rose-600'}>
            {trend.positive ? '▲' : '▼'} {trend.value}
          </span>
        )}
        {hint && <span className="text-slate-500">{hint}</span>}
      </div>
    </div>
  );
}

export default StatCard;
