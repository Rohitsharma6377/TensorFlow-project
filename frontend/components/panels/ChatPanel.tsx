"use client";

import React, { useEffect, useMemo, useState } from "react";
import { XMarkIcon, PaperAirplaneIcon, PhotoIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const shops = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: `shop-${i + 1}`,
        name: `Shop ${i + 1}`,
        last: `Last message from Shop ${i + 1}`,
      })),
    []
  );
  const [activeId, setActiveId] = useState<string | null>(shops[0]?.id ?? null);
  const activeShop = useMemo(() => shops.find((s) => s.id === activeId), [shops, activeId]);
  const [message, setMessage] = useState("");

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    console.log('[ChatPanel] open state changed to:', open);
  }, [open]);

  console.log('[ChatPanel] render - open:', open);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed top-16 right-0 z-50 h-[calc(100vh-4rem)] w-full max-w-md bg-white dark:bg-gray-900 border-l shadow-xl transition-transform duration-200 ease-out ring-1 ring-blue-500/20",
          open ? "translate-x-0" : "translate-x-full"
        )}
        aria-hidden={!open}
        role="dialog"
        aria-label="Messages"
      >
      {/* Temporary debug stripe to ensure visibility */}
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Messages</h2>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted" aria-label="Close messages">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex h-[calc(100%-3rem)]">
        {/* Shops list */}
        <aside className="w-48 shrink-0 border-r h-full flex flex-col bg-gray-50 dark:bg-gray-800">
          <div className="px-3 py-2 border-b flex items-center gap-2 bg-white dark:bg-gray-900">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder-gray-500"
              placeholder="Search shops..."
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {shops.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={cn(
                  "w-full text-left px-3 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                  s.id === activeId && "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500"
                )}
              >
                <div className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{s.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.last}</div>
              </button>
            ))}
          </div>
        </aside>

        {/* Conversation */}
        <section className="flex-1 h-full flex flex-col">
          <div className="border-b px-4 py-3">
            <div className="text-sm font-semibold">{activeShop?.name || "Select a shop"}</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-800">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}
              >
                <div className={cn(
                  "max-w-[70%] rounded-lg px-3 py-2 text-sm shadow-sm",
                  i % 2 === 0 
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600" 
                    : "bg-blue-500 text-white"
                )}>
                  {i % 2 === 0 ? `Hello from ${activeShop?.name || 'Shop'}` : "Sure, can do!"}
                </div>
              </div>
            ))}
          </div>
          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!message.trim()) return;
              setMessage("");
            }}
            className="border-t border-gray-200 dark:border-gray-700 px-3 py-3 flex items-center gap-2 bg-white dark:bg-gray-900"
          >
            <label className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors" title="Upload image">
              <PhotoIcon className="h-5 w-5 text-gray-500" />
              <input type="file" accept="image/*" className="hidden" />
            </label>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message..."
              className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500"
            />
            <button type="submit" className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">
              <PaperAirplaneIcon className="h-5 w-5 -rotate-45" />
            </button>
          </form>
        </section>
      </div>
      </div>
    </>
  );
}

export default ChatPanel;
