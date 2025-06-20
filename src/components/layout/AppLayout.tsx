"use client"

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { ReactNode } from 'react'

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const showSidebar = pathname !== '/signin'

  return (
    <div className="flex h-screen bg-background text-foreground">
      {showSidebar && <Sidebar />}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  )
} 