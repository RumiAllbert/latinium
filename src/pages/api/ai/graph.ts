import { createAiHandler } from '../../../server/ai/handler';
import { graphPrompt } from '../../../server/ai/prompts';
import {
  graphBodySchema,
  graphOutputSchema,
} from '../../../server/ai/schemas';

export const POST = createAiHandler({
  endpoint: 'graph',
  bodySchema: graphBodySchema,
  outputSchema: graphOutputSchema,
  buildPrompt: ({ text }) => graphPrompt(text),
});
