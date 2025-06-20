"use client"

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar, Tag, TrendingUp, Edit, Trash2, Eye } from 'lucide-react'
import { Card, CardTitle, CardDescription } from '@/components/ui/card'

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

interface WorkEntryCardProps {
  workEntry: WorkEntry
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onView?: (id: string) => void
}

export default function WorkEntryCard({ 
  workEntry, 
  onEdit, 
  onDelete, 
  onView 
}: WorkEntryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getImpactColor = (score: number) => {
    if (score >= 8) return 'text-green-500'
    if (score >= 6) return 'text-yellow-500'
    if (score >= 4) return 'text-orange-500'
    return 'text-red-500'
  }

  const getComplexityColor = (complexity: number) => {
    if (complexity >= 4) return 'text-purple-500'
    if (complexity >= 3) return 'text-blue-500'
    if (complexity >= 2) return 'text-green-500'
    return 'text-gray-500'
  }

  const getComplexityText = (complexity: number) => {
    switch (complexity) {
      case 1: return 'Simple'
      case 2: return 'Basic'
      case 3: return 'Moderate'
      case 4: return 'Complex'
      case 5: return 'Very Complex'
      default: return 'Unknown'
    }
  }

  return (
    <Card className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold text-gray-100 mb-2">
            {workEntry.title}
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(workEntry.workDate), 'MMM dd, yyyy')}
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span className={getImpactColor(workEntry.impactScore)}>
                Impact: {workEntry.impactScore}/10
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className={getComplexityColor(workEntry.complexity)}>
                {getComplexityText(workEntry.complexity)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {onView && (
            <button
              onClick={() => onView(workEntry.id)}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-md transition-colors"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(workEntry.id)}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-md transition-colors"
              title="Edit entry"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(workEntry.id)}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-md transition-colors"
              title="Delete entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tags */}
      {workEntry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {workEntry.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-700 text-gray-300 rounded-md"
            >
              <Tag className="w-3 h-3" />
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-200 mb-1">Description</h4>
        <CardDescription className="text-gray-300 text-sm leading-relaxed">
          {isExpanded 
            ? workEntry.description 
            : workEntry.description.length > 200 
              ? `${workEntry.description.substring(0, 200)}...` 
              : workEntry.description
          }
        </CardDescription>
        {workEntry.description.length > 200 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-400 hover:text-blue-300 text-sm mt-2"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Impact */}
      {workEntry.impact && (
        <div className="bg-gray-700 rounded-md p-3">
          <h4 className="text-sm font-medium text-gray-200 mb-1">Business Impact</h4>
          <CardDescription className="text-sm text-gray-300">{workEntry.impact}</CardDescription>
        </div>
      )}
    </Card>
  )
} 