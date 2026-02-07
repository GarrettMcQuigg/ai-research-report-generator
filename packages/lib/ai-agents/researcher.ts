import { generateWithRetry, parseJSONResponse } from '@/packages/lib/services/ai-service';
import type { ResearchFinding, SearchResult } from '@/packages/lib/inngest/types';
import { logger } from '@/packages/lib/logger';

/**
 * Tavily Search API Response Types
 */
interface TavilySearchResponse {
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
    published_date?: string;
  }>;
  query: string;
  response_time?: number;
}

/**
 * Researcher Agent
 *
 * Conducts web research for each question using Tavily API,
 * then synthesizes findings using AI to create comprehensive answers.
 */

/**
 * Search the web using Tavily API
 */
async function searchWithTavily(
  query: string,
  maxResults: number = 5
): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not configured in environment variables');
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        include_answer: false,
        include_raw_content: false,
        max_results: maxResults,
        include_domains: [],
        exclude_domains: [],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavily API error (${response.status}): ${errorText}`);
    }

    const data: TavilySearchResponse = await response.json();

    // Transform Tavily results to our SearchResult format
    return data.results.map(result => ({
      title: result.title,
      url: result.url,
      snippet: result.content.substring(0, 300) + (result.content.length > 300 ? '...' : ''),
      publishedDate: result.published_date,
      score: result.score,
    }));
  } catch (error) {
    logger.error(`Tavily search failed for query "${query}"`, error);
    throw new Error(`Web search failed: ${(error as Error).message}`);
  }
}

/**
 * Synthesize research findings using AI
 */
async function synthesizeFindings(
  question: string,
  sources: SearchResult[],
  tier: 'basic' | 'premium' = 'basic'
): Promise<{ answer: string; confidence: number }> {
  const systemPrompt = `You are an expert research analyst. Your job is to synthesize information from multiple sources into a comprehensive, accurate answer.

Guidelines:
- Analyze all provided sources carefully
- Create a clear, well-structured answer that directly addresses the question
- Integrate information from multiple sources where relevant
- Identify any contradictions or uncertainties in the sources
- Use neutral, objective language
- Be specific and cite concrete facts, data, and examples
- If sources are insufficient or contradictory, acknowledge limitations

Return your response as valid JSON with this structure:
{
  "answer": "Your comprehensive answer here (2-4 paragraphs)",
  "confidence": 0.85,
  "keyFindings": ["Key finding 1", "Key finding 2", ...],
  "limitations": "Any limitations or gaps in the research"
}`;

  // Build source context from search results
  const sourceContext = sources
    .map(
      (source, idx) => `
SOURCE ${idx + 1}: ${source.title}
URL: ${source.url}
${source.publishedDate ? `Published: ${source.publishedDate}` : ''}
Content: ${source.snippet}
Relevance Score: ${source.score || 'N/A'}
`
    )
    .join('\n---\n');

  const userPrompt = `Question: ${question}

Available Sources:
${sourceContext}

