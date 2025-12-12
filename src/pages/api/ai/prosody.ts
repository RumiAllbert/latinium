import type { APIRoute } from 'astro';
import { jsonError } from '../../../server/ai/errors';
import { getGeminiModel } from '../../../server/ai/gemini';
import { parseModelJson } from '../../../server/ai/json';
import { LATIN_SYSTEM_INSTRUCTION, prosodyPrompt } from '../../../server/ai/prompts';

type ProsodyRequest = { text?: string };
type ProsodyResponse = {
  scansion: Array<{
    word: string;
    syllables: Array<{ syllable: string; length: 'long' | 'short' | 'anceps'; stress: boolean }>;
  }>;
  meter: string;
  analysis: string;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as ProsodyRequest;
    const text = (body?.text ?? '').trim();
    if (!text) return jsonError(400, { error: 'No text provided', code: 'BAD_REQUEST' });

    const model = getGeminiModel({
      model: 'gemini-2.5-flash',
      systemInstruction: LATIN_SYSTEM_INSTRUCTION,
      temperature: 0.25,
      maxOutputTokens: 2048
    });

    const res = await model.generateContent(prosodyPrompt(text));
    const raw = res.response.text();
    const parsed = parseModelJson<ProsodyResponse>(raw);

    if (!parsed || typeof (parsed as any).meter !== 'string' || !Array.isArray((parsed as any).scansion)) {
      return jsonError(502, { error: 'Invalid model response: missing meter/scansion', code: 'UPSTREAM_ERROR', retryable: true });
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


