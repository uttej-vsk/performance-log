import { requireAuth } from '@/lib/auth-utils'
import Link from "next/link";

export default async function DashboardPage() {
  await requireAuth()
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link 
              href="/chat" 
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition text-center"
            >
              Start Chat
            </Link>
            <a 
              href="/dashboard/timeline" 
              className="block w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition text-center"
            >
              View Timeline
            </a>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <p className="text-gray-600">No recent activity yet.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Performance Summary</h2>
          <p className="text-gray-600">Start tracking your work to see insights here.</p>
        </div>
      </div>
    </div>
  )
} 