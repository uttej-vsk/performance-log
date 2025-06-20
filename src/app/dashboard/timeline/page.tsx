"use client"

import { useState, useEffect } from 'react'
import WorkEntryCard from '@/components/dashboard/WorkEntryCard'
import { Search, Filter, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface WorkEntryTag {
  tag: {
    id: string
    name: string
    color?: string
  }
}

interface WorkEntry {
  id: string
  title: string
  description: string
  impact?: string
  impactScore: number
  complexity: number
  workDate: string
  createdAt: string
  tags: WorkEntryTag[]
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function TimelinePage() {
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [tagFilter, setTagFilter] = useState('')
  const [availableTags, setAvailableTags] = useState<string[]>([])

  const fetchWorkEntries = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
        sortBy,
        sortOrder,
        ...(tagFilter && { tag: tagFilter })
      })

      const response = await fetch(`/api/work-entries?${params}`)
      if (!response.ok) throw new Error('Failed to fetch work entries')

      const data = await response.json()
      if (data.success) {
        setWorkEntries(data.data.workEntries)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching work entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableTags = async () => {
    try {
      const response = await fetch('/api/work-entries/tags')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAvailableTags(data.data.tags)
        }
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  useEffect(() => {
    fetchWorkEntries()
    fetchAvailableTags()
  }, [])

  useEffect(() => {
    fetchWorkEntries(1)
  }, [search, sortBy, sortOrder, tagFilter])

  const handlePageChange = (newPage: number) => {
    fetchWorkEntries(newPage)
  }

  const handleEdit = (id: string) => {
    // TODO: Implement edit functionality
    console.log('Edit work entry:', id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work entry?')) return

    try {
      const response = await fetch(`/api/work-entries/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refresh the current page
        fetchWorkEntries(pagination?.page || 1)
      }
    } catch (error) {
      console.error('Error deleting work entry:', error)
    }
  }

  const handleView = (id: string) => {
    // TODO: Implement view details functionality
    console.log('View work entry:', id)
  }

  if (loading && workEntries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading work entries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="mb-8">
        <CardTitle>Work Timeline</CardTitle>
        <CardDescription>
          View and manage all your work entries and contributions
        </CardDescription>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search work entries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:border-blue-500"
            >
              <option value="createdAt">Date Created</option>
              <option value="workDate">Work Date</option>
              <option value="impactScore">Impact Score</option>
              <option value="title">Title</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 hover:bg-gray-600 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* Tag Filter */}
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Tags</option>
            {availableTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Work Entries */}
      {workEntries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Filter className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-200 mb-2">No work entries found</h3>
            <p className="text-gray-400">
              {search || tagFilter 
                ? 'Try adjusting your search or filters' 
                : 'Start by creating your first work entry in the chat'
              }
            </p>
          </div>
          {!search && !tagFilter && (
            <a
              href="/chat"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Start Chatting
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {workEntries.map((workEntry) => (
            <WorkEntryCard
              key={workEntry.id}
              workEntry={workEntry}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} entries
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="px-3 py-2 text-gray-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
