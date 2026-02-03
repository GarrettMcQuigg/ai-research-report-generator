import { generateWithRetry } from '@/packages/lib/services/ai-service';

/**
 * Review Result Structure
 */
export interface ReviewResult {
  finalReport: string;
  reviewSummary: {
    changesCount: number;
    categories: {
      factualCorrections: number;
      clarityImprovements: number;
      citationFixes: number;
      structuralChanges: number;
      styleEnhancements: number;
    };
    majorChanges: string[];
    overallQuality: 'excellent' | 'good' | 'fair' | 'needs-work';
    readabilityScore: number; // 0-100
  };
}

/**
 * Reviewer Agent
 *
 * Final review and editing of the generated research report.
 * Checks for accuracy, clarity, completeness, and proper citations.
 * Makes editorial improvements and returns a polished final report.
 */
export async function reviewReport(
  report: string,
  tier: 'basic' | 'premium' = 'basic'
): Promise<ReviewResult> {
  const systemPrompt = `You are an expert editor and fact-checker for academic and research reports. Your job is to review and improve research reports for accuracy, clarity, and completeness.

Review Guidelines:

1. **Accuracy & Factual Correctness**
   - Verify claims are properly supported by sources
   - Check for logical inconsistencies or contradictions
   - Ensure data and statistics are presented correctly
   - Flag any unsupported assertions

2. **Clarity & Readability**
   - Improve sentence structure and flow
   - Eliminate jargon where possible, or explain when necessary
   - Ensure smooth transitions between sections
   - Break up overly complex paragraphs
   - Use active voice where appropriate

3. **Citations & Sources**
   - Verify all claims have proper citations
   - Check citation formatting is consistent
   - Ensure sources are credible and relevant
   - Add citations where missing

4. **Structure & Organization**
   - Verify logical flow of ideas
   - Ensure sections are well-organized
   - Check that introduction and conclusion align
   - Verify headings are descriptive and hierarchical

5. **Style & Polish**
   - Maintain professional, objective tone
   - Fix grammar, spelling, and punctuation
   - Ensure consistent terminology
   - Remove redundancies
   - Improve overall readability

Return your response as a valid JSON object with this structure:
{
  "finalReport": "The complete, improved markdown report",
  "reviewSummary": {
    "changesCount": <number>,
    "categories": {
      "factualCorrections": <number>,
      "clarityImprovements": <number>,
      "citationFixes": <number>,
      "structuralChanges": <number>,
      "styleEnhancements": <number>
    },
    "majorChanges": ["Description of significant change 1", "Description of change 2", ...],
    "overallQuality": "excellent" | "good" | "fair" | "needs-work",
    "readabilityScore": <0-100>
  }
}

Important:
- Return ONLY valid JSON, no additional text
- Keep all original citations and sources intact (unless incorrect)
- Preserve the markdown formatting
- Make substantive improvements, not just cosmetic changes
- If the report is already excellent, minimal changes are fine
- Be thorough but don't over-edit or change the author's voice unnecessarily`;

  const userPrompt = `Review and improve this research report:

${report}

Analyze the report thoroughly and return the improved version with a detailed review summary.
Return ONLY valid JSON, no additional text.`;

  try {
    const result = await generateWithRetry(userPrompt, {
      system: systemPrompt,
      temperature: 0.3, // Lower temperature for more consistent, careful editing
      tier,
    });

    // Parse the JSON response
    const reviewResult = parseReviewResponse(result.text, report);

    // Validate the response
    if (!reviewResult.finalReport || reviewResult.finalReport.trim().length === 0) {
      throw new Error('No final report generated');
    }

    if (reviewResult.finalReport.length < report.length * 0.5) {
      // Report was cut too short - might be an error
      console.warn('Reviewed report is significantly shorter than original');
    }

    return reviewResult;
  } catch (error) {
    console.error('Report review failed:', error);
    throw new Error(`Failed to review report: ${(error as Error).message}`);
  }
}

/**
 * Parse review response with fallback
 */
function parseReviewResponse(text: string, originalReport: string): ReviewResult {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;

    const parsed = JSON.parse(jsonText);

    // Ensure all required fields exist
    return {
      finalReport: parsed.finalReport || originalReport,
      reviewSummary: {
        changesCount: parsed.reviewSummary?.changesCount || 0,
        categories: {
          factualCorrections: parsed.reviewSummary?.categories?.factualCorrections || 0,
          clarityImprovements: parsed.reviewSummary?.categories?.clarityImprovements || 0,
          citationFixes: parsed.reviewSummary?.categories?.citationFixes || 0,
          structuralChanges: parsed.reviewSummary?.categories?.structuralChanges || 0,
          styleEnhancements: parsed.reviewSummary?.categories?.styleEnhancements || 0,
        },
        majorChanges: parsed.reviewSummary?.majorChanges || [],
        overallQuality: parsed.reviewSummary?.overallQuality || 'good',
        readabilityScore: parsed.reviewSummary?.readabilityScore || 75,
      },
    };
  } catch (error) {
    console.error('Failed to parse review response:', error);

    // Return original report with minimal review summary
    return {
      finalReport: originalReport,
      reviewSummary: {
        changesCount: 0,
        categories: {
          factualCorrections: 0,
          clarityImprovements: 0,
          citationFixes: 0,
          structuralChanges: 0,
          styleEnhancements: 0,
        },
        majorChanges: ['Review parsing failed - returning original report'],
        overallQuality: 'needs-work',
        readabilityScore: 50,
      },
    };
  }
}

/**
 * Quick validation check (lighter weight than full review)
 * Useful for checking if a report needs review before committing resources
 */
export async function quickValidate(
  report: string,
  tier: 'basic' | 'premium' = 'basic'
): Promise<{
  needsReview: boolean;
  issues: string[];
  estimatedQuality: 'excellent' | 'good' | 'fair' | 'needs-work';
}> {
  const systemPrompt = `You are a research report validator. Quickly assess if a report needs editorial review.

Check for:
- Missing or incorrect citations
- Factual inconsistencies
- Poor readability or structure
- Grammar and style issues
- Incomplete sections

Return ONLY valid JSON:
{
  "needsReview": true/false,
  "issues": ["issue 1", "issue 2", ...],
  "estimatedQuality": "excellent" | "good" | "fair" | "needs-work"
}`;

  const userPrompt = `Quickly validate this report and determine if it needs detailed review:

${report.substring(0, 3000)}... [truncated for quick check]

Return ONLY valid JSON, no additional text.`;

  try {
    const result = await generateWithRetry(userPrompt, {
      system: systemPrompt,
      temperature: 0.2,
      tier,
    });

    const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/);
    const jsonText = jsonMatch ? jsonMatch[1] : result.text;

    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Quick validation failed:', error);
    // Default to needing review if validation fails
    return {
      needsReview: true,
      issues: ['Validation check failed - recommend full review'],
      estimatedQuality: 'needs-work',
    };
  }
}
