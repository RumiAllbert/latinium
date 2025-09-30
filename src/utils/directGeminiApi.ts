import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalysisResult } from '../types/AnalysisResult';
import { getMockAnalysisData } from './mockData';
import { getGeminiApiKey } from './netlifyEnv';

// Safe environment variable access with fallback
const getApiKey = (): string => {
  // For production, we'll use our robust utility function that handles multiple fallbacks
  return getGeminiApiKey();
};

/**
 * Parse the plain text (marker-based) response into a minimal structure.
 * Used as a fallback when JSON parsing fails.
 */
function parseTextResponse(responseText: string): AnalysisResult {
  const words: any[] = [];

  // Split response into sections by "WORD:" markers
  const sections = responseText.split(/WORD:\s*/).filter(section => section.trim());

  for (const section of sections) {
    const lines = section.split('\n').map(line => line.trim()).filter(line => line && line.length > 0);

    let word = '';
    let partOfSpeech = '';
    let lemma = '';
    let meaning = '';
    let grammar = '';

    for (const line of lines) {

      // Check if line contains the markers
      if (line.includes('WORD:') && !line.startsWith('WORD:')) {
        // Extract from middle of line
        const wordMatch = line.match(/WORD:\s*([^,\n]+)/);
        if (wordMatch) word = wordMatch[1].trim();
      } else if (line.startsWith('WORD:')) {
        word = line.replace('WORD:', '').trim();
      } else if (line.includes('TYPE:') && !line.startsWith('TYPE:')) {
        const typeMatch = line.match(/TYPE:\s*([^,\n]+)/);
        if (typeMatch) partOfSpeech = typeMatch[1].trim();
      } else if (line.startsWith('TYPE:')) {
        partOfSpeech = line.replace('TYPE:', '').trim();
      } else if (line.includes('LEMMA:') && !line.startsWith('LEMMA:')) {
        const lemmaMatch = line.match(/LEMMA:\s*([^,\n]+)/);
        if (lemmaMatch) lemma = lemmaMatch[1].trim();
      } else if (line.startsWith('LEMMA:')) {
        lemma = line.replace('LEMMA:', '').trim();
      } else if (line.includes('MEANING:') && !line.startsWith('MEANING:')) {
        const meaningMatch = line.match(/MEANING:\s*([^,\n]+)/);
        if (meaningMatch) meaning = meaningMatch[1].trim();
      } else if (line.startsWith('MEANING:')) {
        meaning = line.replace('MEANING:', '').trim();
      } else if (line.includes('GRAMMAR:') && !line.startsWith('GRAMMAR:')) {
        const grammarMatch = line.match(/GRAMMAR:\s*([^\n]+)/);
        if (grammarMatch) grammar = grammarMatch[1].trim();
      } else if (line.startsWith('GRAMMAR:')) {
        grammar = line.replace('GRAMMAR:', '').trim();
      }
    }


    // Only add if we have at least a word
    if (word && word.length > 0) {
      // Parse grammar into morphology object
      const morphology: any = {};
      if (grammar && grammar !== 'N/A' && grammar.length > 0) {
        const grammarParts = grammar.toLowerCase().split(' ');
        morphology.case = grammarParts.find(part =>
          ['nominative', 'genitive', 'dative', 'accusative', 'ablative', 'vocative'].includes(part)
        ) || undefined;
        morphology.number = grammarParts.find(part =>
          ['singular', 'plural'].includes(part)
        ) || undefined;
        morphology.gender = grammarParts.find(part =>
          ['masculine', 'feminine', 'neuter'].includes(part)
        ) || undefined;
      }

      const wordObj = {
        word,
        partOfSpeech: partOfSpeech || 'unknown',
        lemma: lemma || word,
        meaning: meaning || '',
        morphology: Object.keys(morphology).length > 0 ? morphology : undefined
      };

      words.push(wordObj);
    }
  }

  // If no words were parsed, try a fallback approach
  if (words.length === 0) {
    // Simple fallback: extract all lines that look like they contain word data
    const lines = responseText.split('\n').map(line => line.trim()).filter(line => line);

    let currentWord = '';
    for (const line of lines) {
      if (line.startsWith('WORD:')) {
        if (currentWord) {
          // Save previous word if it exists
          words.push({
            word: currentWord,
            partOfSpeech: 'unknown',
            lemma: currentWord,
            meaning: '',
            morphology: undefined
          });
        }
        currentWord = line.replace('WORD:', '').trim();
      }
    }

    // Add the last word
    if (currentWord) {
      words.push({
        word: currentWord,
        partOfSpeech: 'unknown',
        lemma: currentWord,
        meaning: '',
        morphology: undefined
      });
    }
  }

  // Normalize to rich schema
  return normalizeToRich({ words });
}

