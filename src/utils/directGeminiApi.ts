import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalysisResult } from '../types/AnalysisResult';
import { getMockAnalysisData } from './mockData';
import { getGeminiApiKey } from './netlifyEnv';
import { extractJsonFromText } from './textUtils';

// Safe environment variable access with fallback
const getApiKey = (): string => {
  // For production, we'll use our robust utility function that handles multiple fallbacks
  return getGeminiApiKey();
};

/**
 * Analyzes Latin text using the Gemini API directly from the client
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

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
        topP: 0.8,
        topK: 40,
      }
    });

    // Create schema and prompt
    const schema = `
    LatinAnalysis = {
      "words": Array<{
        "word": string,  // Original Latin word as it appears in text
        "partOfSpeech": string,  // e.g., "noun", "verb", "adjective", etc.
        "lemma": string,  // Dictionary form of the word
        "meaning": {
          "short": string,  // Brief definition
          "detailed": string  // More complete definition
        },
        "morphology": {
          "case"?: "nominative"|"genitive"|"dative"|"accusative"|"ablative"|"vocative",
          "number"?: "singular"|"plural",
          "gender"?: "masculine"|"feminine"|"neuter",
          "person"?: "1"|"2"|"3",
          "tense"?: "present"|"imperfect"|"future"|"perfect"|"pluperfect"|"future perfect",
          "mood"?: "indicative"|"subjunctive"|"imperative"|"infinitive",
          "voice"?: "active"|"passive",
          "degree"?: "positive"|"comparative"|"superlative"
        },
        "relationships": Array<{
          "type": string,
          "relatedWordIndex": number,
          "description": string,
          "direction": "from"|"to"
        }>,
        "relatedWords": {
          "synonyms": Array<string>,
          "derivedForms": Array<string>,
          "usageExamples": Array<string>
        },
        "position": {
          "sentenceIndex": number,
          "wordIndex": number
        }
      }>,
      "sentences"?: Array<{
        "original": string,
        "translation"?: string,
        "structure"?: string
      }>
    }
    Return: LatinAnalysis
    `;

    // Limit text length to get faster responses
    const textToAnalyze = text.length > 500 ? text.substring(0, 500) : text;

    const prompt = `You are Latinium, an expert Latin language analysis system. Analyze the following Latin text and provide a comprehensive grammatical breakdown following this schema:

    ${schema}

    Important rules for analysis:
    1. For each word, identify grammatical relationships with other words
    2. For verbs, identify subjects and objects with precise relationship descriptions
    3. For adjectives, identify the nouns they modify
    4. For relationships, use "direction": "from" when the word acts on another (e.g., verb → object) 
       and "direction": "to" when it is acted upon (e.g., subject → verb)
    5. Ensure bidirectional relationships are captured
    6. Number words starting from 0
    7. Include position data for visualization

    Latin text to analyze: "${textToAnalyze}"
    `;

    console.log('Sending direct request to Gemini API...');
    
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
    // Set a timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Try to extract and parse the JSON
      const cleanedJson = extractJsonFromText(responseText);
      const parsedResult = JSON.parse(cleanedJson);
      
      return {
        result: parsedResult,
        isMockData: false
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Error in regular Gemini request:', error);
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
      // Try to extract and parse JSON from the complete response
      const cleanedJson = extractJsonFromText(fullResponse);
      const parsedResult = JSON.parse(cleanedJson);
      
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