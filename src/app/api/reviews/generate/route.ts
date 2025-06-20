import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { generatePerformanceReview } from '@/lib/ai';
import { authOptions } from '@/lib/auth';

const generateReviewSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    const body = await request.json();
    const { startDate, endDate } = generateReviewSchema.parse(body);

    const workEntries = await prisma.workEntry.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (workEntries.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No work entries found in the selected date range.',
      }, { status: 404 });
    }

    const review = await generatePerformanceReview(user, workEntries);

    // Here you might want to save the review to the database
    // For now, just return it
    
    return NextResponse.json({ success: true, data: { review } });
  } catch (error) {
    console.error('Error generating performance review:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 