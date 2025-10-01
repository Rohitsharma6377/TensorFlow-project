"use client";

import React from "react";

export function Section({ title, description, children, actions }: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-emerald-100/60 bg-white/70 backdrop-blur shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100/60 p-4">
        <div>
          <h2 className="text-lg font-semibold text-emerald-900">{title}</h2>
          {description && (
            <p className="text-sm text-slate-600">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default Section;
