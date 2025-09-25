"use client";

import React from "react";
import { usePathname } from "next/navigation";
import LeftSidebar from "@/components/feed/LeftSidebar";

// Only show the sidebar on these routes
export const SHOW_ON: string[] = ["/", "/feed", "/shops", "/products", "/explore"]; 

export default function ConditionalLeftSidebar() {
  const pathname = usePathname() || "/";
  const visible = SHOW_ON.some((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/")));
  if (!visible) return null;

  return (
    <aside className="hidden lg:block fixed inset-y-0 left-0 w-[360px] z-20 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <LeftSidebar />
      </div>
    </aside>
  );
}
