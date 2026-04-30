import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

vi.mock('../cache', () => ({
  getCached: vi.fn(),
  putCached: vi.fn(),
}));
vi.mock('../rate-limit', () => ({
  checkAndRecord: vi.fn(),
}));
vi.mock('./gemini', () => ({
  MODEL: 'test-model',
  callGemini: vi.fn(),
}));

import { getCached, putCached } from '../cache';
import { checkAndRecord } from '../rate-limit';
import { callGemini } from './gemini';
import { createAiHandler } from './handler';

const bodySchema = z.object({ text: z.string().min(1) });
const outputSchema = z.object({ greeting: z.string() });

const handler = createAiHandler({
  endpoint: 'analyze',
  bodySchema,
  outputSchema,
  buildPrompt: ({ text }) => `Hello ${text}`,
});

function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/ai/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.mocked(getCached).mockReset();
  vi.mocked(putCached).mockReset();
  vi.mocked(checkAndRecord).mockReset();
  vi.mocked(callGemini).mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('createAiHandler', () => {
  it('returns 400 invalid_input on bad JSON', async () => {
    const req = new Request('http://localhost/api/ai/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not-json',
    });
    const res = await handler({ request: req } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('invalid_input');
  });

  it('returns 400 invalid_input on schema failure', async () => {
    const res = await handler({ request: jsonRequest({ text: '' }) } as any);
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('invalid_input');
  });

  it('returns cached response on hit, no rate-limit increment', async () => {
    vi.mocked(getCached).mockResolvedValue({ greeting: 'cached' });
    const res = await handler({ request: jsonRequest({ text: 'world' }) } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(res.headers.get('X-Content-Hash')).toMatch(/^[a-f0-9]{64}$/);
    expect(await res.json()).toEqual({ greeting: 'cached' });
    expect(checkAndRecord).not.toHaveBeenCalled();
    expect(callGemini).not.toHaveBeenCalled();
  });

  it('returns 429 rate_limited when limiter says no', async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(checkAndRecord).mockResolvedValue({
      ok: false,
      retryAfter: 1234,
      resetAt: Date.now() + 1234_000,
    });
    const res = await handler({
      request: jsonRequest({ text: 'world' }, { 'x-forwarded-for': '1.2.3.4' }),
    } as any);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('1234');
    expect(res.headers.get('X-RateLimit-Limit')).toBe('15');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    const body = await res.json();
    expect(body.code).toBe('rate_limited');
    expect(callGemini).not.toHaveBeenCalled();
  });

  it('miss path: rate-limits, calls model, caches, returns', async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(checkAndRecord).mockResolvedValue({
      ok: true,
      remaining: 14,
      resetAt: 1_700_000_000_000,
    });
    vi.mocked(callGemini).mockResolvedValue({ greeting: 'hello world' });

    const res = await handler({
      request: jsonRequest({ text: 'world' }, { 'x-forwarded-for': '1.2.3.4' }),
    } as any);

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('MISS');
    expect(res.headers.get('X-Content-Hash')).toMatch(/^[a-f0-9]{64}$/);
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('14');
    expect(await res.json()).toEqual({ greeting: 'hello world' });
    expect(callGemini).toHaveBeenCalledOnce();
    expect(callGemini).toHaveBeenCalledWith('Hello world');
    expect(putCached).toHaveBeenCalledOnce();
  });

  it('returns 502 model_error when Gemini throws', async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(checkAndRecord).mockResolvedValue({
      ok: true,
      remaining: 14,
      resetAt: Date.now() + 1000,
    });
    vi.mocked(callGemini).mockRejectedValue(new Error('upstream 500'));
    const res = await handler({ request: jsonRequest({ text: 'world' }) } as any);
    expect(res.status).toBe(502);
    expect((await res.json()).code).toBe('model_error');
    expect(putCached).not.toHaveBeenCalled();
  });

  it('returns 502 model_error when Gemini output fails schema', async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(checkAndRecord).mockResolvedValue({
      ok: true,
      remaining: 14,
      resetAt: Date.now() + 1000,
    });
    vi.mocked(callGemini).mockResolvedValue({ unexpected: true });
    const res = await handler({ request: jsonRequest({ text: 'world' }) } as any);
    expect(res.status).toBe(502);
    expect((await res.json()).code).toBe('model_error');
    expect(putCached).not.toHaveBeenCalled();
  });
});
