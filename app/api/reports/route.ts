import { handleError, handleSuccess } from '@/packages/lib/helpers/api-response-handlers';
import { getUser } from '@/packages/lib/helpers/supabase/auth';
import { db } from '@/packages/lib/prisma/prisma-client';

export async function GET() {
  try {
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
    console.error('Reports list retrieval error:', error);
    return handleError({ err: error instanceof Error ? error.message : 'Failed to retrieve reports' });
  }
}
