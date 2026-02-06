import { NextRequest } from 'next/server';
import { handleError, handleSuccess } from '@/packages/lib/helpers/api-response-handlers';
import { getUser, verifyReportAccess } from '@/packages/lib/helpers/supabase/auth';
import { db } from '@/packages/lib/prisma/prisma-client';
import { inngest } from '@/packages/lib/inngest/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const user = await getUser();
    const { reportId } = await params;

    // Verify user has access to this report
    await verifyReportAccess(reportId);

    // Fetch the report
    const report = await db.report.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      return handleError({ err: 'Report not found' });
    }

    // Check if report is still in progress
    if (report.status === 'COMPLETED' || report.status === 'FAILED' || report.status === 'CANCELLED') {
      return handleError({ err: `Cannot cancel report with status: ${report.status}` });
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

    return handleSuccess({
      message: 'Report generation cancelled successfully',
      content: {
        reportId: report.id,
        status: 'CANCELLED'
      }
    });
  } catch (error) {
    console.error('Report cancellation error:', error);
    return handleError({ err: error instanceof Error ? error.message : 'Failed to cancel report' });
  }
}