/**
 * Attempts to parse a JSON response into our rich schema.
 * Accepts raw JSON or JSON inside code fences.
 */
function parseJsonResponse(responseText: string): AnalysisResult {
  let jsonText = responseText.trim();

  // Extract JSON inside ```json ... ``` if present
  const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    jsonText = fenceMatch[1].trim();
  } else {
    // Fallback: slice from first { to last }
    const firstIdx = jsonText.indexOf('{');
    const lastIdx = jsonText.lastIndexOf('}');
    if (firstIdx !== -1 && lastIdx !== -1 && lastIdx > firstIdx) {
      jsonText = jsonText.slice(firstIdx, lastIdx + 1);
    }
  }

  const parsed = JSON.parse(jsonText);

  // Expected shape: { words: [...], sentences?: [...] }
  if (!parsed || !Array.isArray(parsed.words)) {
    throw new Error('Invalid JSON: missing words array');
  }

  return normalizeToRich(parsed);
}

/**
 * Normalizes a mixed/plain structure to the rich AnalysisResult schema.
 */
function normalizeToRich(input: any): AnalysisResult {
  const sentences = Array.isArray(input?.sentences) ? input.sentences : undefined;
  const wordsArr = Array.isArray(input?.words) ? input.words : [];

  const words = wordsArr.map((w: any, idx: number) => {
    const meaningVal = w?.meaning;
    const meaning = typeof meaningVal === 'string'
      ? { short: meaningVal, detailed: '' }
      : {
          short: meaningVal?.short ?? '',
          detailed: meaningVal?.detailed ?? ''
        };

    const relationships = Array.isArray(w?.relationships) ? w.relationships : [];
    const morphology = typeof w?.morphology === 'object' && w?.morphology !== null
      ? w.morphology
      : {};

    return {
      word: String(w?.word ?? ''),
      partOfSpeech: String(w?.partOfSpeech ?? 'unknown'),
      lemma: String(w?.lemma ?? w?.word ?? ''),
      meaning,
      morphology,
      relationships,
      relatedWords: w?.relatedWords ?? { synonyms: [], derivedForms: [], usageExamples: [] },
      position: w?.position ?? { sentenceIndex: 0, wordIndex: idx }
    };
  });

  return { words, sentences } as AnalysisResult;
}

/**
 * Generates quiz questions for Latin text analysis
 */
