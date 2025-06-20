import { ReactNode } from 'react'
import { requireAuth } from '@/lib/auth-utils'

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireAuth()
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white">Performance Tracker</h1>
            </div>
            <nav className="flex space-x-8">
              <a href="/dashboard" className="hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </a>
              <a href="/chat" className="hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium">
                Chat
              </a>
              <a href="/dashboard/timeline" className="hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium">
                Timeline
              </a>
            </nav>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
} 