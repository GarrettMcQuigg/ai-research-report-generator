import { generateWithRetry, parseJSONResponse } from '@/packages/lib/services/ai-service';

/**
 * Research Plan Structure
 */
export interface ResearchPlan {
  questions: string[];
  areas: string[];
  approach: string;
}

/**
 * Research Planner Agent
 *
 * Takes a research topic and breaks it down into focused research questions
 * and key areas to investigate. This is Agent #1 in the multi-agent research
 * workflow orchestrated by Inngest.
 *
 * @param topic - The research topic to plan for
 * @returns A structured research plan with questions, areas, and approach
 */
export async function planResearch(topic: string): Promise<ResearchPlan> {
  const systemPrompt = `You are an expert research planner with deep knowledge across multiple domains. Your role is to analyze research topics and create comprehensive, well-structured research plans.

Your responsibilities:
1. Break down complex topics into 5-7 focused, actionable research questions
2. Identify 3-5 key areas that need investigation
3. Provide a clear research approach strategy

Guidelines for research questions:
- Each question should be specific, focused, and answerable through research
- Questions should cover different aspects of the topic (breadth)
- Questions should allow for depth and detailed analysis
- Avoid yes/no questions - prefer "how", "what", "why", "when" questions
- Consider: definitions, history, current state, key players, impacts, challenges, future trends, comparisons

Guidelines for key areas:
- Identify the main domains or categories that need exploration
- Keep areas broad enough to be meaningful but specific enough to be actionable
- Areas should collectively cover the full scope of the topic

Return your response as a valid JSON object with this exact structure:
{
  "questions": [
    "Question 1?",
    "Question 2?",
    "Question 3?",
    "Question 4?",
    "Question 5?"
  ],
  "areas": [
    "Area 1",
    "Area 2",
    "Area 3"
  ],
  "approach": "Brief explanation of the overall research strategy and methodology"
}

Important: Return ONLY the JSON object, no additional text or formatting.`;

  const userPrompt = `Create a comprehensive research plan for the following topic:

Topic: ${topic}

Generate 5-7 focused research questions and 3-5 key areas to investigate. Return ONLY valid JSON.`;

  try {
    // Use GPT-4o-mini for cost efficiency with retry logic
    const result = await generateWithRetry(userPrompt, {
      system: systemPrompt,
      temperature: 0.7,
      tier: 'basic', // gpt-4o-mini
      retries: 3,
    });

    // Parse the JSON response with fallback
    const plan = parseJSONResponse<ResearchPlan>(result.text, {
      questions: [],
      areas: [],
      approach: '',
    });

    // Validate the response
    if (!plan.questions || plan.questions.length === 0) {
      throw new Error('No research questions generated');
    }

    if (!plan.areas || plan.areas.length === 0) {
      throw new Error('No research areas identified');
    }

    // Ensure we have 5-7 questions
    if (plan.questions.length < 5) {
      throw new Error(`Only ${plan.questions.length} questions generated, need at least 5`);
    }

    if (plan.questions.length > 7) {
      // Trim to 7 questions max
      plan.questions = plan.questions.slice(0, 7);
    }

    // Ensure we have 3-5 areas
    if (plan.areas.length > 5) {
      plan.areas = plan.areas.slice(0, 5);
    }

    return plan;
  } catch (error) {
    console.error('Research planning failed:', error);
    throw new Error(`Failed to plan research: ${(error as Error).message}`);
  }
}

