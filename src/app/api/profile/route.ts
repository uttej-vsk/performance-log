import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  name: z.string().optional(),
  jobTitle: z.string().optional(),
  jobDescription: z.string().optional(),
  projects: z.string().optional(), // Storing as a JSON string
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateProfileSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...validatedData,
      },
    });

    return Response.json({ success: true, data: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Failed to update profile:', error);
    return Response.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // We only return fields that are safe to expose to the client
    const { password, jiraAccessToken, jiraRefreshToken, ...safeUser } = user;

    return Response.json({ success: true, data: safeUser });
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return Response.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

/**
 * DELETE handler to disconnect JIRA for the user.
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        jiraCloudId: null,
        jiraAccessToken: null,
        jiraRefreshToken: null,
        jiraTokenExpiry: null,
        jiraConnectedAt: null,
      },
    });

    return Response.json({ success: true, message: 'JIRA connection removed.' });
  } catch (error) {
    console.error('Failed to disconnect JIRA:', error);
    return Response.json({ error: 'Failed to disconnect JIRA' }, { status: 500 });
  }
} 