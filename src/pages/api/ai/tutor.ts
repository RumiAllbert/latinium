import type { APIRoute } from 'astro';
import { jsonError } from '../../../server/ai/errors';
import { getGeminiModel } from '../../../server/ai/gemini';
import { parseModelJson } from '../../../server/ai/json';
import { LATIN_SYSTEM_INSTRUCTION, tutorPrompt } from '../../../server/ai/prompts';

type TutorRequest = { sentence?: string; level?: 'basic' | 'detailed' };
type TutorResponse = {
  steps: Array<{
    title: string;
    question: string;
    hint?: string;
    expectedAnswer?: string;
    explanation?: string;
  }>;
  translation?: string;
  sentence?: string;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as TutorRequest;
    const sentence = (body?.sentence ?? '').trim();
    const level = body?.level === 'detailed' ? 'detailed' : 'basic';

    if (!sentence) {
      return jsonError(400, { error: 'No sentence provided', code: 'BAD_REQUEST' });
    }

    const model = getGeminiModel({
      model: 'gemini-2.5-flash',
      systemInstruction: LATIN_SYSTEM_INSTRUCTION,
      temperature: 0.2,
      maxOutputTokens: 2048
    });

    const res = await model.generateContent(tutorPrompt({ sentence, level }));
    const raw = res.response.text();
    const parsed = parseModelJson<TutorResponse>(raw);

    if (!parsed || !Array.isArray((parsed as any).steps)) {
      return jsonError(502, { error: 'Invalid model response: missing steps[]', code: 'UPSTREAM_ERROR', retryable: true });
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.includes('Missing GEMINI_API_KEY')) return jsonError(500, { error: msg, code: 'CONFIG_ERROR' });
    return jsonError(500, { error: msg, code: 'INTERNAL_ERROR' });
  }
};


