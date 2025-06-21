import { NextResponse } from 'next/server';
import { getJiraAuthUrl } from '@/lib/jira/oauth';
import { requireAuth } from '@/lib/auth-utils';

/**
 * GET handler for JIRA authentication.
 * Redirects the user to the JIRA authorization page.
 */
export async function GET() {
  try {
    // Ensure the user is authenticated in our app first
    await requireAuth();

    const authUrl = getJiraAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    if (error instanceof Error && error.message.includes('redirect')) {
        // This is the expected behavior of requireAuth when user is not logged in.
        // The redirect to /signin is handled by the middleware or requireAuth function.
        // We need to return a response to stop execution. A redirect response is already being sent.
        return new Response(null, { status: 302 });
    }
    console.error('JIRA auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 