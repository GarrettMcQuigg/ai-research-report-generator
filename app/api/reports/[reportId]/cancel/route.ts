import { NextRequest } from 'next/server';
import { handleError, handleSuccess, handleBadRequest, handleNotFound } from '@/packages/lib/helpers/api-response-handlers';
import { getUser, verifyReportAccess } from '@/packages/lib/helpers/supabase/auth';
import { db } from '@/packages/lib/prisma/prisma-client';
import { inngest } from '@/packages/lib/inngest/client';
import { getErrorMessage } from '@/packages/lib/helpers/validation';
import { authenticatedReportAccessRateLimiter } from '@/packages/lib/middleware/rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    // Apply rate limiting (100 requests per minute per user)
    const rateLimitResult = await authenticatedReportAccessRateLimiter(request, 'cancel-report');
    if (rateLimitResult) {
      return rateLimitResult; // Rate limit exceeded
    }

    const user = await getUser();
    const { reportId } = await params;

    // Verify user has access to this report
    await verifyReportAccess(reportId);

    // Fetch the report
    const report = await db.report.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      console.warn('[CANCEL_REPORT_NOT_FOUND]', {
        reportId,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
      return handleNotFound({ message: getErrorMessage('RESOURCE_NOT_FOUND') });
    }

    // Check if report is still in progress
    if (report.status === 'COMPLETED' || report.status === 'FAILED' || report.status === 'CANCELLED') {
      console.warn('[CANCEL_INVALID_STATUS]', {
        reportId,
        userId: user.id,
        status: report.status,
        timestamp: new Date().toISOString(),
      });
      return handleBadRequest({ message: 'Cannot cancel this report' });
    }

    // Send cancellation event to Inngest
    // This will trigger the cancelOn configuration in the Inngest function
    await inngest.send({
      name: 'research/report.cancelled',
      data: {
        reportId: report.id,
        userId: user.id
      }
    });

    // Update report status to CANCELLED
    await db.report.update({
      where: { id: reportId },
      data: {
        status: 'CANCELLED',
        errorMessage: 'Cancelled by user'
      }
    });

    console.info('[CANCEL_SUCCESS]', {
      reportId,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    return handleSuccess({
      message: 'Report generation cancelled successfully',
      content: {
        reportId: report.id,
        status: 'CANCELLED'
      }
    });
  } catch (error) {
    console.error('[CANCEL_REPORT_ERROR]', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return handleError({ message: getErrorMessage('INTERNAL_ERROR') });
  }
}
