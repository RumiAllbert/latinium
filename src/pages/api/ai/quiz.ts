import { createAiHandler } from '../../../server/ai/handler';
import { quizPrompt } from '../../../server/ai/prompts';
import { quizBodySchema, quizOutputSchema } from '../../../server/ai/schemas';

export const POST = createAiHandler({
  endpoint: 'quiz',
  bodySchema: quizBodySchema,
  outputSchema: quizOutputSchema,
  buildPrompt: ({ sentence }) => quizPrompt(sentence),
});
