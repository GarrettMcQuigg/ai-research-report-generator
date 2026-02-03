# Research Planner Agent - Usage Examples

## Basic Usage

```typescript
import { planResearch } from '@/packages/lib/ai-agents/research-planner';

// Example 1: Basic research planning
async function example1() {
  const topic = "The impact of artificial intelligence on healthcare";

  const plan = await planResearch(topic);

  console.log('Generated Research Plan:');
  console.log('======================');
  console.log('\nQuestions to investigate:');
  plan.questions.forEach((q, i) => {
    console.log(`${i + 1}. ${q}`);
  });

  console.log('\nKey areas to explore:');
  plan.areas.forEach((area, i) => {
    console.log(`${i + 1}. ${area}`);
  });

  console.log('\nResearch Approach:');
  console.log(plan.approach);
}
```

## Integration with Inngest Workflow

```typescript
import { inngest } from '@/packages/lib/inngest/client';
import { planResearch } from '@/packages/lib/ai-agents/research-planner';
import { conductResearch } from '@/packages/lib/ai-agents/researcher';

// Inngest function that uses the Research Planner
export const generateResearchReport = inngest.createFunction(
  { id: 'generate-research-report' },
  { event: 'research/topic.submitted' },
  async ({ event, step }) => {
    const { reportId, topic, tier = 'basic' } = event.data;

    // Step 1: Plan the research
    const plan = await step.run('plan-research', async () => {
      console.log(`Planning research for: ${topic}`);
      return await planResearch(topic);
    });

    console.log(`Generated ${plan.questions.length} research questions`);
    console.log(`Identified ${plan.areas.length} key areas`);

    // Step 2: Conduct research for each question
    const research = await step.run('conduct-research', async () => {
      return await conductResearch(plan.questions, {
        tier,
        maxSourcesPerQuestion: 5,
        parallel: false,
      });
    });

    // Step 3-5: Continue with other agents...
    // (Validator, Critic, Writer)

    return {
      reportId,
      plan,
      research,
      status: 'completed',
    };
  }
);
```

## Example Output

### Input
```typescript
const topic = "The future of renewable energy storage";
```

### Output
```json
{
  "questions": [
    "What are the main technologies currently used for renewable energy storage?",
    "What are the key challenges in storing energy from renewable sources?",
    "How do battery technologies compare in terms of efficiency and cost for large-scale storage?",
    "What role does grid infrastructure play in renewable energy storage?",
    "What emerging technologies show promise for future energy storage solutions?",
    "How are different countries approaching renewable energy storage at scale?",
    "What are the economic and environmental implications of various storage methods?"
  ],
  "areas": [
    "Current Storage Technologies",
    "Technical and Economic Challenges",
    "Emerging Innovations",
    "Grid Integration and Infrastructure",
    "Policy and Global Implementation"
  ],
  "approach": "Start by surveying existing storage technologies and their limitations, then examine cutting-edge innovations and pilot projects, evaluate economic feasibility and environmental impact, and analyze real-world deployment strategies across different regions."
}
```

## Error Handling

```typescript
import { planResearch } from '@/packages/lib/ai-agents/research-planner';

async function robustPlanning(topic: string) {
  try {
    const plan = await planResearch(topic);
    return { success: true, plan };
  } catch (error) {
    console.error('Research planning failed:', error);

    // Log the error for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }

    // Return a fallback plan or re-throw
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

## Testing

```typescript
import { planResearch } from '@/packages/lib/ai-agents/research-planner';

describe('Research Planner Agent', () => {
  it('should generate 5-7 research questions', async () => {
    const plan = await planResearch('Test topic');

    expect(plan.questions.length).toBeGreaterThanOrEqual(5);
    expect(plan.questions.length).toBeLessThanOrEqual(7);
  });

  it('should generate 3-5 key areas', async () => {
    const plan = await planResearch('Test topic');

    expect(plan.areas.length).toBeGreaterThanOrEqual(3);
    expect(plan.areas.length).toBeLessThanOrEqual(5);
  });

  it('should include a research approach', async () => {
    const plan = await planResearch('Test topic');

    expect(plan.approach).toBeTruthy();
    expect(typeof plan.approach).toBe('string');
    expect(plan.approach.length).toBeGreaterThan(0);
  });
});
```

## Performance Considerations

- **Average execution time:** 2-4 seconds
- **Token usage:** ~1000-1500 tokens per request
- **Cost:** ~$0.0002 per research plan (using GPT-4o-mini)
- **Rate limits:** Subject to OpenAI API rate limits

## Best Practices

1. **Topic Clarity:** Provide clear, specific topics for better question generation
2. **Error Handling:** Always wrap calls in try-catch blocks
3. **Logging:** Log the generated plan for debugging and analytics
4. **Validation:** Verify the plan meets your quality standards before proceeding
5. **Caching:** Consider caching plans for identical topics to reduce API calls

## Related Agents

- **Agent #2:** Researcher - Takes the questions and conducts web research
- **Agent #3:** Validator - Validates sources and findings
- **Agent #4:** Critic - Reviews and critiques the research
- **Agent #5:** Writer - Synthesizes everything into a final report
