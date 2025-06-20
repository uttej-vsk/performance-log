import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if the work entry belongs to the current user
    const workEntry = await prisma.workEntry.findFirst({
      where: {
        id,
        userId: session.user.id,
        deletedAt: null
      }
    })

    if (!workEntry) {
      return Response.json({ error: 'Work entry not found' }, { status: 404 })
    }

    // Soft delete the work entry
    await prisma.workEntry.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    return Response.json({
      success: true,
      message: 'Work entry deleted successfully'
    })

  } catch (error) {
    console.error("Failed to delete work entry:", error)
    return Response.json({ error: 'Failed to delete work entry' }, { status: 500 })
  }
} 