import { requireAuth } from '@/lib/auth-utils'
import Link from 'next/link'

export default async function DashboardPage() {
  await requireAuth()
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full text-center p-8">
      <h1 className="text-4xl font-semibold text-gray-200">Welcome to your Dashboard</h1>
      <p className="text-gray-500 mt-2 mb-8">What would you like to do today?</p>
      <div className="flex gap-4">
        <Link 
          href="/chat" 
          className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          Start a New Chat
        </Link>
        <Link 
          href="/dashboard/timeline" 
          className="bg-gray-700 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition font-semibold"
        >
          View Work Timeline
        </Link>
      </div>
    </div>
  )
}
