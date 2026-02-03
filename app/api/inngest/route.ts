import { serve } from 'inngest/next';
import { inngest } from '@/packages/lib/inngest/client';
import { generateResearchReport } from '@/packages/lib/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateResearchReport],
});
