"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SHOW_ON } from "@/components/layout/ConditionalLeftSidebar";

export default function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const hasSidebar = SHOW_ON.some((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/")));
  return (
    <main className={`flex-1 min-h-screen overflow-y-auto ${hasSidebar ? "lg:pl-[360px]" : ""}`}>
      {children}
    </main>
  );
}