export async function generateQuiz(text: string): Promise<{
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }>
}> {
  try {
    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048
      }
    });
    const prompt = `You are an expert Latin pedagogy AI creating engaging, educational quiz questions that test both comprehension and analytical thinking about Latin texts.

Output only JSON with this structure:
{
  "questions": [
    {
      "question": string,
      "options": [string, string, string, string],
      "correctAnswer": number, // 0-3
      "explanation": string,
      "questionType": "morphology"|"syntax"|"vocabulary"|"comprehension"|"cultural",
      "difficulty": "easy"|"medium"|"hard"
    }
  ]
}

Create 4-5 thoughtful multiple-choice questions about this Latin text: "${text}"

Question Design Principles:
1. VARIETY: Include different question types (morphology, syntax, vocabulary, reading comprehension, cultural context)
2. SCAFFOLDING: Start with easier questions, build to more complex analysis
3. PEDAGOGICAL VALUE: Each question should teach something important about Latin
4. REALISTIC DISTRACTORS: Wrong answers should reflect common student mistakes
5. RICH EXPLANATIONS: Explain not just why the answer is correct, but why others are wrong
6. CONTEXTUAL FOCUS: Questions should be about THIS specific text, not generic Latin knowledge

Example Question Types:
- "What case is 'puellam' and why?"
- "What is the subject of this sentence?"
- "Which word does 'magnus' modify?"
- "What does this sentence structure tell us about emphasis?"
- "What cultural practice does this text reference?"

Make questions engaging and educational, not just testing rote memorization.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    try {
      const parsed = JSON.parse((responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1] ?? responseText).trim());
      if (parsed && Array.isArray(parsed.questions)) {
        // Ensure shape and bounds
        const questions = parsed.questions
          .filter((q: any) => q && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length === 4)
          .map((q: any) => ({
            question: q.question,
            options: q.options.slice(0, 4).map((o: any) => String(o)),
            correctAnswer: Math.max(0, Math.min(3, Number(q.correctAnswer ?? 0))),
            explanation: String(q.explanation ?? '')
          }));
        return { questions };
      }
    } catch (e) {
      console.warn('Quiz JSON parse failed; returning empty quiz.', e);
    }
    return { questions: [] };
  } catch (error) {
    console.error('Error generating quiz:', error);
    return { questions: [] };
  }
}

/**
 * Generates tutoring content for Latin text analysis
 */
export async function generateTutoring(text: string): Promise<{
  steps: Array<{
    title: string;
    question: string;
    hint?: string;
    expectedAnswer?: string;
    explanation?: string;
  }>
}> {
  try {
    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048
      }
    });

    const prompt = `You are an expert Latin tutor using the Socratic method to guide students through understanding this Latin text. Your goal is to help students discover insights themselves through carefully scaffolded questions.

Output only JSON with this structure:
{
  "steps": [
    { 
      "title": string, 
      "question": string, 
      "hint"?: string, 
      "expectedAnswer"?: string, 
      "explanation"?: string,
      "followUpQuestions"?: string[],
      "commonMistakes"?: string,
      "encouragement"?: string
    }
  ]
}

Create 4-6 Socratic tutoring steps for this Latin text: "${text}"

Tutoring Principles:
1. GUIDED DISCOVERY: Ask questions that lead students to insights rather than giving answers directly
2. LOGICAL PROGRESSION: Each step should build on the previous one
3. MULTIPLE ENTRY POINTS: Provide hints for students who get stuck
4. ERROR ANTICIPATION: Address common mistakes students make
5. CONFIDENCE BUILDING: Include encouragement, especially after difficult steps
6. DEEP UNDERSTANDING: Move beyond surface analysis to comprehension and interpretation

Step Progression Example:
1. Observation: "What do you notice about the word endings?"
2. Analysis: "How do those endings help you identify the sentence structure?"
3. Synthesis: "Now that you know the structure, what is the sentence saying?"
4. Application: "How does understanding this structure help you read similar sentences?"

Make the tutoring feel like a supportive conversation, not an interrogation. Help students feel successful while learning deeply.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    try {
      const parsed = JSON.parse((responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1] ?? responseText).trim());
      if (parsed && Array.isArray(parsed.steps)) {
        const steps = parsed.steps
          .filter((s: any) => s && typeof s.title === 'string' && typeof s.question === 'string')
          .map((s: any) => ({
            title: s.title,
            question: s.question,
            hint: s.hint ?? '',
            expectedAnswer: s.expectedAnswer ?? s.answer ?? '',
            explanation: s.explanation ?? ''
          }));
        return { steps };
      }
    } catch (e) {
      console.warn('Tutoring JSON parse failed; returning empty steps.', e);
    }
    return { steps: [] };
  } catch (error) {
    console.error('Error generating tutoring content:', error);
    return { steps: [] };
  }
}

/**
 * Generates graph data for visualizing sentence structure
 */
