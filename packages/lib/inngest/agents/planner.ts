import { generateWithRetry, parseJSONResponse } from '@/packages/lib/services/ai-service';
import type { ResearchPlan } from '../types';

/**
 * Research Planner Agent
 *
 * Breaks down a research topic into 3-5 focused research questions
 * that will provide comprehensive coverage of the topic.
 */
export async function planResearch(
  topic: string,
  tier: 'basic' | 'premium' = 'basic'
): Promise<ResearchPlan> {
  const systemPrompt = `You are an expert research planner. Your job is to break down complex topics into focused, actionable research questions.

Guidelines:
- Generate 3-5 specific research questions that cover different aspects of the topic
- Questions should be clear, focused, and answerable through web research
- Cover breadth (different perspectives) and depth (detailed analysis)
- Avoid yes/no questions - use "how", "what", "why", "when" questions
- Consider: definitions, history, current state, comparisons, impacts, future trends

Return your response as a valid JSON object with this exact structure:
{
  "questions": ["Question 1?", "Question 2?", ...],
  "approach": "Brief explanation of research strategy",
  "estimatedDepth": "shallow" | "medium" | "deep"
}`;

  const userPrompt = `Break down this topic into research questions:

Topic: ${topic}

Return ONLY valid JSON, no additional text.`;

  try {
    const result = await generateWithRetry(userPrompt, {
      system: systemPrompt,
      temperature: 0.7,
      maxTokens: 1000,
      tier,
    });

    // Parse the JSON response
    const plan = parseJSONResponse<ResearchPlan>(result.text, {
      questions: [
        `What is ${topic}?`,
        `What are the key aspects of ${topic}?`,
        `What is the current state of ${topic}?`,
      ],
      approach: 'General overview approach',
      estimatedDepth: 'medium',
    });

    // Validate the response
    if (!plan.questions || plan.questions.length === 0) {
      throw new Error('No research questions generated');
    }

    if (plan.questions.length > 7) {
      // Trim to 5 questions max
      plan.questions = plan.questions.slice(0, 5);
    }

    return plan;
  } catch (error) {
    console.error('Research planning failed:', error);
    throw new Error(`Failed to plan research: ${(error as Error).message}`);
  }
}
