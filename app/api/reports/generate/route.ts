import { NextRequest } from 'next/server';
import { handleError, handleSuccess, handleUnauthorized } from '@/packages/lib/helpers/api-response-handlers';
import { getUser } from '@/packages/lib/helpers/supabase/auth';
import { db } from '@/packages/lib/prisma/prisma-client';
import { inngest } from '@/packages/lib/inngest/client';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    const { topic } = await request.json();

    if (!user) {
      return handleUnauthorized();
    }

    if (!topic || typeof topic !== 'string') {
      return handleError({ err: 'Invalid topic provided' });
    }

    // Check if user has credits
    if (user.credits < 1) {
      return handleError({ err: 'Insufficient credits' });
    }

    // Create report record
    const report = await db.report.create({
      data: {
        userId: user.id,
        topic,
        status: 'PENDING'
      }
    });

    // Deduct credit
    await db.user.update({
      where: { id: user.id },
      data: { credits: user.credits - 1 }
    });

    // Trigger Inngest workflow
    await inngest.send({
      name: 'research/report.requested',
      data: {
        reportId: report.id,
        userId: user.id,
        topic
      }
    });

    return handleSuccess({
      message: 'Research generation started',
      content: {
        reportId: report.id,
        topic,
        status: report.status
      }
    });
  } catch (error) {
    console.error('Research generation error:', error);
    return handleError({ err: error instanceof Error ? error.message : 'Failed to generate research' });
  }
}
