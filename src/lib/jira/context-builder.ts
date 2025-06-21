import { JiraTicket, JiraComment, JiraAttachment } from './types';

// Basic type definition for a node in Atlassian Document Format (ADF)
interface AdfNode {
  type: string;
  text?: string;
  content?: AdfNode[];
}

export class JiraContextBuilder {
  
  /**
   * Detects JIRA ticket mentions in user messages.
   */
  detectTicketMentions(message: string): string[] {
    const patterns = [
      /\b([A-Z]{1,10}-\d+)\b/g,                           // EI-1234
      /jira.*\/browse\/([A-Z]{1,10}-\d+)/g,               // URL format
      /atlassian\.net.*\/browse\/([A-Z]{1,10}-\d+)/g      // Atlassian URL
    ];
    
    const tickets: string[] = [];
    patterns.forEach(pattern => {
      const matches = message.matchAll(pattern);
      for (const match of matches) {
        tickets.push(match[1]);
      }
    });
    
    return [...new Set(tickets)]; // Remove duplicates
  }
  
  /**
   * Builds rich AI context from JIRA ticket data.
   */
  async buildTicketContext(ticket: JiraTicket): Promise<string> {
    const context = `
## JIRA Ticket Context: ${ticket.key}

**Basic Information:**
- Title: ${ticket.fields.summary}
- Type: ${ticket.fields.issuetype.name}
- Status: ${ticket.fields.status.name}
- Priority: ${ticket.fields.priority?.name || 'Not set'}
- Assignee: ${ticket.fields.assignee?.displayName || 'Unassigned'}
- Story Points: ${ticket.storyPoints || 'Not estimated'}

**Work Details:**
- Time Spent: ${this.formatTime(ticket.fields.timetracking?.timeSpent)}
- Original Estimate: ${this.formatTime(ticket.fields.timetracking?.originalEstimate)}
- Created: ${this.formatDate(ticket.fields.created)}
- Last Updated: ${this.formatDate(ticket.fields.updated)}

**Project Context:**
- Project: ${ticket.fields.project.name}
- Epic: ${await this.getEpicName(ticket.fields.epic)}
- Sprint: ${await this.getCurrentSprint(ticket)}

**Description:**
${this.formatDescription(ticket.fields.description)}

**Recent Comments:**
${this.formatComments(ticket.fields.comment)}

**Attachments:**
${this.formatAttachments(ticket.fields.attachment)}

**Business Impact Questions to Ask:**
- How many users does this affect?
- What business process does this support?
- What's the revenue/cost impact?
- How does this improve user experience?
- What metrics should we track for success?
- What was the business justification for this work?
- How does this align with company goals?
`;
    return context;
  }

  /**
   * Formats time tracking information.
   */
  private formatTime(timeString?: string): string {
    if (!timeString) return 'Not tracked';
    
    // JIRA time format is typically "1h 30m" or "1d 2h"
    return timeString;
  }

  /**
   * Formats dates for better readability.
   */
  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Formats the description field by recursively parsing the Atlassian Document Format (ADF).
   */
  private formatDescription(description: any): string {
    if (!description) {
        return 'No description provided.';
    }

    // Handle simple string descriptions, just in case
    if (typeof description === 'string') {
        return description.trim().length > 0 ? description : 'No description provided.';
    }
    
    // Handle Atlassian Document Format (ADF)
    if (description.type === 'doc' && description.version === 1) {
        const extractedText = this.extractTextFromADF(description).trim();
        return extractedText.length > 0 ? extractedText : 'No description provided.';
    }
    
    // Fallback for unknown formats
    return 'Description available but in an unreadable format.';
  }

  /**
   * Extracts plain text from an Atlassian Document Format (ADF) node recursively.
   */
  private extractTextFromADF(node: AdfNode): string {
    if (!node) {
      return '';
    }

    // Extracts text from a text node
    if (node.type === 'text' && node.text) {
        return node.text;
    }

    // If the node has content, recursively process each child node
    if (Array.isArray(node.content)) {
        // Add a newline after paragraphs for better readability
        const suffix = node.type === 'paragraph' ? '\\n' : '';
        return node.content.map(child => this.extractTextFromADF(child)).join('') + suffix;
    }

    return '';
  }

  /**
   * Formats the recent comments.
   */
  private formatComments(commentData?: { comments: JiraComment[] }): string {
    if (!commentData || commentData.comments.length === 0) {
      return 'No comments.';
    }
    // Get the most recent 3 comments
    const recentComments = commentData.comments.slice(-3);
    return recentComments.map(comment =>
      `- **${comment.author.displayName}** (${this.formatDate(comment.created)}): ${this.extractTextFromADF(comment.body).substring(0, 150)}...`
    ).join('\\n');
  }

  /**
   * Formats the attachments list.
   */
  private formatAttachments(attachments?: JiraAttachment[]): string {
    if (!attachments || attachments.length === 0) {
      return 'No attachments.';
    }
    return attachments.map(att => `- ${att.filename} (${Math.round(att.size / 1024)} KB)`).join('\\n');
  }

  /**
   * Gets the epic name if available.
   */
  private async getEpicName(epic: any): Promise<string> {
    if (!epic) return 'No epic';
    return epic.summary || epic.key || 'Epic information unavailable';
  }

  /**
   * Gets the current sprint information.
   */
  private async getCurrentSprint(ticket: JiraTicket): Promise<string> {
    if (!ticket.fields.sprint) return 'No sprint';
    
    const sprint = ticket.fields.sprint;
    return `${sprint.name} (${sprint.state})`;
  }
} 