export async function generateGraphData(text: string): Promise<{
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    position: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
  }>;
}> {
  try {
    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048
      }
    });
    const prompt = `Output only JSON with this structure:
{
  "nodes": [ { "id": string, "label": string, "type": string } ],
  "edges": [ { "id": string, "source": string, "target": string, "label": string } ]
}
Create a small dependency graph (5–12 nodes) of the main relationships in this Latin text: "${text}". Node ids must be strings; edges should reference node ids.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    try {
      const parsed = JSON.parse((responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1] ?? responseText).trim());
      const nodes = Array.isArray(parsed?.nodes)
        ? parsed.nodes.map((n: any, i: number) => ({
            id: String(n?.id ?? i),
            label: String(n?.label ?? `node-${i}`),
            type: String(n?.type ?? 'token'),
            position: { x: 0, y: 0 }
          }))
        : [];
      const edges = Array.isArray(parsed?.edges)
        ? parsed.edges.map((e: any, i: number) => ({
            id: String(e?.id ?? i),
            source: String(e?.source ?? ''),
            target: String(e?.target ?? ''),
            label: String(e?.label ?? '')
          }))
        : [];
      return { nodes, edges };
    } catch (e) {
      console.warn('Graph JSON parse failed; returning empty graph.', e);
      return { nodes: [], edges: [] };
    }
  } catch (error) {
    console.error('Error generating graph data:', error);
    return { nodes: [], edges: [] };
  }
}

/**
 * Analyzes Latin text using the Gemini API directly from the client (simplified morphological analysis only)
 */
export async function analyzeLatin(
  text: string,
  options: { stream?: boolean, onStreamChunk?: (chunk: string) => void } = {}
): Promise<{
  result: AnalysisResult,
  isMockData: boolean
}> {
  try {
    // Check if text is empty
    if (!text || text.trim() === '') {
      console.warn('Empty text provided, returning mock data');
      return {
        result: getMockAnalysisData(text || 'empty text', true),
        isMockData: true
      };
    }

    // Check if API key is available
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn('No Gemini API key found, using mock data');
      return {
        result: getMockAnalysisData(text, true),
        isMockData: true
      };
    }

    // Initialize the Gemini API client (simplified approach)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096
      }
    });

    // Limit text length to get faster responses
    const textToAnalyze = text.length > 800 ? text.substring(0, 800) : text;

    const prompt = `You are an expert Latin pedagogy AI designed to help intermediate Latin students read and understand texts fluently. Your analysis should be educational, contextual, and designed to build reading comprehension skills.

Output only minified JSON matching this schema:
{
  "words": [
    {
      "word": string,
      "lemma": string,
      "partOfSpeech": string,
      "meaning": { "short": string, "detailed": string },
      "morphology": {
        "case"?: string, "number"?: string, "gender"?: string,
        "person"?: string, "tense"?: string, "mood"?: string, "voice"?: string,
        "degree"?: string
      },
      "relationships": [
        { "type": string, "relatedWordIndex": number, "description": string, "direction"?: "from"|"to" }
      ],
      "position": { "sentenceIndex": number, "wordIndex": number },
      "pedagogicalNotes": {
        "difficulty": "easy"|"medium"|"hard",
        "memoryAid"?: string,
        "commonMistakes"?: string,
        "etymology"?: string,
        "culturalContext"?: string
      }
    }
  ],
  "sentences"?: [ 
    { 
      "original": string, 
      "translation"?: string,
      "structure"?: string,
      "readingNotes"?: string,
      "difficulty": "easy"|"medium"|"hard"
    } 
  ]
}

Analytical Guidelines:
1. MORPHOLOGY: Provide clear, educational explanations. For unusual forms, note why they're unusual.
2. RELATIONSHIPS: Focus on syntactic relationships that help reading comprehension (subject-verb, verb-object, adjective-noun, subordinate clauses).
3. MEANINGS: Provide contextually appropriate translations, not just dictionary definitions.
4. PEDAGOGICAL NOTES:
   - Difficulty: Consider morphological complexity, vocabulary frequency, syntactic role
   - Memory aids: Mnemonic devices, cognates, word families
   - Common mistakes: Typical student errors (false friends, case confusion, etc.)
   - Etymology: Helpful when it aids comprehension or memory
   - Cultural context: Historical/cultural significance when relevant
