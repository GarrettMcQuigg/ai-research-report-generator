import { NextRequest } from 'next/server';
import { handleError, handleSuccess, handleNotFound } from '@/packages/lib/helpers/api-response-handlers';
import { getUser } from '@/packages/lib/helpers/supabase/auth';
import { db } from '@/packages/lib/prisma/prisma-client';
import { getErrorMessage } from '@/packages/lib/helpers/validation';
import { authenticatedReportAccessRateLimiter } from '@/packages/lib/middleware/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    // Apply rate limiting (100 requests per minute per user)
    const rateLimitResult = await authenticatedReportAccessRateLimiter(request, 'get-report');
    if (rateLimitResult) {
      return rateLimitResult; // Rate limit exceeded
    }

    const user = await getUser();
    const { reportId } = await params;

    // Fetch report
    const report = await db.report.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      console.warn('[REPORT_NOT_FOUND]', {
        reportId,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
      return handleNotFound({ message: getErrorMessage('RESOURCE_NOT_FOUND') });
    }

    // Verify ownership
    if (report.userId !== user.id) {
      console.warn('[UNAUTHORIZED_REPORT_ACCESS]', {
        reportId,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
      return handleError({ message: getErrorMessage('UNAUTHORIZED') });
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
    console.error('[GET_REPORT_ERROR]', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return handleError({ message: getErrorMessage('INTERNAL_ERROR') });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    // Apply rate limiting (100 requests per minute per user)
    const rateLimitResult = await authenticatedReportAccessRateLimiter(request, 'delete-report');
    if (rateLimitResult) {
      return rateLimitResult; // Rate limit exceeded
    }

    const user = await getUser();
    const { reportId } = await params;

    // Fetch report to verify ownership
    const report = await db.report.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      console.warn('[DELETE_REPORT_NOT_FOUND]', {
        reportId,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
      return handleNotFound({ message: getErrorMessage('RESOURCE_NOT_FOUND') });
    }

    // Verify ownership
    if (report.userId !== user.id) {
      console.warn('[DELETE_UNAUTHORIZED]', {
        reportId,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
      return handleError({ message: getErrorMessage('UNAUTHORIZED') });
    }

    // Delete the report
    await db.report.delete({
      where: { id: reportId }
    });

    console.info('[DELETE_SUCCESS]', {
      reportId,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    return handleSuccess({
      message: 'Report deleted successfully',
      content: {
        reportId: report.id
      }
    });
  } catch (error) {
    console.error('[DELETE_REPORT_ERROR]', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return handleError({ message: getErrorMessage('INTERNAL_ERROR') });
  }
}
