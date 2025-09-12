import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalysisResult } from '../types/AnalysisResult';
import type { TutorExplanation, QuizPayload } from '../types/Learning';
import { getGeminiApiKey } from './netlifyEnv';
import { extractJsonFromText } from './textUtils';

const getApiKey = (): string => getGeminiApiKey();

export async function explainSentence(
  sentence: string,
  analysis?: AnalysisResult,
  level: 'basic' | 'detailed' = 'basic'
): Promise<{ result: TutorExplanation; isMockData: boolean }>{
  const key = getApiKey();
  if (!key) return { result: mockTutor(sentence, analysis, level), isMockData: true };

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash', generationConfig: { temperature: 0.15, maxOutputTokens: 2048 } });

  const schema = `
  TutorExplanation = {
    "sentence": string,
    "translation"?: string,
    "steps": Array<{ "title": string, "prompt": string, "hint"?: string, "answer"?: string }>
  }
  Return: TutorExplanation (JSON only)`;

  const prompt = `You are a Latin tutor. Return ONLY valid JSON, no prose, matching the schema below. Create a short, step-by-step guide: (1) find verb, (2) find subject, (3) objects, (4) modifiers, (5) concise translation. Level: ${level}.
  If analysis JSON is present, align steps with indices. Keep each step 1–2 lines.
  ${schema}
  Sentence: "${sentence}"
  AnalysisJSON:${analysis ? '\n' + JSON.stringify(analysis).slice(0, 4000) : ' null'}`;

  const res = await model.generateContent(prompt);
  const text = res.response.text();
  const json = JSON.parse(extractJsonFromText(text));
  return { result: json, isMockData: false };
}

export async function generateQuiz(
  sentence: string,
  analysis?: AnalysisResult
): Promise<{ result: QuizPayload; isMockData: boolean }>{
  const key = getApiKey();
  if (!key) return { result: mockQuiz(sentence, analysis), isMockData: true };

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash', generationConfig: { temperature: 0.2, maxOutputTokens: 2048 } });

  const schema = `
  QuizPayload = {
    "sentence": string,
    "questions": Array<{
      "id": string,
      "type": string,
      "prompt": string,
      "options": Array<{"text": string}>,
      "correctIndex": number,
      "explanation"?: string
    }>
  }
  Return: QuizPayload (JSON only)`;

  const prompt = `Return ONLY valid JSON, no prose, matching the schema below. Build a 3–5 question micro-quiz for the Latin sentence. Mix types: identify-subject, verb-tense, case-usage, adjective-noun agreement, quick translation. Use one correct option per question and a 1-line explanation.
  ${schema}
  Sentence: "${sentence}"
  AnalysisJSON:${analysis ? '\n' + JSON.stringify(analysis).slice(0, 4000) : ' null'}`;

  const res = await model.generateContent(prompt);
  const text = res.response.text();
  const json = JSON.parse(extractJsonFromText(text));
  return { result: json, isMockData: false };
}

function mockTutor(sentence: string, analysis?: AnalysisResult, level: 'basic' | 'detailed' = 'basic'): TutorExplanation {
  const words = analysis?.words || [];
  const verb = words.find(w => (w.partOfSpeech || '').toLowerCase() === 'verb')?.word || '—';
  const subject = words.find(w => (w.morphology?.case || '').toLowerCase() === 'nominative')?.word || '—';
  return {
    sentence,
    translation: 'Mock translation (enable API for real output).',
    steps: [
      { title: 'Find the verb', prompt: `Locate the finite verb in the sentence.`, hint: `Look for person/number/tense.`, answer: verb },
      { title: 'Find the subject', prompt: `Who or what performs the action?`, hint: `Check nominative nouns/pronouns.`, answer: subject },
      { title: 'Check objects', prompt: `Is there a direct object?`, hint: `Accusative case often marks it.`, answer: '—' },
      { title: 'Modifiers', prompt: `Which adjectives modify nouns?`, hint: `Match case, number, gender.`, answer: '—' },
      { title: 'Translate', prompt: `Compose a smooth English translation.`, hint: `SVO in English; keep Latin sense.`, answer: 'Mock translation.' }
    ]
  };
}

function mockQuiz(sentence: string, analysis?: AnalysisResult): QuizPayload {
  const words = analysis?.words || [];
  const subj = words.find(w => (w.morphology?.case || '').toLowerCase() === 'nominative')?.word || 'Gallia';
  return {
    sentence,
    questions: [
      { id: 'q1', type: 'identify-subject', prompt: 'Identify the subject.', options: [{text: subj},{text:'urbem'},{text:'ad'},{text:'esse'}], correctIndex: 0, explanation: 'Subjects appear in the nominative.' },
      { id: 'q2', type: 'verb-tense', prompt: 'What is the tense of “est”?', options: [{text:'present'},{text:'imperfect'},{text:'perfect'},{text:'future'}], correctIndex: 0, explanation: '“est” is present tense of “sum”.' }
    ]
  };
}
