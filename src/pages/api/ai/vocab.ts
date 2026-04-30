import { createAiHandler } from '../../../server/ai/handler';
import { vocabPrompt } from '../../../server/ai/prompts';
import {
  vocabBodySchema,
  vocabOutputSchema,
} from '../../../server/ai/schemas';

export const POST = createAiHandler({
  endpoint: 'vocab',
  bodySchema: vocabBodySchema,
  outputSchema: vocabOutputSchema,
  buildPrompt: ({ text }) => vocabPrompt(text),
});
