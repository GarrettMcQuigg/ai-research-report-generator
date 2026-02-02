/**
 * Inngest Event Types
 */

export type Events = {
  'research/topic.submitted': {
    data: {
      reportId: string;
      topic: string;
      userId: string;
      tier?: 'basic' | 'premium';
    };
  };
  'research/report.completed': {
    data: {
      reportId: string;
      userId: string;
      topic: string;
    };
  };
  'research/report.failed': {
    data: {
      reportId: string;
      userId: string;
      topic: string;
      error: string;
    };
  };
};

/**
 * Research Plan Structure
 */
export interface ResearchPlan {
  questions: string[];
  approach: string;
  estimatedDepth: 'shallow' | 'medium' | 'deep';
}

/**
 * Search Result from Web Search API
 */
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  score?: number;
}

/**
 * Research Finding from Researcher Agent
 */
export interface ResearchFinding {
  question: string;
  answer: string;
  sources: SearchResult[];
  confidence: number;
  timestamp: string;
}

/**
 * Validation Report from Validator Agent
 */
export interface ValidationReport {
  overallScore: number;
  issues: {
    type: 'outdated' | 'low-credibility' | 'duplicate' | 'missing-citation';
    severity: 'low' | 'medium' | 'high';
    description: string;
    affectedSources: string[];
  }[];
  recommendations: string[];
}

/**
 * Critique from Critic Agent
 */
export interface Critique {
  confidence: number;
  gaps: string[];
  suggestions: string[];
  biases: string[];
  contradictions: string[];
  overallAssessment: string;
}

/**
 * Report Metadata
 */
export interface ReportMetadata {
  sources: SearchResult[];
  confidence: number;
  timestamps: {
    planned: Date;
    researched: Date;
    validated: Date;
    critiqued: Date;
    written: Date;
  };
  agentVersions?: Record<string, string>;
  costEstimate?: {
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
  };
}
