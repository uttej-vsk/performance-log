import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

const updateProfileSchema = z.object({
  name: z.string().min(2).max(50),
  jobTitle: z.string().max(100).optional(),
  jobDescription: z.string().max(2000).optional(),
  reviewDate: z.date().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsedData = updateProfileSchema.parse({
      ...body,
      reviewDate: body.reviewDate ? new Date(body.reviewDate) : undefined,
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: parsedData,
    });

    return NextResponse.json({ success: true, data: { message: 'Profile updated successfully.' } });
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 