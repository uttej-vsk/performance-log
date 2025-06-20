import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all tags that are used by the current user's work entries
    const tags = await prisma.tag.findMany({
      where: {
        workEntries: {
          some: {
            workEntry: {
              userId: session.user.id,
              deletedAt: null
            }
          }
        }
      },
      select: {
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    const tagNames = tags.map(tag => tag.name)

    return Response.json({
      success: true,
      data: {
        tags: tagNames
      }
    })

  } catch (error) {
    console.error("Failed to fetch tags:", error)
    return Response.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
} 