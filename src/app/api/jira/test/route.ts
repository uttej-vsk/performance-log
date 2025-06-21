import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { JiraClient } from '@/lib/jira/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jiraClient = await JiraClient.createForUser(session.user.id);
    
    if (!jiraClient) {
      return Response.json({ 
        success: false, 
        message: 'JIRA not connected. Please connect your JIRA account first.' 
      });
    }

    // Test a simple API call to verify the connection works
    // We'll try to get the user's information
    const response = await fetch(`${jiraClient['baseUrl']}/rest/api/3/myself`, {
      headers: {
        'Authorization': `Bearer ${jiraClient['accessToken']}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return Response.json({ 
        success: false, 
        message: 'JIRA connection test failed',
        error: response.statusText
      });
    }

    const userData = await response.json();

    return Response.json({ 
      success: true, 
      message: 'JIRA connection successful',
      user: {
        displayName: userData.displayName,
        emailAddress: userData.emailAddress,
        accountId: userData.accountId
      }
    });

  } catch (error) {
    console.error('JIRA test error:', error);
    return Response.json({ 
      success: false, 
      message: 'JIRA test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 