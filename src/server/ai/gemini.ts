import { GoogleGenerativeAI } from '@google/generative-ai';

export type GeminiModelName = 'gemini-2.5-flash' | 'gemini-2.5-pro';

export function getServerGeminiApiKey(): string {
  // Server-side only. Do NOT rely on PUBLIC_ vars.
  const key = process.env.GEMINI_API_KEY ?? '';
  return key.trim();
}

export function getGeminiModel(params?: {
  model?: GeminiModelName;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
}) {
  const apiKey = getServerGeminiApiKey();
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY (server env).');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = params?.model ?? 'gemini-2.5-flash';

  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: params?.systemInstruction,
    generationConfig: {
      temperature: params?.temperature ?? 0.2,
      maxOutputTokens: params?.maxOutputTokens ?? 4096
    }
  });
}


