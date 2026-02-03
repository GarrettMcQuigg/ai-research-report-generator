# AI Agents for Research Report Generation

This directory contains the AI agents used in the multi-agent research workflow. The agents are orchestrated by Inngest to generate comprehensive research reports.

## Agent #1: Research Planner

**File:** `research-planner.ts`

**Purpose:** Takes a research topic and breaks it down into focused research questions and key areas to investigate.

**Usage:**

```typescript
import { planResearch } from '@/packages/lib/ai-agents/research-planner';

const topic = "The impact of quantum computing on cryptography";

try {
  const plan = await planResearch(topic);

  console.log('Research Questions:', plan.questions);
  // Output: Array of 5-7 focused research questions

  console.log('Key Areas:', plan.areas);
  // Output: Array of 3-5 key areas to investigate

  console.log('Approach:', plan.approach);
  // Output: String describing the research strategy
} catch (error) {
  console.error('Planning failed:', error);
}
```

**Output Structure:**

```typescript
interface ResearchPlan {
  questions: string[];  // 5-7 focused research questions
  areas: string[];      // 3-5 key areas to investigate
  approach: string;     // Research strategy explanation
}
```

**Example Output:**

```json
{
  "questions": [
    "What is quantum computing and how does it differ from classical computing?",
    "How do current cryptographic systems rely on computational complexity?",
    "What specific cryptographic algorithms are vulnerable to quantum attacks?",
    "What is post-quantum cryptography and how does it address quantum threats?",
    "What is the current state of quantum computing development?",
    "How are organizations preparing for the quantum computing transition?",
    "What are the implications for data encrypted today?"
  ],
  "areas": [
    "Quantum Computing Fundamentals",
    "Current Cryptographic Systems",
    "Quantum Threats to Encryption",
    "Post-Quantum Cryptography Solutions",
    "Industry Response and Transition Timeline"
  ],
  "approach": "Begin with foundational understanding of quantum computing principles, then examine current cryptographic vulnerabilities, explore emerging post-quantum solutions, and assess real-world implications and transition strategies."
}
```

## Implementation Details

- **Model:** GPT-4o-mini for cost efficiency
- **Temperature:** 0.7 for balanced creativity and consistency
- **Max Tokens:** 1500
- **Dependencies:** Vercel AI SDK, OpenAI API
- **Environment Variables:** OPENAI_API_KEY

## Agent #4: Writer

**File:** `writer.ts`

**Purpose:** Synthesizes research findings into a comprehensive, well-structured research report with proper citations and professional formatting.

**Usage:**

```typescript
import { writeReport } from '@/packages/lib/ai-agents/writer';

const topic = "The impact of quantum computing on cryptography";
const findings: ResearchFinding[] = [...]; // From Researcher agent
const critique: Critique = {...}; // From Critic agent (optional)

try {
  const report = await writeReport(topic, findings, critique, 'premium');

  console.log('Report Generated:', report);
  // Output: Markdown-formatted comprehensive research report

  console.log('Word Count:', estimateWordCount(report));
  // Output: Estimated word count (target: 1500-2500 words)
} catch (error) {
  console.error('Report writing failed:', error);
}
```

**Function Signature:**

```typescript
async function writeReport(
  topic: string,
  findings: ResearchFinding[],
  critique?: Critique,
  tier: 'basic' | 'premium' = 'premium'
): Promise<string>
```

**Parameters:**
- `topic` - The research topic title
- `findings` - Array of research findings from the Researcher agent
- `critique` - Optional critique from the Critic agent to address gaps/issues
- `tier` - Model tier to use ('basic' = gpt-4o-mini, 'premium' = gpt-4o). Defaults to 'premium' for higher quality writing.

**Report Structure:**

The Writer agent generates reports with the following sections:

1. **Executive Summary** (3-4 paragraphs)
   - Key findings and conclusions
   - Main takeaways for decision-makers

2. **Introduction** (2-3 paragraphs)
   - Background and context
   - Research scope and objectives
   - Why the topic matters

3. **Main Findings** (Multiple sections)
   - Organized by theme or research question
   - Clear subsection headings
   - Evidence with inline citations [1], [2], etc.
   - Relevant data and examples

4. **Analysis** (3-4 paragraphs)
   - Synthesis of findings across sources
   - Patterns, trends, and relationships
   - Implications and significance
   - Limitations and uncertainties

5. **Conclusion** (2-3 paragraphs)
   - Summary of key insights
   - Future outlook or recommendations
   - Final assessment

6. **Sources**
   - Numbered list of all cited sources
   - Includes title, URL, and brief description

**Helper Functions:**

```typescript
// Extract unique sources from findings
const sources = extractSources(findings);
// Returns: Array of unique source objects

// Estimate word count from markdown
const wordCount = estimateWordCount(report);
// Returns: Number of words in the report
```

**Model Configuration:**
- **Default Model:** GPT-4o (premium tier) for highest quality writing
- **Temperature:** 0.7 for balanced creativity and coherence
- **Target Length:** 1500-2500 words
- **Output Format:** Markdown

**Writing Guidelines:**
- Professional, academic style
- Objective and balanced perspective
- Proper inline citations [1], [2], etc.
- Specific data, examples, and evidence
- Logical structure with smooth transitions
- Addresses gaps identified in critique
- Suitable for educated audience

**Quality Validation:**

The agent performs automatic validation:
- Checks report length (minimum 500 characters)
- Verifies presence of required sections:
  - Executive Summary
  - Introduction
  - Sources
- Logs warnings if sections are missing

**Example Output:**

```markdown
## Executive Summary

Quantum computing represents a fundamental shift in computational paradigms,
leveraging quantum mechanical phenomena to solve problems intractable for
classical computers [1]. This emerging technology poses significant threats to
current cryptographic systems, particularly those based on integer factorization
and discrete logarithm problems [2]. As quantum computers advance, the security
of encrypted data—both present and past—faces unprecedented challenges [3].

...

## Sources

1. IBM Quantum Computing: Introduction to Quantum Computing
   https://www.ibm.com/quantum-computing/
   Comprehensive overview of quantum computing principles...

2. NIST Post-Quantum Cryptography Project
   https://csrc.nist.gov/projects/post-quantum-cryptography
   Details on standardization efforts for quantum-resistant algorithms...
```

## Agent Workflow

1. **Research Planner** - Creates research plan
2. **Researcher** - Conducts web research for each question
3. **Critic** - Reviews and critiques the research
4. **Writer** - Synthesizes everything into a final report (this agent)
5. **Reviewer** - Final quality check and validation

## Error Handling

The agent includes comprehensive error handling:
- JSON parsing with multiple fallback strategies
- Validation of question and area counts
- Detailed error messages for debugging
- Automatic trimming if AI returns too many items

## Notes

- Questions are kept between 5-7 to ensure comprehensive coverage without overwhelming
- Areas are limited to 3-5 for focused investigation
- System prompt emphasizes avoiding yes/no questions
- Response parsing handles markdown code blocks and raw JSON
