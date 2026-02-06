import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

/**
 * AI Model Configuration
 */
export type ModelTier = 'basic' | 'premium';

export function getModel(tier: ModelTier = 'basic') {
  switch (tier) {
    case 'basic':
      // GPT-4o mini for cost-effective generation
      return openai('gpt-4o-mini');

    case 'premium':
      // GPT-4o for highest quality
      return openai('gpt-4o');

    default:
      return openai('gpt-4o-mini');
  }
}

/**
 * Generate text with retry logic and exponential backoff
 *
 * @param prompt - The prompt to send to the AI
 * @param options - Generation options
 * @param options.temperature - Creativity level (0-2, default 0.7)
 * @param options.tier - Model tier ('basic' = gpt-4o-mini, 'premium' = gpt-4o)
 * @param options.system - System prompt
 * @param options.retries - Max retry attempts (default 3)
 * @returns Generated text result
 */
export async function generateWithRetry(
  prompt: string,
  options?: {
    temperature?: number;
    tier?: ModelTier;
    system?: string;
    retries?: number;
  }
) {
  const {
    temperature = 0.7,
    tier = 'basic',
    system,
    retries = 3,
  } = options || {};

  const model = getModel(tier);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await generateText({
        model,
        prompt,
        temperature,
        system,
      });

      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`AI generation attempt ${attempt + 1} failed:`, error);

      // Wait before retrying (exponential backoff)
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw new Error(`AI generation failed after ${retries} attempts: ${lastError?.message}`);
}

/**
 * Parse JSON from AI response with fallback
 */
export function parseJSONResponse<T>(text: string, fallback: T): T {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // Try to parse directly
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
    return fallback;
  }
}

/**
 * Extract confidence score from text
 */
export function extractConfidence(text: string): number {
  const confidenceMatch = text.match(/confidence[:\s]+(\d+\.?\d*)/i);
  if (confidenceMatch) {
    const confidence = parseFloat(confidenceMatch[1]);
    // If it's a percentage, convert to 0-1
    return confidence > 1 ? confidence / 100 : confidence;
  }
  return 0.7; // Default confidence
}
