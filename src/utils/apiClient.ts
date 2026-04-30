import type { AnalysisResult } from '../types/AnalysisResult';

export type ApiErrorCode =
  | 'invalid_input'
  | 'rate_limited'
  | 'model_error'
  | 'server_error';

export interface ApiErrorBody {
  error: string;
  code: ApiErrorCode;
  retryAfter?: number;
}

export interface RateLimitState {
  limit: number;
  remaining: number;
  resetAt: number; // ms epoch
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: ApiErrorCode,
    public readonly status: number,
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface AiResponse<T> {
  data: T;
  hash: string;
  cache: 'HIT' | 'MISS';
  rateLimit: RateLimitState | null;
}

function readRateLimit(headers: Headers): RateLimitState | null {
  const limit = headers.get('X-RateLimit-Limit');
  const remaining = headers.get('X-RateLimit-Remaining');
  const reset = headers.get('X-RateLimit-Reset');
  if (limit === null || remaining === null || reset === null) return null;
  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    resetAt: parseInt(reset, 10) * 1000,
  };
}

async function postJson<T>(path: string, body: unknown): Promise<AiResponse<T>> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let parsed: ApiErrorBody | null = null;
    try {
      parsed = (await res.json()) as ApiErrorBody;
    } catch {
      /* ignore */
    }
    throw new ApiError(
      parsed?.error ?? `Request failed (${res.status})`,
      parsed?.code ?? 'server_error',
      res.status,
      parsed?.retryAfter,
    );
  }

  const data = (await res.json()) as T;
  const hash = res.headers.get('X-Content-Hash') ?? '';
  const cache = (res.headers.get('X-Cache') as 'HIT' | 'MISS') ?? 'MISS';
  return { data, hash, cache, rateLimit: readRateLimit(res.headers) };
}

export async function apiAnalyzeLatin(
  text: string,
): Promise<AiResponse<AnalysisResult>> {
  return postJson<AnalysisResult>('/api/ai/analyze', { text });
}

export async function apiQuiz(sentence: string): Promise<
  AiResponse<{
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>;
  }>
> {
  return postJson('/api/ai/quiz', { sentence });
}

export async function apiTutor(
  sentence: string,
  level: 'basic' | 'detailed' = 'basic',
): Promise<
  AiResponse<{
    steps: Array<{
      title: string;
      question: string;
      hint?: string;
      expectedAnswer?: string;
      explanation?: string;
    }>;
    translation?: string;
    sentence?: string;
  }>
> {
  return postJson('/api/ai/tutor', { sentence, level });
}

export async function apiVocab(text: string): Promise<
  AiResponse<{
    cards: Array<{
      word: string;
      lemma: string;
      partOfSpeech: string;
      meaning: string;
      etymology?: string;
      relatedWords: string[];
      usageExamples: string[];
      mnemonicDevice?: string;
      frequency: 'common' | 'uncommon' | 'rare';
    }>;
  }>
> {
  return postJson('/api/ai/vocab', { text });
}

export async function apiGraph(text: string): Promise<
  AiResponse<{
    nodes: Array<{ id: string; label: string; type: string }>;
    edges: Array<{ source: string; target: string; label: string }>;
  }>
> {
  return postJson('/api/ai/graph', { text });
}

export async function apiProsody(text: string): Promise<
  AiResponse<{
    scansion: Array<{
      word: string;
      syllables: Array<{
        syllable: string;
        length: 'long' | 'short' | 'anceps';
        stress: boolean;
      }>;
    }>;
    meter: string;
    analysis: string;
  }>
> {
  return postJson('/api/ai/prosody', { text });
}

export async function apiParsing(text: string): Promise<
  AiResponse<{
    exercises: Array<{
      type: 'identify-function' | 'transform-sentence';
      instruction: string;
      sentence: string;
      correctOrder?: string[];
      elements?: Array<{
        word: string;
        function: string;
        explanation: string;
      }>;
      transformation?: { from: string; to: string; explanation: string };
      difficulty: 'easy' | 'medium' | 'hard';
      hint?: string;
    }>;
  }>
> {
  return postJson('/api/ai/parsing', { text });
}
