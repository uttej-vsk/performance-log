'use client';

import { useJiraAuth } from '@/hooks/use-jira-auth';
import { JiraConnect } from '@/components/jira/JiraConnect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

export default function JiraTestPage() {
  const { profile, isLoading, isConnected, jiraCloudId, disconnect } = useJiraAuth();
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const testJiraConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/jira/test');
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: 'Test failed', error: error });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">JIRA Integration Test</h1>
        <p className="text-muted-foreground">
          Test your JIRA integration and verify the connection is working properly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isConnected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <p><strong>Status:</strong> {isConnected ? 'Connected' : 'Not Connected'}</p>
              {jiraCloudId && <p><strong>Cloud ID:</strong> {jiraCloudId}</p>}
              {profile?.jiraConnectedAt && (
                <p><strong>Connected Since:</strong> {new Date(profile.jiraConnectedAt).toLocaleString()}</p>
              )}
            </div>
            
            {isConnected && (
              <Button onClick={testJiraConnection} disabled={isTesting}>
                {isTesting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Test Connection
              </Button>
            )}
          </CardContent>
        </Card>

        {/* JIRA Connect Component */}
        <Card>
          <CardHeader>
            <CardTitle>Connect JIRA</CardTitle>
          </CardHeader>
          <CardContent>
            <JiraConnect
              isConnected={isConnected}
              jiraCloudId={jiraCloudId}
              onDisconnect={disconnect}
            />
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Status:</strong> {testResult.success ? 'Success' : 'Failed'}</p>
              <p><strong>Message:</strong> {testResult.message}</p>
              {testResult.user && (
                <div className="mt-4 p-3 bg-green-50 rounded-md">
                  <p><strong>JIRA User:</strong></p>
                  <p>Name: {testResult.user.displayName}</p>
                  <p>Email: {testResult.user.emailAddress}</p>
                  <p>Account ID: {testResult.user.accountId}</p>
                </div>
              )}
              {testResult.error && (
                <div className="mt-4 p-3 bg-red-50 rounded-md">
                  <p><strong>Error:</strong> {testResult.error}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Connect JIRA</h3>
            <p className="text-sm text-muted-foreground">
              Click "Connect to JIRA" to authenticate with your Atlassian account.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">2. Test in Chat</h3>
            <p className="text-sm text-muted-foreground">
              Go to the chat and mention a JIRA ticket like "I worked on EI-1234 today". 
              The AI will automatically fetch ticket details and provide context.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">3. View Ticket Details</h3>
            <p className="text-sm text-muted-foreground">
              The AI will have access to ticket information including status, priority, 
              story points, and time tracking to ask better follow-up questions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 