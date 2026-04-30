import { createAiHandler } from '../../../server/ai/handler';
import { prosodyPrompt } from '../../../server/ai/prompts';
import {
  prosodyBodySchema,
  prosodyOutputSchema,
} from '../../../server/ai/schemas';

export const POST = createAiHandler({
  endpoint: 'prosody',
  bodySchema: prosodyBodySchema,
  outputSchema: prosodyOutputSchema,
  buildPrompt: ({ text }) => prosodyPrompt(text),
});
