import { JiraTicket, JiraSearchResponse } from './types';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/auth-utils';

export class RateLimitError extends Error {
  constructor(public retryAfter?: string) {
    super('JIRA rate limit exceeded');
    this.name = 'RateLimitError';
  }
}

export class JiraClient {
  private baseUrl: string;
  private accessToken: string;
  private userId: string;

  constructor(cloudId: string, accessToken: string, userId: string) {
    this.baseUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
    this.accessToken = accessToken;
    this.userId = userId;
  }

  /**
   * Fetches a single JIRA ticket by its key.
   */
  async getTicket(ticketKey: string): Promise<JiraTicket> {
    await this.checkRateLimit();
    
    const response = await fetch(`${this.baseUrl}/rest/api/3/issue/${ticketKey}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError(retryAfter || undefined);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch ticket ${ticketKey}: ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseTicketResponse(data);
  }

  /**
   * Fetches multiple tickets using JQL search.
   */
  async getMultipleTickets(ticketKeys: string[]): Promise<JiraTicket[]> {
    if (ticketKeys.length === 0) return [];
    
    const jql = `key in (${ticketKeys.map(key => `"${key}"`).join(',')})`;
    return this.searchTickets(jql);
  }

  /**
   * Searches tickets using JQL with pagination.
   */
  async searchTickets(jql: string, startAt = 0, maxResults = 50): Promise<JiraTicket[]> {
    await this.checkRateLimit();

    const response = await fetch(`${this.baseUrl}/rest/api/3/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jql,
        startAt,
        maxResults,
        fields: ['*all']
      })
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError(retryAfter || undefined);
    }

    if (!response.ok) {
      throw new Error(`JQL search failed: ${response.statusText}`);
    }

    const data: JiraSearchResponse = await response.json();
    return data.issues.map(issue => this.parseTicketResponse(issue));
  }

  /**
   * Gets user's recent work using JQL.
   */
  async getUserRecentWork(userAccountId: string, days = 30): Promise<JiraTicket[]> {
    const jql = `assignee = "${userAccountId}" AND updated >= -${days}d ORDER BY updated DESC`;
    return this.searchTickets(jql);
  }

  /**
   * Parses and normalizes a JIRA ticket response.
   */
  private parseTicketResponse(data: any): JiraTicket {
    // Extract story points from common custom field
    const storyPoints = data.fields.customfield_10016 || null;

    return {
      id: data.id,
      key: data.key,
      self: data.self,
      baseUrl: this.baseUrl.replace('/rest/api/3', ''),
      fields: {
        ...data.fields,
        storyPoints
      },
      storyPoints
    };
  }

  /**
   * Simple rate limiting check - in production, you'd want more sophisticated rate limiting
   */
  private async checkRateLimit(): Promise<void> {
    // For now, we'll implement a simple delay-based rate limiting
    // In production, you'd want to track requests per user and implement proper rate limiting
    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between requests
  }

  /**
   * Creates a JIRA client instance for a user.
   */
  static async createForUser(userId: string): Promise<JiraClient | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        jiraCloudId: true,
        jiraAccessToken: true,
        jiraTokenExpiry: true,
        jiraRefreshToken: true
      }
    });

    if (!user?.jiraCloudId || !user?.jiraAccessToken) {
      return null;
    }

    // Check if token is expired
    if (user.jiraTokenExpiry && user.jiraTokenExpiry < new Date()) {
      // Token is expired, we should refresh it
      // For now, we'll return null and let the calling code handle this
      // In a full implementation, you'd want to refresh the token here
      return null;
    }

    const accessToken = decrypt(user.jiraAccessToken);
    return new JiraClient(user.jiraCloudId, accessToken, userId);
  }
} 