5. SENTENCE ANALYSIS: Break down complex sentences, note word order variations, highlight stylistic features.
6. READING AIDS: Structure notes should help students parse complex Latin word order.

Analyze this text (truncate to 800 chars if needed): "${textToAnalyze}"`;

    console.log('Sending direct request to Gemini API with lite model...');
    
    // Handle streaming if requested
    if (options.stream && options.onStreamChunk) {
      const result = await handleStreamingRequest(model, prompt, options.onStreamChunk);
      return result;
    } else {
      // Handle regular request
      const result = await handleRegularRequest(model, prompt);
      return result;
    }
  } catch (error) {
    console.error('Error in direct Gemini API call:', error);
    return {
      result: getMockAnalysisData(text, true),
      isMockData: true
    };
  }
}

/**
 * Handles a regular request to the Gemini API
 */
async function handleRegularRequest(model: any, prompt: string): Promise<{
  result: AnalysisResult,
  isMockData: boolean
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    try {
      console.log("Attempting to generate content with Gemini...");
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      console.log("RAW RESPONSE from Gemini API:", responseText);

      // Prefer JSON parsing; fallback to legacy text parsing
      let parsedResult: AnalysisResult;
      try {
        parsedResult = parseJsonResponse(responseText);
      } catch (e) {
        console.warn('JSON parse failed, using legacy parsing.', e);
        parsedResult = parseTextResponse(responseText);
      }
      
      return {
        result: parsedResult,
        isMockData: false
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('!!! ERROR in regular Gemini request:', error); // <-- DETAILED LOGGING
    throw error;
  }
}

/**
 * Handles a streaming request to the Gemini API
 */
async function handleStreamingRequest(
  model: any, 
  prompt: string, 
  onChunk: (chunk: string) => void
): Promise<{
  result: AnalysisResult,
  isMockData: boolean
}> {
  try {
    // Generate content using the streaming API
    const result = await model.generateContentStream(prompt);
    
    let fullResponse = '';
    
    // Process each chunk as it arrives
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      onChunk(chunkText);
    }
    
    try {
      // Prefer JSON parsing; fallback to legacy text parsing
      let parsedResult: AnalysisResult;
      try {
        parsedResult = parseJsonResponse(fullResponse);
      } catch (e) {
        console.warn('JSON parse failed in stream, using legacy parsing.', e);
        parsedResult = parseTextResponse(fullResponse);
      }

      return {
        result: parsedResult,
        isMockData: false
      };
    } catch (parseError) {
      console.error('Failed to parse streaming response:', parseError);
      throw parseError;
    }
  } catch (error) {
    console.error('Error in streaming Gemini request:', error);
    throw error;
  }
}

/**
 * Generates prosody and scansion analysis for Latin poetry
 */
export async function generateProsodyAnalysis(text: string): Promise<{
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
}> {
  try {
    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048
      }
    });

    const prompt = `You are an expert in Latin prosody and meter. Analyze this Latin text for poetic meter and scansion.

Output only JSON with this structure:
{
  "scansion": [
    {
      "word": string,
      "syllables": [
        {
          "syllable": string,
          "length": "long"|"short"|"anceps",
          "stress": boolean
        }
      ]
    }
  ],
  "meter": string, // e.g., "dactylic hexameter", "elegiac couplet"
  "analysis": string // Brief explanation of the metrical pattern
}

Analyze this Latin text for prosody and meter: "${text}"

Provide accurate scansion markings, identify the meter if it's poetry, and give a brief educational explanation of the metrical pattern.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    try {
      const parsed = JSON.parse((responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1] ?? responseText).trim());
      return {
        scansion: parsed?.scansion ?? [],
        meter: parsed?.meter ?? 'prose',
        analysis: parsed?.analysis ?? ''
      };
    } catch (e) {
      console.warn('Prosody JSON parse failed; returning empty analysis.', e);
      return { scansion: [], meter: 'prose', analysis: '' };
    }
  } catch (error) {
    console.error('Error generating prosody analysis:', error);
    return { scansion: [], meter: 'prose', analysis: '' };
  }
}

