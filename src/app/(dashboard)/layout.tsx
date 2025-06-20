import { ReactNode } from 'react'
import { requireAuth } from '@/lib/auth-utils'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireAuth()
  
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
