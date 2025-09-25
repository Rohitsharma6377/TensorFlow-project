"use client";

import React, { useEffect, useState } from "react";

type ToastItem = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    let idCounter = 1;
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ type: ToastItem["type"]; message: string }>;
      const id = idCounter++;
      setToasts((prev) => [...prev, { id, type: ce.detail.type, message: ce.detail.message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    };
    window.addEventListener("app:toast" as any, handler as EventListener);
    return () => window.removeEventListener("app:toast" as any, handler as EventListener);
  }, []);

  const colorByType: Record<ToastItem["type"], string> = {
    success: "bg-emerald-600",
    error: "bg-rose-600",
    info: "bg-sky-600",
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`min-w-[260px] max-w-[380px] text-white shadow-lg rounded-md px-4 py-3 ${colorByType[t.type]} animate-slide-up`}
        >
          {t.message}
        </div>
      ))}
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUp 200ms ease-out; }
      `}</style>
    </div>
  );
}
