import { NextRequest } from 'next/server';
import { handleError, handleSuccess, handleBadRequest } from '@/packages/lib/helpers/api-response-handlers';
import { getUser } from '@/packages/lib/helpers/supabase/auth';
import { db } from '@/packages/lib/prisma/prisma-client';
import { inngest } from '@/packages/lib/inngest/client';
import { sanitizeTopic, getErrorMessage } from '@/packages/lib/helpers/validation';
import { authenticatedGenerateRateLimiter } from '@/packages/lib/middleware/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (10 requests per hour per user)
    const rateLimitResult = await authenticatedGenerateRateLimiter(request, 'generate-report');
    if (rateLimitResult) {
      return rateLimitResult; // Rate limit exceeded
    }

    // getUser() already throws if no user, so no need for redundant check
    const user = await getUser();
    const { topic } = await request.json();

    // Validate and sanitize topic
    let sanitizedTopic: string;
    try {
      sanitizedTopic = sanitizeTopic(topic);
    } catch (error) {
      console.warn('[GENERATE_VALIDATION]', {
        reason: error instanceof Error ? error.message : 'invalid_topic',
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
      return handleBadRequest({ message: getErrorMessage('INVALID_TOPIC') });
    }

    // Use transaction to atomically check credits and create report
    // This prevents race condition where multiple simultaneous requests could exceed credit limit
    const report = await db.$transaction(async (tx) => {
      // Atomically decrement credits - this will fail if credits < 1
      const updatedUser = await tx.user.update({
        where: {
          id: user.id,
          credits: { gte: 1 } // Ensure user has at least 1 credit
        },
        data: {
          credits: { decrement: 1 }
        }
      }).catch(() => null);

      // If update failed, user doesn't have enough credits
      if (!updatedUser) {
        console.warn('[GENERATE_INSUFFICIENT_CREDITS]', {
          userId: user.id,
          credits: user.credits,
          timestamp: new Date().toISOString(),
        });
        throw new Error('INSUFFICIENT_CREDITS');
      }

      // Create report record (only if credit deduction succeeded)
      return await tx.report.create({
        data: {
          userId: user.id,
          topic: sanitizedTopic,
          status: 'PENDING'
        }
      });
    }).catch((error) => {
      if (error.message === 'INSUFFICIENT_CREDITS') {
        return null;
      }
      throw error;
    });

    // Check if transaction failed due to insufficient credits
    if (!report) {
      return handleBadRequest({ message: getErrorMessage('INSUFFICIENT_CREDITS') });
    }

    // Trigger Inngest workflow
    await inngest.send({
      name: 'research/report.requested',
      data: {
        reportId: report.id,
        userId: user.id,
        topic: sanitizedTopic
      }
    });

    console.info('[GENERATE_SUCCESS]', {
      reportId: report.id,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    return handleSuccess({
      message: 'Research generation started',
      content: {
        reportId: report.id,
        topic: sanitizedTopic,
        status: report.status
      }
    });
  } catch (error) {
    console.error('[GENERATE_ERROR]', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return handleError({ message: getErrorMessage('INTERNAL_ERROR') });
  }
}
