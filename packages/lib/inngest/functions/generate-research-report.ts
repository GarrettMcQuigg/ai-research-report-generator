import { inngest } from '../client';
import { db } from '@/packages/lib/prisma/prisma-client';
import { planResearch } from '@/packages/lib/ai-agents/research-planner';
import { conductResearch } from '@/packages/lib/ai-agents/researcher';
import { critiqueResearch } from '@/packages/lib/ai-agents/critic';
import { writeReport } from '@/packages/lib/ai-agents/writer';
import { reviewReport } from '@/packages/lib/ai-agents/reviewer';

export const generateResearchReport = inngest.createFunction(
  {
    id: 'generate-research-report',
    retries: 2, // Max 2 retries on failure
    cancelOn: [
      {
        event: 'research/report.cancelled',
        match: 'data.reportId',
      },
    ],
  },
  { event: 'research/report.requested' },
  async ({ event, step }) => {
    const { reportId, topic } = event.data;

    try {
      // Step 1: Research Planning
      const researchPlan = await step.run('plan-research', async () => {
        await db.report.update({
          where: { id: reportId },
          data: { status: 'PLANNING' }
        });

        const plan = await planResearch(topic);

        await db.report.update({
          where: { id: reportId },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: { researchPlan: plan as any }
        });

        return plan;
      });

      // Step 2: Conduct Research
      const findings = await step.run('conduct-research', async () => {
        await db.report.update({
          where: { id: reportId },
          data: { status: 'RESEARCHING' }
        });

        const research = await conductResearch(researchPlan.questions, {
          tier: 'basic',
          maxSourcesPerQuestion: 5,
          parallel: false
        });

        await db.report.update({
          where: { id: reportId },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: { findings: research as any }
        });

        return research;
      });

      // Step 3: Critique Research
      const critique = await step.run('critique-research', async () => {
        await db.report.update({
          where: { id: reportId },
          data: { status: 'CRITIQUING' }
        });

        const critiqueResult = await critiqueResearch(
          findings.findings,
          topic,
          { tier: 'basic' }
        );

        await db.report.update({
          where: { id: reportId },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: { critique: critiqueResult as any }
        });

        return critiqueResult;
      });

      // Step 4: Write Report
      const draftReport = await step.run('write-report', async () => {
        await db.report.update({
          where: { id: reportId },
          data: { status: 'WRITING' }
        });

        const report = await writeReport(
          topic,
          findings.findings,
          critique,
          'premium' // Use premium tier for better quality
        );

        return report;
      });

      // Step 5: Review and Finalize Report
      await step.run('review-report', async () => {
        await db.report.update({
          where: { id: reportId },
          data: { status: 'FORMATTING' }
        });

        const reviewed = await reviewReport(draftReport, 'basic');

        await db.report.update({
          where: { id: reportId },
          data: {
            status: 'COMPLETED',
            finalReport: reviewed.finalReport,
            completedAt: new Date(),
            reportMetadata: {
              reviewSummary: reviewed.reviewSummary,
              wordCount: reviewed.finalReport.split(/\s+/).length,
              sourceCount: findings.summary.totalSources
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any
          }
        });

        return reviewed.finalReport;
      });

      return {
        success: true,
        reportId,
        message: 'Report generated successfully'
      };
    } catch (error) {
      console.error('Research report generation failed:', error);

      // Mark report as failed
      await db.report.update({
        where: { id: reportId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      });

      throw error;
    }
  }
);
