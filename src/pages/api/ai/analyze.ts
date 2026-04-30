import { createAiHandler } from '../../../server/ai/handler';
import { analysisPrompt } from '../../../server/ai/prompts';
import {
  analyzeBodySchema,
  analyzeOutputSchema,
} from '../../../server/ai/schemas';

export const POST = createAiHandler({
  endpoint: 'analyze',
  bodySchema: analyzeBodySchema,
  outputSchema: analyzeOutputSchema,
  buildPrompt: ({ text }) => analysisPrompt(text),
});
