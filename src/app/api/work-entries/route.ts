import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { analyzeWorkEntry } from '@/lib/ai'

const CreateWorkEntrySchema = z.object({
  conversationText: z.string().min(10, "Conversation text must be at least 10 characters long."),
  conversationId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversationText, conversationId } = CreateWorkEntrySchema.parse(body)

    // Use the AI to analyze the conversation and get structured data
    const analysis = await analyzeWorkEntry(conversationText);

    // Create the work entry in the database
    const workEntry = await prisma.workEntry.create({
      data: {
        userId: session.user.id,
        title: analysis.title,
        description: conversationText, // Store the full conversation text
        impact: analysis.businessImpact,
        complexity: analysis.technicalComplexity,
        impactScore: analysis.impactScore,
        // The 'tags' field needs special handling since it's a many-to-many relation.
        // We'll create the tags and connect them to the work entry.
        tags: {
          create: analysis.suggestedTags.map((tagName: string) => ({
            tag: {
              connectOrCreate: {
                where: { name: tagName },
                create: { name: tagName },
              },
            },
          })),
        },
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    return Response.json({ success: true, data: workEntry });

  } catch (error) {
    console.error("Failed to create work entry:", error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return Response.json({ error: 'Failed to create work entry' }, { status: 500 });
  }
} 