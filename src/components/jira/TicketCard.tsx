import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, User, Clock, Target } from 'lucide-react';
import { JiraTicket } from '@/lib/jira/types';

interface TicketCardProps {
  ticket: JiraTicket;
  showInChat?: boolean;
}

export function TicketCard({ ticket, showInChat = false }: TicketCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'to do': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'highest': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className={`${showInChat ? 'max-w-md' : 'w-full'} border-l-4 border-l-blue-500`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            <a 
              href={`${ticket.baseUrl}/browse/${ticket.key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-blue-600"
            >
              {ticket.key}
              <ExternalLink className="h-4 w-4" />
            </a>
          </CardTitle>
          <Badge className={getStatusColor(ticket.fields.status.name)}>
            {ticket.fields.status.name}
          </Badge>
        </div>
        <p className="text-sm font-medium text-gray-900 line-clamp-2">
          {ticket.fields.summary}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span>{ticket.fields.assignee?.displayName || 'Unassigned'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className={`h-4 w-4 ${getPriorityColor(ticket.fields.priority?.name)}`} />
            <span>{ticket.fields.priority?.name || 'No Priority'}</span>
          </div>
        </div>

        {ticket.storyPoints && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Story Points:</span>
            <Badge variant="secondary">{ticket.storyPoints}</Badge>
          </div>
        )}

        {ticket.fields.timetracking?.timeSpent && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>Time Spent: {ticket.fields.timetracking.timeSpent}</span>
          </div>
        )}

        {showInChat && ticket.fields.description && (
          <div className="text-sm text-gray-600 line-clamp-3">
            {typeof ticket.fields.description === 'string' 
              ? ticket.fields.description.substring(0, 150) + '...'
              : 'Description available'
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
} 