import type { APIRoute } from 'astro';
import type { ZodSchema } from 'zod';
import { getCached, putCached, type Endpoint } from '../cache';
import { checkAndRecord } from '../rate-limit';
import { callGemini, MODEL } from './gemini';
import { hashIp, hashRequest } from './hash';

interface HandlerOpts<TBody, TOut> {
  endpoint: Endpoint;
  bodySchema: ZodSchema<TBody>;
  outputSchema: ZodSchema<TOut>;
  buildPrompt: (body: TBody) => string;
}

const RATE_LIMIT = 15;

function extractIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-nf-client-connection-ip') ?? '0.0.0.0';
}

function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

export function createAiHandler<TBody, TOut>(
  opts: HandlerOpts<TBody, TOut>,
): APIRoute {
  return async ({ request }) => {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return jsonResponse(400, {
        error: 'Invalid JSON in request body',
        code: 'invalid_input',
      });
    }

    const parsedBody = opts.bodySchema.safeParse(raw);
    if (!parsedBody.success) {
      return jsonResponse(400, {
        error: parsedBody.error.message,
        code: 'invalid_input',
      });
    }

    const hash = hashRequest(opts.endpoint, parsedBody.data);

    const cached = await getCached(opts.endpoint, hash, MODEL);
    if (cached !== null) {
      return jsonResponse(200, cached, {
        'X-Cache': 'HIT',
        'X-Content-Hash': hash,
      });
    }

    const rl = await checkAndRecord(hashIp(extractIp(request)));
    if (!rl.ok) {
      return jsonResponse(
        429,
        {
          error: 'Rate limit exceeded',
          code: 'rate_limited',
          retryAfter: rl.retryAfter,
        },
        {
          'Retry-After': String(rl.retryAfter),
          'X-RateLimit-Limit': String(RATE_LIMIT),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(rl.resetAt / 1000)),
        },
      );
    }

    let modelOutput: unknown;
    try {
      modelOutput = await callGemini(opts.buildPrompt(parsedBody.data));
    } catch (err) {
      console.error('[ai] gemini call failed', { endpoint: opts.endpoint, hash, err });
      return jsonResponse(502, {
        error: 'The model could not be reached. Please retry.',
        code: 'model_error',
      });
    }

    const parsedOutput = opts.outputSchema.safeParse(modelOutput);
    if (!parsedOutput.success) {
      console.error('[ai] gemini output failed validation', {
        endpoint: opts.endpoint,
        hash,
        issues: parsedOutput.error.issues,
      });
      return jsonResponse(502, {
        error: 'The model returned an unexpected response. Please retry.',
        code: 'model_error',
      });
    }

    await putCached(
      opts.endpoint,
      hash,
      MODEL,
      parsedBody.data,
      parsedOutput.data,
    );

    return jsonResponse(200, parsedOutput.data, {
      'X-Cache': 'MISS',
      'X-Content-Hash': hash,
      'X-RateLimit-Limit': String(RATE_LIMIT),
      'X-RateLimit-Remaining': String(rl.remaining),
      'X-RateLimit-Reset': String(Math.floor(rl.resetAt / 1000)),
    });
  };
}
