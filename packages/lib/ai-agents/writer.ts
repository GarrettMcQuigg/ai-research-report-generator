import { generateWithRetry } from '@/packages/lib/services/ai-service';
import type { ResearchFinding, Critique } from '@/packages/lib/inngest/types';
import { logger } from '@/packages/lib/logger';

/**
 * Writer Agent
 *
 * Synthesizes research findings into a comprehensive, well-structured report
 * with proper citations and professional formatting.
 */
export async function writeReport(
  topic: string,
  findings: ResearchFinding[],
  critique?: Critique,
  tier: 'basic' | 'premium' = 'premium'
): Promise<string> {
  const systemPrompt = `You are a professional research analyst and technical writer. Your job is to synthesize research findings into comprehensive, well-structured reports.

Writing Guidelines:
- Write in clear, professional, academic style
- Use proper citations in [Source #] format
- Maintain objectivity and balance multiple perspectives
- Include specific data, examples, and evidence
- Structure information logically with smooth transitions
- Address any gaps or limitations identified in the critique
- Ensure all claims are properly cited
- Write for an educated audience but avoid unnecessary jargon

Report Structure:
1. Executive Summary (3-4 paragraphs)
   - Key findings and conclusions
   - Main takeaways for decision-makers

2. Introduction (2-3 paragraphs)
   - Background and context
   - Research scope and objectives
   - Why this topic matters

3. Main Findings (Multiple sections)
   - Organize by theme or research question
   - Use clear subsection headings
   - Present evidence with citations
   - Include relevant data and examples

4. Analysis (3-4 paragraphs)
   - Synthesize findings across sources
   - Identify patterns, trends, and relationships
   - Discuss implications and significance
   - Address limitations and uncertainties

5. Conclusion (2-3 paragraphs)
   - Summarize key insights
   - Future outlook or recommendations
   - Final assessment

6. Sources
   - Numbered list of all cited sources
   - Include title, URL, and brief description

Format:
- Use markdown formatting
- Use ## for main section headings
- Use ### for subsection headings
- Use proper markdown lists, bold, and italics
- Citations should be inline: [1], [2], etc.
- Aim for 1500-2500 words total`;

  // Prepare findings summary
  const findingsSummary = findings
    .map((finding, idx) => {
      const sources = finding.sources
        .map((s) => `  - [${s.title}](${s.url})\n    ${s.snippet}`)
        .join('\n');

      return `Question ${idx + 1}: ${finding.question}
Answer: ${finding.answer}
Confidence: ${(finding.confidence * 100).toFixed(0)}%
Sources:
${sources}
`;
    })
    .join('\n---\n\n');

  // Prepare critique summary
  const critiqueSummary = critique
    ? `
Critique Analysis:
- Overall Confidence: ${(critique.confidence * 100).toFixed(0)}%
- Identified Gaps: ${critique.gaps.join('; ')}
- Suggestions: ${critique.suggestions.join('; ')}
- Potential Biases: ${critique.biases.join('; ')}
- Contradictions: ${critique.contradictions.join('; ')}
- Assessment: ${critique.overallAssessment}
`
    : '';

  const userPrompt = `Write a comprehensive research report on the following topic:

Topic: ${topic}

Research Findings:
${findingsSummary}
${critiqueSummary}

Instructions:
1. Synthesize ALL the research findings into a cohesive narrative
2. Address any gaps or issues identified in the critique
3. Use inline citations [1], [2], etc. for every factual claim
4. Create a complete Sources section at the end with numbered references
5. Follow the structure outlined in the system prompt
6. Maintain professional, objective tone throughout
7. Aim for depth and comprehensiveness

Return ONLY the markdown-formatted report. No preamble or meta-commentary.`;

  try {
    const result = await generateWithRetry(userPrompt, {
      system: systemPrompt,
      temperature: 0.7,
      tier, // Use premium model (gpt-4o) for higher quality writing
    });

    // Validate the report
    const report = result.text.trim();

    if (!report || report.length < 500) {
      throw new Error('Generated report is too short or empty');
    }

    // Check for required sections
    const hasExecutiveSummary = /##\s*Executive Summary/i.test(report);
    const hasIntroduction = /##\s*Introduction/i.test(report);
    const hasSources = /##\s*Sources/i.test(report);

    if (!hasExecutiveSummary || !hasIntroduction || !hasSources) {
      logger.warn('Report may be missing required sections', {
        hasExecutiveSummary,
        hasIntroduction,
        hasSources
      });
      // Continue anyway - the AI might have used slightly different formatting
    }

    return report;
  } catch (error) {
    logger.error('Report writing failed', error);
    throw new Error(`Failed to write report: ${(error as Error).message}`);
  }
}

/**
 * Helper function to extract all unique sources from findings
 */
export function extractSources(findings: ResearchFinding[]): Array<{
  title: string;
  url: string;
  snippet: string;
}> {
  const sourcesMap = new Map<string, { title: string; url: string; snippet: string }>();

  findings.forEach(finding => {
    finding.sources.forEach(source => {
      if (!sourcesMap.has(source.url)) {
        sourcesMap.set(source.url, {
          title: source.title,
          url: source.url,
          snippet: source.snippet,
        });
      }
    });
  });

  return Array.from(sourcesMap.values());
}

/**
 * Helper function to estimate word count from markdown
 */
export function estimateWordCount(markdown: string): number {
  // Remove markdown formatting
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
    .replace(/[#*_~`]/g, '') // Remove markdown symbols
    .replace(/\n+/g, ' '); // Replace newlines with spaces

  // Count words
  return plainText.split(/\s+/).filter(word => word.length > 0).length;
}