/**
 * Generates contextual vocabulary cards based on the current text
 */
export async function generateVocabularyCards(text: string): Promise<{
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
  try {
    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 3072
      }
    });

    const prompt = `You are an expert Latin vocabulary instructor creating engaging vocabulary cards for students.

Output only JSON with this structure:
{
  "cards": [
    {
      "word": string,
      "lemma": string,
      "partOfSpeech": string,
      "meaning": string,
      "etymology": string,
      "relatedWords": [string],
      "usageExamples": [string],
      "mnemonicDevice": string,
      "frequency": "common"|"uncommon"|"rare"
    }
  ]
}

Create vocabulary cards for the most pedagogically important words in this Latin text: "${text}"

Card Creation Guidelines:
1. Focus on HIGH-VALUE words (frequent, useful, or particularly important for this text)
2. Provide MEMORABLE etymology when it helps with retention
3. Include RELATED WORDS from the same root family
4. Create ENGAGING mnemonic devices that help students remember
5. Give CONTEXTUAL usage examples, preferably from classical authors
6. Assess frequency based on overall Latin literature (common = top 1000 words, uncommon = top 5000, rare = beyond that)

Make cards educational and memorable, not just definitional.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    try {
      const parsed = JSON.parse((responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1] ?? responseText).trim());
      return {
        cards: parsed?.cards ?? []
      };
    } catch (e) {
      console.warn('Vocabulary JSON parse failed; returning empty cards.', e);
      return { cards: [] };
    }
  } catch (error) {
    console.error('Error generating vocabulary cards:', error);
    return { cards: [] };
  }
}

/**
 * Generates parsing exercises for interactive sentence structure learning
 */
export async function generateParsingExercises(text: string): Promise<{
  exercises: Array<{
    type: 'drag-to-order' | 'identify-function' | 'transform-sentence';
    instruction: string;
    sentence: string;
    correctOrder?: string[];
    elements?: Array<{
      word: string;
      function: string;
      explanation: string;
    }>;
    transformation?: {
      from: string;
      to: string;
      explanation: string;
    };
    difficulty: 'easy' | 'medium' | 'hard';
    hint?: string;
  }>;
}> {
  try {
    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048
      }
    });

    const prompt = `You are an expert Latin grammar instructor creating interactive parsing exercises to help students understand sentence structure.

Output only JSON with this structure:
{
  "exercises": [
    {
      "type": "drag-to-order"|"identify-function"|"transform-sentence",
      "instruction": string,
      "sentence": string,
      "correctOrder": [string], // for drag-to-order only
      "elements": [ // for identify-function only
        {
          "word": string,
          "function": string,
          "explanation": string
        }
      ],
      "transformation": { // for transform-sentence only
        "from": string,
        "to": string,
        "explanation": string
      },
      "difficulty": "easy"|"medium"|"hard",
      "hint": string
    }
  ]
}

Create 3-4 interactive parsing exercises based on this Latin text: "${text}"

Exercise Types:
1. DRAG-TO-ORDER: Give students words in English order, have them arrange in logical Latin order
2. IDENTIFY-FUNCTION: Students click on words to identify their grammatical function
3. TRANSFORM-SENTENCE: Students convert between active/passive, indicative/subjunctive, etc.

Make exercises engaging, educational, and appropriately challenging. Include helpful hints.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    try {
      const parsed = JSON.parse((responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1] ?? responseText).trim());
      return {
        exercises: parsed?.exercises ?? []
      };
    } catch (e) {
      console.warn('Parsing exercises JSON parse failed; returning empty exercises.', e);
      return { exercises: [] };
    }
  } catch (error) {
    console.error('Error generating parsing exercises:', error);
    return { exercises: [] };
  }
}
