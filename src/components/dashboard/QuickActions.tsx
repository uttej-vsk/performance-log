"use client"

import Link from 'next/link'
import { PlusCircle, List } from 'lucide-react'

export default function QuickActions() {
  return (
    <div className="bg-gray-800/50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        <Link href="/chat" className="flex items-center gap-3 w-full text-left bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
          <PlusCircle className="w-5 h-5" />
          <span>Start New Chat</span>
        </Link>
        <Link href="/dashboard/timeline" className="flex items-center gap-3 w-full text-left bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
          <List className="w-5 h-5" />
          <span>View Timeline</span>
        </Link>
      </div>
    </div>
  )
} 