import { NextRequest } from 'next/server';
import { handleError, handleSuccess } from '@/packages/lib/helpers/api-response-handlers';
import { getUser } from '@/packages/lib/helpers/supabase/auth';
import { db } from '@/packages/lib/prisma/prisma-client';
import { getErrorMessage } from '@/packages/lib/helpers/validation';
import { authenticatedReportAccessRateLimiter } from '@/packages/lib/middleware/rate-limit';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting (100 requests per minute per user)
    const rateLimitResult = await authenticatedReportAccessRateLimiter(request, 'list-reports');
    if (rateLimitResult) {
      return rateLimitResult; // Rate limit exceeded
    }

    const user = await getUser();

    // Fetch user's reports, ordered by most recent
    const reports = await db.report.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to 50 most recent reports
      select: {
        id: true,
        topic: true,
        status: true,
        createdAt: true,
        completedAt: true
      }
    });

    return handleSuccess({
      message: 'Reports retrieved successfully',
      content: reports
    });
  } catch (error) {
    console.error('[LIST_REPORTS_ERROR]', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return handleError({ message: getErrorMessage('INTERNAL_ERROR') });
  }
}
