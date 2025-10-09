"use client";

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';
import ClientPortal from '@/components/util/ClientPortal';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <ProtectedRoute requiredRole="customer" allowGuest={false}>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-sky-50 via-emerald-50 to-emerald-100/40">
        <div className="mx-auto px-2 sm:px-4 py-4 sm:py-6">
          {/* Top bar for mobile */}
          <div className="mb-3 flex items-center justify-between md:hidden">
            <div className="font-semibold text-emerald-800">Dashboard</div>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="px-3 py-2 rounded-md border border-emerald-200 bg-white/80 text-emerald-700 shadow-sm"
              aria-label="Open menu"
            >
              Menu
            </button>
          </div>
          <div className="flex gap-4 sm:gap-6">
            {/* Static sidebar hidden on mobile */}
            <div className="hidden md:block">
              <ProfileSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
            </div>
            <main className="flex-1 min-w-0 animate-[fadeIn_300ms_ease]">
              {children}
            </main>
          </div>
        </div>

        {/* Mobile overlay sidebar */}
        {mobileOpen && (
          <ClientPortal>
            <div className="fixed inset-0 z-[100000] md:hidden" role="dialog" aria-modal="true">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
              <div className="absolute top-0 bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-2xl animate-[slideIn_200ms_ease-out]">
                <div className="flex items-center justify-between px-4 h-12 border-b bg-white/90 dark:bg-gray-900/90">
                  <span className="font-semibold">Menu</span>
                  <button className="p-2" onClick={() => setMobileOpen(false)} aria-label="Close menu">✕</button>
                </div>
                <div className="h-[calc(100%-3rem)] overflow-y-auto no-scrollbar">
                  <ProfileSidebar
                    collapsed={false}
                    onToggle={() => setMobileOpen(false)}
                    className="border-0 w-full"
                  />
                </div>
              </div>
            </div>
          </ClientPortal>
        )}
      </div>
    </ProtectedRoute>
  );
}
