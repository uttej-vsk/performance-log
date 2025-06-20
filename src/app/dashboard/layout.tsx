import { ReactNode } from 'react'
import { requireAuth } from '@/lib/auth-utils'

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireAuth()
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Performance Tracker</h1>
            </div>
            <nav className="flex space-x-8">
              <a href="/dashboard" className="text-gray-900 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </a>
              <a href="/chat" className="text-gray-900 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Chat
              </a>
              <a href="/dashboard/timeline" className="text-gray-900 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
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