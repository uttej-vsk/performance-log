import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateStreamingResponse, Message } from '@/lib/ai'
import { z } from 'zod'

// Request schema for chat streaming
const StreamRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  conversationId: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { messages, conversationId } = StreamRequestSchema.parse(body)

    // Validate that we have at least one message
    if (!messages || messages.length === 0) {
      return Response.json({ error: 'No messages provided' }, { status: 400 })
    }

    // Convert messages to the format expected by the AI service
    const aiMessages: Message[] = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }))

    // Generate streaming response
    const stream = await generateStreamingResponse(aiMessages, conversationId || undefined)

    // Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Chat stream error:', error)
    
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid request data' }, { status: 400 })
    }

    return Response.json(
      { error: 'Failed to generate response' }, 
      { status: 500 }
    )
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 