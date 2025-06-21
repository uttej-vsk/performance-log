/**
 * Represents the structure of a JIRA user.
 */
export interface JiraUser {
  accountId: string;
  emailAddress: string;
  displayName: string;
  avatarUrls: {
    '48x48': string;
  };
}

/**
 * Represents the structure of a JIRA project.
 */
export interface JiraProject {
  id: string;
  key: string;
  name: string;
}

/**
 * Represents the status of a JIRA ticket.
 */
export interface JiraStatus {
  id: string;
  name: string;
  statusCategory: {
    key: string;
    name:string;
  }
}

/**
 * Represents the priority of a JIRA ticket.
 */
export interface JiraPriority {
  id: string;
  name: string;
  iconUrl: string;
}

/**
 * Represents the time tracking information for a JIRA ticket.
 */
export interface JiraTimeTracking {
  originalEstimate: string;
  remainingEstimate: string;
  timeSpent: string;
  originalEstimateSeconds: number;
  remainingEstimateSeconds: number;
  timeSpentSeconds: number;
}

/**
 * Represents the issue type of a JIRA ticket.
 */
export interface JiraIssueType {
  id: string;
  name: string;
  iconUrl: string;
  subtask: boolean;
}

/**
 * Represents a comment on a JIRA ticket.
 */
export interface JiraComment {
  id: string;
  author: JiraUser;
  body: any; // Can be string or Atlassian Document Format
  created: string;
  updated: string;
}

/**
 * Represents an attachment on a JIRA ticket.
 */
export interface JiraAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  content: string; // URL to the attachment content
}

/**
 * Represents the main fields of a JIRA ticket.
 */
export interface JiraTicketFields {
  summary: string;
  description: any; // Can be Atlassian Document Format
  issuetype: JiraIssueType;
  project: JiraProject;
  status: JiraStatus;
  priority: JiraPriority;
  assignee: JiraUser | null;
  reporter: JiraUser;
  created: string;
  updated: string;
  timetracking?: JiraTimeTracking;
  comment?: {
    comments: JiraComment[];
    total: number;
    maxResults: number;
    startAt: number;
  };
  attachment?: JiraAttachment[];
  // This is a common custom field for Story Points. The ID might vary.
  customfield_10016?: number | null;
  // This is for epic link. The ID might vary.
  epic?: {
    id: number;
    key: string;
    summary: string;
    agileBoardTooltip: string;
  } | null,
  // This is for sprint information. The ID might vary.
  sprint?: {
    id: number;
    name: string;
    state: string;
    boardId: number;
  } | null,
}

/**
 * Represents a JIRA ticket.
 */
export interface JiraTicket {
  id: string;
  key: string;
  self: string;
  fields: JiraTicketFields;
  // This is not part of the standard JIRA response, but we can add it for convenience.
  baseUrl?: string;
  storyPoints?: number | null; // A normalized field for story points
}

/**
 * Represents the response from the JIRA API when searching for tickets.
 */
export interface JiraSearchResponse {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraTicket[];
}

/**
* Represents the structure for JIRA OAuth configuration.
*/
export interface JiraOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
} 