import type { AnalysisResult } from '../types/AnalysisResult';

type ApiError = { error: string; code?: string; details?: string };

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    let errBody: ApiError | null = null;
    try {
      errBody = (await res.json()) as ApiError;
    } catch {
      // ignore
    }
    throw new Error(errBody?.error || `Request failed (${res.status})`);
  }

  return (await res.json()) as T;
}

export async function apiAnalyzeLatin(text: string): Promise<AnalysisResult> {
  return await postJson<AnalysisResult>('/api/ai/analyze', { text });
}

export async function apiQuiz(sentence: string): Promise<{
  questions: Array<{ question: string; options: string[]; correctAnswer: number; explanation: string }>;
}> {
  return await postJson('/api/ai/quiz', { sentence });
}

export async function apiTutor(sentence: string, level: 'basic' | 'detailed' = 'basic'): Promise<{
  steps: Array<{ title: string; question: string; hint?: string; expectedAnswer?: string; explanation?: string }>;
  translation?: string;
  sentence?: string;
}> {
  return await postJson('/api/ai/tutor', { sentence, level });
}

export async function apiVocab(text: string): Promise<{
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
}> {
  return await postJson('/api/ai/vocab', { text });
}

export async function apiGraph(text: string): Promise<{
  nodes: Array<{ id: string; label: string; type: string }>;
  edges: Array<{ source: string; target: string; label: string }>;
}> {
  return await postJson('/api/ai/graph', { text });
}

export async function apiProsody(text: string): Promise<{
  scansion: Array<{
    word: string;
    syllables: Array<{ syllable: string; length: 'long' | 'short' | 'anceps'; stress: boolean }>;
  }>;
  meter: string;
  analysis: string;
}> {
  return await postJson('/api/ai/prosody', { text });
}

export async function apiParsing(text: string): Promise<{
  exercises: Array<{
    type: 'identify-function' | 'transform-sentence';
    instruction: string;
    sentence: string;
    correctOrder?: string[];
    elements?: Array<{ word: string; function: string; explanation: string }>;
    transformation?: { from: string; to: string; explanation: string };
    difficulty: 'easy' | 'medium' | 'hard';
    hint?: string;
  }>;
}> {
  return await postJson('/api/ai/parsing', { text });
}


