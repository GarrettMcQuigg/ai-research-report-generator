import { NextRequest } from 'next/server';
import { handleError, handleSuccess } from '@/packages/lib/helpers/api-response-handlers';
import { getUser } from '@/packages/lib/helpers/supabase/auth';
import { db } from '@/packages/lib/prisma/prisma-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const user = await getUser();
    const { reportId } = await params;

    // Fetch report
    const report = await db.report.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      return handleError({ err: 'Report not found' });
    }

    // Verify ownership
    if (report.userId !== user.id) {
      return handleError({ err: 'Unauthorized access to this report' });
    }

    return handleSuccess({
      message: 'Report retrieved successfully',
      content: {
        id: report.id,
        topic: report.topic,
        status: report.status,
        finalReport: report.finalReport,
        researchPlan: report.researchPlan,
        findings: report.findings,
        critique: report.critique,
        reportMetadata: report.reportMetadata,
        errorMessage: report.errorMessage,
        createdAt: report.createdAt,
        completedAt: report.completedAt
      }
    });
  } catch (error) {
    console.error('Report retrieval error:', error);
    return handleError({ err: error instanceof Error ? error.message : 'Failed to retrieve report' });
  }
}
