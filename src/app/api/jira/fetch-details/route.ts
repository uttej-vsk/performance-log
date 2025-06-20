import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as cheerio from 'cheerio';

const JiraRequestSchema = z.object({
  url: z.string().url(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = JiraRequestSchema.parse(body);

    // Fetch the HTML from the Jira ticket URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch Jira ticket: ${response.statusText}`);
    }
    const html = await response.text();

    // Use cheerio to parse the HTML
    const $ = cheerio.load(html);

    // Extract title and description (selectors may need adjustment for your Jira instance)
    const title = $('#summary-val').text().trim();
    const description = $('#description-val').text().trim();

    if (!title) {
      // Return a generic message if we can't parse the page (e.g., due to login wall)
      return Response.json({
        success: false,
        error: 'Could not parse Jira ticket. It may be private or require login.',
      });
    }

    return Response.json({
      success: true,
      data: {
        title,
        description,
        source: url,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid URL provided', details: error.errors }, { status: 400 });
    }
    console.error('Failed to fetch Jira details:', error);
    return Response.json({ error: 'An unexpected error occurred while fetching Jira details' }, { status: 500 });
  }
} 