import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Schema for creating a message
const CreateMessageSchema = z.object({
  content: z.string().min(1).max(20000),
  type: z.enum(['user', 'assistant']),
  conversationId: z.string().optional().nullable(),
})

// Schema for getting messages
const GetMessagesSchema = z.object({
  conversationId: z.string(),
  limit: z.string().optional(),
  before: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { content, type, conversationId } = CreateMessageSchema.parse(body)

    let conversation = null

    // If no conversationId provided, create a new conversation
    if (!conversationId) {
      conversation = await prisma.conversation.create({
        data: {
          userId: session.user.id,
          title: content.slice(0, 50) + '...', // Use first 50 chars as title
        },
      })
    } else {
      // Verify conversation belongs to user
      conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId: session.user.id,
        },
      })

      if (!conversation) {
        return Response.json({ error: 'Conversation not found' }, { status: 404 })
      }
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content,
        type,
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
        }),
      },
    })

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    })

    return Response.json({
      success: true,
      data: {
        message: {
          id: message.id,
          content: message.content,
          type: message.type,
          timestamp: message.createdAt,
        },
        conversation: {
          id: conversation.id,
          title: conversation.title,
        },
      },
    })
  } catch (error) {
    console.error('Create message error:', error)
    
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid request data' }, { status: 400 })
    }

    return Response.json(
      { error: 'Failed to create message' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before')

    if (!conversationId) {
      return Response.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
    })

    if (!conversation) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Build query for messages
    const where: any = {
      conversationId,
    }

    if (before) {
      where.createdAt = {
        lt: new Date(before),
      }
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        content: true,
        type: true,
        createdAt: true,
        metadata: true,
      },
    })

    // Get total count for pagination
    const total = await prisma.message.count({
      where: { conversationId },
    })

    return Response.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to get chronological order
        pagination: {
          total,
          limit,
          hasMore: messages.length === limit,
        },
      },
    })
  } catch (error) {
    console.error('Get messages error:', error)
    return Response.json(
      { error: 'Failed to get messages' }, 
      { status: 500 }
    )
  }
} 