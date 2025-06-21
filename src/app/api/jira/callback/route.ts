import { NextRequest, NextResponse } from 'next/server';
import { getJiraTokens, getJiraCloudId, storeJiraCredentials } from '@/lib/jira/oauth';
import { requireAuth } from '@/lib/auth-utils';

/**
 * GET handler for the JIRA OAuth callback.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Authorization code not found.' },
        { status: 400 }
      );
    }

    // Optional: Validate the 'state' parameter here to prevent CSRF attacks

    const { accessToken, refreshToken, expiresIn } = await getJiraTokens(code);
    const cloudId = await getJiraCloudId(accessToken);

    if (!cloudId) {
        return NextResponse.json(
            { success: false, error: 'Could not find a JIRA cloud ID for your account.' },
            { status: 400 }
        );
    }

    await storeJiraCredentials(user.id, cloudId, accessToken, refreshToken, expiresIn);

    // Redirect user to the settings page upon successful connection
    const redirectUrl = new URL('/dashboard/settings', request.url);
    redirectUrl.searchParams.set('jira_connected', 'true');
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('JIRA callback error:', error);
    const redirectUrl = new URL('/dashboard/settings', request.url);
    redirectUrl.searchParams.set('jira_error', 'connection_failed');
    return NextResponse.redirect(redirectUrl);
  }
} 