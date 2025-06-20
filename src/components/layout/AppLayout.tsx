"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { ReactNode, useEffect, useState } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show sidebar logic - avoid hydration mismatch
  const showSidebar = mounted ? pathname !== "/signin" : false;

  return (
    <div className="flex h-screen bg-background">
      {showSidebar && <Sidebar />}
      <main className="flex-1 overflow-y-auto bg-background text-foreground">
        {children}
      </main>
    </div>
  );
}
