import { createAiHandler } from '../../../server/ai/handler';
import { tutorPrompt } from '../../../server/ai/prompts';
import {
  tutorBodySchema,
  tutorOutputSchema,
} from '../../../server/ai/schemas';

export const POST = createAiHandler({
  endpoint: 'tutor',
  bodySchema: tutorBodySchema,
  outputSchema: tutorOutputSchema,
  buildPrompt: ({ sentence, level }) => tutorPrompt({ sentence, level }),
});
