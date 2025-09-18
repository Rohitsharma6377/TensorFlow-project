"use client";

import React, { useEffect } from "react";
import { XMarkIcon, BellIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[999] bg-black/30 transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

    <div
        className={cn(
          "fixed top-16 right-0 z-50 h-[calc(100vh-4rem)] w-full max-w-md bg-white dark:bg-gray-900 border-l shadow-xl transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      aria-hidden={!open}
      role="dialog"
      aria-label="Notifications"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Notifications</h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted"
          aria-label="Close notifications"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="h-full overflow-y-auto p-4 space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-2 rounded hover:bg-muted cursor-pointer">
            <BellIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="min-w-0">
              <div className="text-sm">You have a new activity #{i + 1}</div>
              <div className="text-xs text-muted-foreground">Just now</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}

export default NotificationsPanel;
