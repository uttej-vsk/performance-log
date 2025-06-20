import { requireAuth } from '@/lib/auth-utils'
import QuickActions from '@/components/dashboard/QuickActions'
import RecentActivity from '@/components/dashboard/RecentActivity'
import PerformanceSummary from '@/components/dashboard/PerformanceSummary'

export default async function DashboardPage() {
  await requireAuth()
  
  return (
    <div className="flex-1 p-6 md:p-8">
      <h1 className="text-3xl font-bold text-gray-100 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
        <div className="lg:col-span-1">
          <PerformanceSummary />
        </div>
      </div>
      {/* More dashboard components can be added here */}
    </div>
  )
} 