Synthesize the above sources into a comprehensive answer to the question. Return ONLY valid JSON, no additional text.`;

  try {
    const result = await generateWithRetry(userPrompt, {
      system: systemPrompt,
      temperature: 0.6,
      tier,
    });

    const synthesis = parseJSONResponse<{
      answer: string;
      confidence: number;
      keyFindings?: string[];
      limitations?: string;
    }>(result.text, {
      answer: 'Unable to synthesize findings from sources.',
      confidence: 0.3,
    });

    // Validate confidence is in valid range
    let confidence = synthesis.confidence;
    if (confidence > 1) {
      confidence = confidence / 100;
    }
    if (confidence < 0 || confidence > 1) {
      confidence = 0.5;
    }

    return {
      answer: synthesis.answer,
      confidence,
    };
  } catch (error) {
    logger.error('Synthesis failed', error);
    throw new Error(`Failed to synthesize findings: ${(error as Error).message}`);
  }
}

/**
 * Conduct research for a single question
 */
async function researchQuestion(
  question: string,
  tier: 'basic' | 'premium' = 'basic',
  maxSources: number = 5
): Promise<ResearchFinding> {
  try {
    // Step 1: Search for sources
    logger.info('Starting research search', { question });
    const sources = await searchWithTavily(question, maxSources);

    if (sources.length === 0) {
      throw new Error('No sources found for this question');
    }

    logger.info('Sources found, synthesizing findings', { sourceCount: sources.length });

    // Step 2: Synthesize findings with AI
    const { answer, confidence } = await synthesizeFindings(question, sources, tier);

    // Step 3: Return structured finding
    return {
      question,
      answer,
      sources,
      confidence,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Research failed for question', error, { question });
    throw new Error(`Failed to research question: ${(error as Error).message}`);
  }
}

/**
 * Main export: Conduct research for multiple questions
 *
 * @param questions - Array of research questions to investigate
 * @param options - Configuration options
 * @returns Structured research findings for all questions
 */
export async function conductResearch(
  questions: string[],
  options?: {
    tier?: 'basic' | 'premium';
    maxSourcesPerQuestion?: number;
    parallel?: boolean;
  }
): Promise<{
  findings: ResearchFinding[];
  summary: {
    totalQuestions: number;
    successfulResearches: number;
    averageConfidence: number;
    totalSources: number;
  };
}> {
  const {
    tier = 'basic',
    maxSourcesPerQuestion = 5,
    parallel = false,
  } = options || {};

  if (!questions || questions.length === 0) {
    throw new Error('No research questions provided');
  }

  logger.info('Starting research for multiple questions', { questionCount: questions.length });

  const findings: ResearchFinding[] = [];
  const errors: Array<{ question: string; error: string }> = [];

  try {
    if (parallel) {
      // Research all questions in parallel (faster but more API calls)
      const results = await Promise.allSettled(
        questions.map(q => researchQuestion(q, tier, maxSourcesPerQuestion))
      );

      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          findings.push(result.value);
        } else {
          errors.push({
            question: questions[idx],
            error: result.reason.message,
          });
          logger.error(`Failed to research question ${idx + 1}`, result.reason);
        }
      });
    } else {
      // Research questions sequentially (more reliable, rate-limit friendly)
      for (let i = 0; i < questions.length; i++) {
        try {
          logger.info(`Researching question ${i + 1}/${questions.length}`, {
            current: i + 1,
            total: questions.length
          });
          const finding = await researchQuestion(
            questions[i],
            tier,
            maxSourcesPerQuestion
          );
          findings.push(finding);

          // Add small delay between requests to avoid rate limiting
          if (i < questions.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          errors.push({
            question: questions[i],
            error: (error as Error).message,
          });
          logger.error(`Failed to research question ${i + 1}`, error);
          // Continue with other questions even if one fails
        }
      }
    }

    // Calculate summary statistics
    const totalSources = findings.reduce((sum, f) => sum + f.sources.length, 0);
    const averageConfidence =
      findings.length > 0
        ? findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length
        : 0;

    const summary = {
      totalQuestions: questions.length,
      successfulResearches: findings.length,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      totalSources,
    };

    logger.info('Research complete', summary);

    if (errors.length > 0) {
      logger.warn(`${errors.length} questions failed`, { errors });
    }

    // If all questions failed, throw error
    if (findings.length === 0) {
      throw new Error(
        `All research questions failed. Errors: ${errors.map(e => e.error).join('; ')}`
      );
    }

    return {
      findings,
      summary,
    };
  } catch (error) {
    logger.error('Research process failed', error);
    throw new Error(`Research failed: ${(error as Error).message}`);
  }
}

/**
 * Helper function to validate Tavily API configuration
 */
export function validateTavilyConfig(): { valid: boolean; error?: string } {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    return {
      valid: false,
      error: 'TAVILY_API_KEY is not configured in environment variables',
    };
  }

  if (apiKey.trim() === '') {
    return {
      valid: false,
      error: 'TAVILY_API_KEY is empty',
    };
  }

  return { valid: true };
}
