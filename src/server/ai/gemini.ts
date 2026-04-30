import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractJsonFromText } from './json';

export const MODEL = 'gemini-3.1-flash-lite-preview';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY (server env)');
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: MODEL,
  generationConfig: {
    temperature: 0.2,
    maxOutputTokens: 4096,
  },
});

export async function callGemini(prompt: string): Promise<unknown> {
  const res = await model.generateContent(prompt);
  const raw = res.response.text();
  const json = extractJsonFromText(raw);
  return JSON.parse(json);
}
