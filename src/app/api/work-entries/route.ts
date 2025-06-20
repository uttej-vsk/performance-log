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

// GET endpoint to fetch work entries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const tagFilter = searchParams.get('tag') || ''

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      userId: session.user.id,
      deletedAt: null,
    }

    // Add search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { impact: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Add tag filter
    if (tagFilter) {
      where.tags = {
        some: {
          tag: {
            name: tagFilter
          }
        }
      }
    }

    // Build order by clause
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // Fetch work entries with pagination
    const [workEntries, total] = await Promise.all([
      prisma.workEntry.findMany({
        where,
        include: {
          tags: {
            include: {
              tag: true
            }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.workEntry.count({ where })
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return Response.json({
      success: true,
      data: {
        workEntries,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage,
        }
      }
    })

  } catch (error) {
    console.error("Failed to fetch work entries:", error)
    return Response.json({ error: 'Failed to fetch work entries' }, { status: 500 })
  }
}

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