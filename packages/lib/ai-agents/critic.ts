import { generateWithRetry, parseJSONResponse } from '../services/ai-service';
import type { ResearchFinding, Critique } from '../inngest/types';

/**
 * System prompt for the Critic agent
 * This agent reviews research findings and identifies gaps, biases, and contradictions
 */
const CRITIC_SYSTEM_PROMPT = `You are a critical research analyst tasked with reviewing research findings for quality, completeness, and objectivity.

Your role is to:
1. Identify gaps in research coverage - topics or perspectives that may be missing
2. Detect potential biases - one-sided views, cherry-picked data, or unsupported claims
3. Find contradictions - inconsistencies within the research or between sources
4. Suggest additional areas to investigate - follow-up questions or angles to explore

Be thorough but constructive. Your goal is to improve the research quality, not to be overly negative.

Provide your critique in JSON format with the following structure:
{
  "confidence": number (0-1, your confidence in this critique),
  "gaps": string[] (missing topics, perspectives, or information),
  "biases": string[] (potential biases or one-sided viewpoints detected),
  "contradictions": string[] (inconsistencies or conflicting information),
  "suggestions": string[] (specific follow-up questions or areas to investigate),
  "overallAssessment": string (brief summary of the research quality)
}

Be specific in your critique. Reference specific findings or patterns you observe.`;

/**
 * Critique research findings
 * Analyzes the research for gaps, biases, contradictions, and areas for improvement
 */
export async function critiqueResearch(
  findings: ResearchFinding[],
  topic: string,
  options?: {
    temperature?: number;
    tier?: 'basic' | 'premium';
  }
): Promise<Critique> {
  const { temperature = 0.7, tier = 'basic' } = options || {};

  // Prepare the research summary for the critic
  const researchSummary = findings
    .map((finding, index) => {
      const sources = finding.sources
        .map(s => `  - ${s.title} (${s.url})`)
        .join('\n');

      return `
Finding ${index + 1}:
Question: ${finding.question}
Answer: ${finding.answer}
Confidence: ${finding.confidence}
Sources:
${sources}
`;
    })
    .join('\n---\n');

  const prompt = `Topic: ${topic}

Review the following research findings and provide a critical analysis:

${researchSummary}

Analyze these findings for:
1. Gaps - What important aspects of "${topic}" are missing or underexplored?
2. Biases - Are there any potential biases or one-sided perspectives?
3. Contradictions - Are there any inconsistencies within or between findings?
4. Suggestions - What additional questions or areas should be investigated?

Provide your critique in valid JSON format.`;

  try {
    const result = await generateWithRetry(prompt, {
      temperature,
      tier,
      system: CRITIC_SYSTEM_PROMPT,
      retries: 3,
    });

    // Parse the JSON response
    const defaultCritique: Critique = {
      confidence: 0.5,
      gaps: ['Unable to generate critique'],
      biases: [],
      contradictions: [],
      suggestions: [],
      overallAssessment: 'Critique generation failed',
    };

    const critique = parseJSONResponse<Critique>(result.text, defaultCritique);

    // Ensure confidence is between 0 and 1
    if (critique.confidence > 1) {
      critique.confidence = critique.confidence / 100;
    }

    // Ensure all arrays are defined
    critique.gaps = critique.gaps || [];
    critique.biases = critique.biases || [];
    critique.contradictions = critique.contradictions || [];
    critique.suggestions = critique.suggestions || [];

    return critique;
  } catch (error) {
    console.error('Failed to critique research:', error);

    // Return a safe fallback critique
    return {
      confidence: 0.3,
      gaps: ['Unable to complete critique due to technical error'],
      biases: [],
      contradictions: [],
      suggestions: ['Retry the critique process'],
      overallAssessment: 'Critique failed due to technical error',
    };
  }
}

/**
 * Validate a critique
 * Ensures the critique has meaningful content
 */
export function validateCritique(critique: Critique): boolean {
  // Check if critique has at least some content
  const hasContent =
    critique.gaps.length > 0 ||
    critique.biases.length > 0 ||
    critique.contradictions.length > 0 ||
    critique.suggestions.length > 0;

  // Check if confidence is reasonable
  const hasValidConfidence = critique.confidence >= 0 && critique.confidence <= 1;

  // Check if overall assessment exists
  const hasAssessment = Boolean(critique.overallAssessment && critique.overallAssessment.length > 0);

  return hasContent && hasValidConfidence && hasAssessment;
}

/**
 * Merge multiple critiques into a single comprehensive critique
 * Useful if multiple critics review the same research
 */
export function mergeCritiques(critiques: Critique[]): Critique {
  if (critiques.length === 0) {
    return {
      confidence: 0,
      gaps: [],
      biases: [],
      contradictions: [],
      suggestions: [],
      overallAssessment: 'No critiques provided',
    };
  }

  if (critiques.length === 1) {
    return critiques[0];
  }

  // Calculate average confidence
  const avgConfidence =
    critiques.reduce((sum, c) => sum + c.confidence, 0) / critiques.length;

  // Merge all arrays, removing duplicates
  const mergeArray = (arrays: string[][]): string[] => {
    const uniqueItems = new Set<string>();
    arrays.forEach(arr => arr.forEach(item => uniqueItems.add(item)));
    return Array.from(uniqueItems);
  };

  return {
    confidence: avgConfidence,
    gaps: mergeArray(critiques.map(c => c.gaps)),
    biases: mergeArray(critiques.map(c => c.biases)),
    contradictions: mergeArray(critiques.map(c => c.contradictions)),
    suggestions: mergeArray(critiques.map(c => c.suggestions)),
    overallAssessment: critiques
      .map((c, i) => `Critique ${i + 1}: ${c.overallAssessment}`)
      .join('\n\n'),
  };
}
