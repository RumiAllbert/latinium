import type { APIRoute } from 'astro';
import { jsonError } from '../../../server/ai/errors';
import { getGeminiModel } from '../../../server/ai/gemini';
import { parseModelJson } from '../../../server/ai/json';
import { analysisPrompt, LATIN_SYSTEM_INSTRUCTION } from '../../../server/ai/prompts';
import type { AnalysisResult } from '../../../types/AnalysisResult';

type AnalyzeRequest = { text?: string };

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as AnalyzeRequest;
    const text = (body?.text ?? '').trim();

    if (!text) {
      return jsonError(400, { error: 'No text provided', code: 'BAD_REQUEST' });
    }

    const model = getGeminiModel({
      model: 'gemini-2.5-flash',
      systemInstruction: LATIN_SYSTEM_INSTRUCTION,
      temperature: 0.15,
      maxOutputTokens: 4096
    });

    const res = await model.generateContent(analysisPrompt(text));
    const raw = res.response.text();
    const parsed = parseModelJson<AnalysisResult>(raw);

    // Minimal validation to avoid undefined fields downstream.
    if (!parsed || !Array.isArray((parsed as any).words)) {
      return jsonError(502, { error: 'Invalid model response: missing words[]', code: 'UPSTREAM_ERROR', retryable: true });
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.includes('Missing GEMINI_API_KEY')) {
      return jsonError(500, { error: msg, code: 'CONFIG_ERROR' });
    }
    return jsonError(500, { error: msg, code: 'INTERNAL_ERROR' });
  }
};


