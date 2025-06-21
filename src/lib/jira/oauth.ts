import { prisma } from '@/lib/db';
import { decrypt, encrypt } from '@/lib/auth-utils';

// These are the scopes needed for the app to function.
const REQUIRED_SCOPES = [
  'read:jira-work',   // Read issues, comments, worklogs
  'read:jira-user',   // Read user information
  'read:me',          // To get the user's account ID and basic profile info
];

/**
 * Generates the JIRA authorization URL.
 * @returns The URL to redirect the user to for authorization.
 */
export function getJiraAuthUrl(): string {
  const authUrl = new URL('https://auth.atlassian.com/authorize');
  authUrl.searchParams.set('audience', 'api.atlassian.com');
  authUrl.searchParams.set('client_id', process.env.JIRA_CLIENT_ID!);
  authUrl.searchParams.set('scope', REQUIRED_SCOPES.join(' '));
  authUrl.searchParams.set('redirect_uri', process.env.JIRA_REDIRECT_URI!);
  authUrl.searchParams.set('state', 'state-param-for-csrf-prevention'); // Should be a random, unguessable string
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('prompt', 'consent');
  return authUrl.toString();
}

/**
 * Exchanges an authorization code for an access token.
 * @param code The authorization code from the callback.
 * @returns An object with the access token, refresh token, and expiry time.
 */
export async function getJiraTokens(code: string): Promise<{ accessToken: string; refreshToken: string | undefined; expiresIn: number; }> {
  const response = await fetch('https://auth.atlassian.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: process.env.JIRA_CLIENT_ID!,
      client_secret: process.env.JIRA_CLIENT_SECRET!,
      code,
      redirect_uri: process.env.JIRA_REDIRECT_URI!,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Error getting JIRA token:', errorBody);
    throw new Error('Failed to get JIRA access token');
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Fetches the user's JIRA cloud ID, which is necessary for making API calls.
 * @param accessToken The user's JIRA access token.
 * @returns The first accessible cloud ID.
 */
export async function getJiraCloudId(accessToken: string): Promise<string | null> {
    const response = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
        }
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Error getting JIRA accessible resources:', errorBody);
        throw new Error('Failed to get JIRA cloud ID');
    }

    const data = await response.json();

    if (data && data.length > 0) {
        // Typically, a user has access to one cloud instance
        return data[0].id;
    }

    return null;
}

/**
 * Stores the user's JIRA tokens and cloud ID in the database.
 * @param userId The ID of the user.
 * @param cloudId The user's JIRA cloud ID.
 * @param accessToken The user's JIRA access token.
 * @param refreshToken The user's JIRA refresh token.
 * @param expiresIn The number of seconds until the access token expires.
 */
export async function storeJiraCredentials(userId: string, cloudId: string, accessToken: string, refreshToken: string | undefined, expiresIn: number) {
  const encryptedAccessToken = encrypt(accessToken);
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  const dataToUpdate: {
    jiraCloudId: string;
    jiraAccessToken: string;
    jiraTokenExpiry: Date;
    jiraConnectedAt: Date;
    jiraRefreshToken?: string;
  } = {
    jiraCloudId: cloudId,
    jiraAccessToken: encryptedAccessToken,
    jiraTokenExpiry: expiresAt,
    jiraConnectedAt: new Date(),
  };

  if (refreshToken) {
    dataToUpdate.jiraRefreshToken = encrypt(refreshToken);
  }

  await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
  });
}

/**
 * Refreshes a user's JIRA access token using their refresh token.
 * @param userId The ID of the user.
 * @returns A new access token.
 */
export async function refreshJiraToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.jiraRefreshToken) {
    throw new Error('User not found or no refresh token available.');
  }

  const refreshToken = decrypt(user.jiraRefreshToken);

  const response = await fetch('https://auth.atlassian.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: process.env.JIRA_CLIENT_ID!,
      client_secret: process.env.JIRA_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    // If refresh fails (e.g., token revoked), disconnect JIRA for the user
    await prisma.user.update({
      where: { id: userId },
      data: {
        jiraCloudId: null,
        jiraAccessToken: null,
        jiraRefreshToken: null,
        jiraTokenExpiry: null,
        jiraConnectedAt: null,
      },
    });
    throw new Error('Failed to refresh JIRA token.');
  }

  const data = await response.json();
  const newAccessToken = data.access_token;
  const newExpiresIn = data.expires_in;

  // Update the user's credentials with the new token and expiry
  await storeJiraCredentials(
    userId,
    user.jiraCloudId!,
    newAccessToken,
    data.refresh_token || undefined, // Pass undefined if no new refresh token is given
    newExpiresIn
  );

  return newAccessToken;
} 