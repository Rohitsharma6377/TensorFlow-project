"use client";

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SuperSidebar } from '@/components/superadmin/SuperSidebar';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="superadmin" allowGuest={false}>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-sky-50 via-emerald-50 to-emerald-100/40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-6">
            <SuperSidebar />
            <main className="flex-1 min-w-0 animate-[fadeIn_300ms_ease]">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
