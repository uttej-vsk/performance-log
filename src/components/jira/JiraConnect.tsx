'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface JiraConnectProps {
  isConnected: boolean;
  jiraCloudId?: string | null;
  onDisconnect: () => Promise<void>;
}

export function JiraConnect({ isConnected, jiraCloudId, onDisconnect }: JiraConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    // Redirect to our own API route that handles the JIRA OAuth flow
    window.location.href = '/api/jira/auth';
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    await onDisconnect();
    setIsDisconnecting(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isConnected ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          )}
          JIRA Integration
        </CardTitle>
        <CardDescription>
          Connect your JIRA account to automatically fetch ticket context during conversations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="text-sm font-medium text-green-700 bg-green-50 p-3 rounded-md">
              <p>Successfully connected to JIRA Cloud.</p>
              {jiraCloudId && <p className="text-xs text-green-600 mt-1">Cloud ID: {jiraCloudId}</p>}
            </div>
            <Button variant="outline" onClick={handleDisconnect} disabled={isDisconnecting} className="w-full">
              {isDisconnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Disconnect JIRA
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Enable automatic ticket context in your conversations by connecting your company JIRA account.
            </div>
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Connect to JIRA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 