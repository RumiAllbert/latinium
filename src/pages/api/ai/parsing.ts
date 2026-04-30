import { createAiHandler } from '../../../server/ai/handler';
import { parsingPrompt } from '../../../server/ai/prompts';
import {
  parsingBodySchema,
  parsingOutputSchema,
} from '../../../server/ai/schemas';

export const POST = createAiHandler({
  endpoint: 'parsing',
  bodySchema: parsingBodySchema,
  outputSchema: parsingOutputSchema,
  buildPrompt: ({ text }) => parsingPrompt(text),
});
