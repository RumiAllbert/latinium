import { GoogleGenerativeAI } from '@google/generative-ai';
import type { APIRoute } from 'astro';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
    AnalyzeLatinRequest,
    LatinAnalysisError,
    LatinAnalysisResponse
} from '../../types/latin';
import { latinCache } from '../../utils/cache';
import { getGeminiApiKey } from '../../utils/env';
import { logDebugError } from '../../utils/errorHandling';

// Function to directly read the API key from the .env file as a fallback
function readApiKeyFromEnvFile(): string {
  try {
    // Get the root directory of the project (assuming this file is in src/pages/api)
    const rootDir = path.resolve(process.cwd());
    const envPath = path.join(rootDir, '.env');
    
    console.log(`Looking for .env file at: ${envPath}`);
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      console.log('Found .env file. Parsing for API key...');
      
      // Simple regex to extract the API key
      const keyMatch = envContent.match(/GEMINI_API_KEY=([^\r\n]+)/);
      if (keyMatch && keyMatch[1]) {
        console.log('API key found in .env file');
        return keyMatch[1].trim();
      }
    }
    
    console.log('.env file not found or API key not in file');
    return '';
  } catch (error) {
    console.error('Error reading .env file:', error);
    return '';
  }
}

// Rate limiting state
const rateLimiter = {
  requests: new Map<string, number[]>(),
  maxRequestsPerMinute: 10,
  
  isRateLimited(clientId: string): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000; // 1 minute ago
    
    // Initialize if first request
    if (!this.requests.has(clientId)) {
      this.requests.set(clientId, [now]);
      return false;
    }
    
    // Get existing requests and filter out ones older than 1 minute
    const clientRequests = this.requests.get(clientId) || [];
    const recentRequests = clientRequests.filter(time => time > oneMinuteAgo);
    
    // Update the requests array with only recent ones
    this.requests.set(clientId, recentRequests);
    
    // Check if rate limited
    return recentRequests.length >= this.maxRequestsPerMinute;
  },
  
  recordRequest(clientId: string): void {
    const now = Date.now();
    const existingRequests = this.requests.get(clientId) || [];
    this.requests.set(clientId, [...existingRequests, now]);
  },
  
  getTimeUntilReset(clientId: string): number {
    if (!this.requests.has(clientId)) {
      return 0;
    }
    
    const clientRequests = this.requests.get(clientId) || [];
    if (clientRequests.length === 0) {
      return 0;
    }
    
    // Find the oldest request within the last minute
    const now = Date.now();
    const oldestRecentRequest = Math.min(...clientRequests.filter(time => time > now - 60 * 1000));
    
    // Return time until it expires from the rate limit window
    return Math.max(0, (oldestRecentRequest + 60 * 1000) - now);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get the request body
    const body = await request.json() as AnalyzeLatinRequest;
    const { text, stream = false } = body;
    
    if (!text) {
      return new Response(
        JSON.stringify({
          error: 'No text provided for analysis',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Simple client ID for rate limiting (in production, use proper user ID or IP)
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous';
    
    // Check rate limiting
    if (rateLimiter.isRateLimited(clientId)) {
      const resetTime = rateLimiter.getTimeUntilReset(clientId);
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          details: 'Too many requests in a short period',
          errorType: 'rate_limit_error',
          retryable: true,
          resetInMs: resetTime,
          resetInSeconds: Math.ceil(resetTime / 1000),
          suggestions: getErrorSuggestions('rate_limit_error')
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(resetTime / 1000).toString()
          },
        }
      );
    }
    
    // Check if we have a cached result (except for streaming requests)
    if (!stream && latinCache.has(text)) {
      console.log('Cache hit! Returning cached analysis result');
      const cachedResult = latinCache.get(text);
      
      if (cachedResult) {
        return new Response(
          JSON.stringify(cachedResult),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Cache': 'HIT'
            },
          }
        );
      }
    }
    
    // Record this request for rate limiting
    rateLimiter.recordRequest(clientId);
    
    // Try multiple approaches to get the API key
    // 1. Try our utility function
    let apiKey = getGeminiApiKey();
    
    // 2. If that fails, try process.env directly
    if (!apiKey && process.env.GEMINI_API_KEY) {
      apiKey = process.env.GEMINI_API_KEY;
      console.log('Found API key in process.env');
    }
    
    // 3. If that fails, try reading from .env file directly
    if (!apiKey) {
      apiKey = readApiKeyFromEnvFile();
    }
    
    // Log the API key status (without revealing the actual key)
    console.log('API key status:', apiKey ? 'Found' : 'Not found');
    
    if (!apiKey) {
      logDebugError('API Key Check', 'API key not configured in environment variables');
      console.error('Missing API key. Could not find GEMINI_API_KEY in any location.');
      console.log('Current working directory:', process.cwd());
      
      return new Response(
        JSON.stringify({
          error: 'API key not configured',
          details: 'Please add your Gemini API key to the .env file at the project root',
          message: 'Please add your Gemini API key to the .env file at the project root',
          debug: {
            envFile: fs.existsSync(path.join(process.cwd(), '.env')) ? 'Exists' : 'Not found',
            cwd: process.cwd(),
            checkLocations: ['.env file', 'environment variables', 'Astro config']
          },
          fallback: true
        } as LatinAnalysisError),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Initialize the Gemini API client with the newer model
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "models/gemini-2.5-flash-lite",
      // Add system instructions to guide the model's behavior
      systemInstruction: `You are Latinium, an expert Latin language analysis system that specializes in 
      detailed grammatical analysis of Latin texts. Your purpose is to provide accurate, 
      comprehensive breakdowns of Latin passages with particular attention to:
      
      1. Precise morphological analysis of each word
      2. Clear identification of syntactic relationships between words
      3. Accurate lemmatization and dictionary forms
      4. Contextually appropriate translations and meanings
      5. Detailed explanation of grammatical constructions
      
      You should analyze text with classical Latin grammar rules in mind, noting any 
      post-classical or medieval variations when relevant. Always return data in a clean,
      structured JSON format exactly as specified in the prompt, with no additional text,
      explanations, or markdown formatting.`
    });
    
    // Create an improved schema for Latin text analysis that better models relationships
    const schema = `
    LatinAnalysis = {
      "words": Array<{
        "word": string,  // Original Latin word as it appears in text
        "partOfSpeech": string,  // e.g., "noun", "verb", "adjective", "adverb", "preposition", "conjunction", "pronoun"
        "lemma": string,  // Dictionary form of the word
        "meaning": {
          "short": string,  // Brief definition (1-3 words)
          "detailed": string  // More complete definition explaining usage and context
        },
        "morphology": {
          // For nouns:
          "case"?: "nominative"|"genitive"|"dative"|"accusative"|"ablative"|"vocative",
          "number"?: "singular"|"plural",
          "gender"?: "masculine"|"feminine"|"neuter",
          
          // For verbs:
          "person"?: "1"|"2"|"3",
          "number"?: "singular"|"plural",
          "tense"?: "present"|"imperfect"|"future"|"perfect"|"pluperfect"|"future perfect",
          "mood"?: "indicative"|"subjunctive"|"imperative"|"infinitive",
          "voice"?: "active"|"passive",
          
          // For adjectives/adverbs:
          "degree"?: "positive"|"comparative"|"superlative"
        },
        "relationships": Array<{
          "type": string,  // e.g., "subject-verb", "verb-object", "adjective-noun"
          "relatedWordIndex": number,  // Index of related word in the array
          "description": string,  // Brief explanation of relationship
          "direction": "from"|"to"  // Indicates whether this word points to another or is pointed to
        }>,
        "relatedWords": {
          "synonyms": Array<string>,
          "derivedForms": Array<string>,
          "usageExamples": Array<string>
        },
        "position": {
          "sentenceIndex": number,  // Index of the sentence in the text
          "wordIndex": number  // Index of the word within its sentence
        }
      }>,
      "sentences"?: Array<{
        "original": string,  // The original Latin sentence
        "translation"?: string,  // An English translation
        "structure"?: string  // Description of sentence structure (e.g., "cum temporal clause with main clause")
      }>
    }
    Return: LatinAnalysis
    `;
    
    // Create prompt for Latin text analysis with the improved schema
    const prompt = `Analyze the following Latin text and provide a comprehensive grammatical breakdown following this schema:

    ${schema}
    
    Important rules for analysis:
    1. For each word, identify ALL grammatical relationships with other words
    2. For verbs, identify subjects and objects with precise relationship descriptions
    3. For adjectives, identify the nouns they modify
    4. For prepositions, identify their objects
    5. For relationships, use "direction": "from" when the word acts on another (e.g., verb → object) 
       and "direction": "to" when it is acted upon (e.g., subject → verb)
    6. Ensure bidirectional relationships are captured (e.g., if word A relates to word B, word B should also relate to word A)
    7. Number words starting from 0 for each analysis type (wordIndex and relatedWordIndex)
    8. Include position data for enabling UI visualization features
    
    Latin text to analyze: "${text}"
    `;
    
    console.log('Sending request to Gemini API...');
    
    // If streaming is requested, return a streaming response
    if (stream) {
      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              const stream = await model.generateContentStream(prompt);
              
              // Send the opening of the JSON structure
              controller.enqueue('{"status":"streaming","data":{');
              
              let accumulated = '';
              
              for await (const chunk of stream.stream) {
                const chunkText = chunk.text();
                accumulated += chunkText;
                
                // Send each chunk as it arrives
                controller.enqueue(JSON.stringify({ chunk: chunkText }));
              }
              
              // Process the complete accumulated text at the end
              try {
                const cleanedJson = extractJsonFromText(accumulated);
                const parsed = JSON.parse(cleanedJson) as LatinAnalysisResponse;
                
                // Cache the complete result for future non-streaming requests
                latinCache.set(text, parsed);
                
                // Send completion message
                controller.enqueue(JSON.stringify({ 
                  status: "complete", 
                  fullResult: parsed 
                }));
              } catch (parseError) {
                // Handle parsing errors at the end
                controller.enqueue(JSON.stringify({ 
                  status: "error", 
                  error: "Failed to parse complete analysis",
                  details: parseError instanceof Error ? parseError.message : String(parseError)
                }));
              }
              
              controller.close();
            } catch (error) {
              controller.enqueue(JSON.stringify({ 
                status: "error", 
                error: "Stream processing failed",
                details: error instanceof Error ? error.message : String(error)
              }));
              controller.close();
            }
          }
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Transfer-Encoding': 'chunked',
            'X-Content-Type-Options': 'nosniff'
          }
        }
      );
    }
    
    // Non-streaming approach
    try {
      // Generate content with the model
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      console.log('Response received from Gemini API');
      
      // Clean the response text to extract valid JSON
      const cleanedJson = extractJsonFromText(responseText);
      
      // Parse the JSON response
      try {
        console.log('Attempting to parse JSON response...');
        const parsedResponse = JSON.parse(cleanedJson) as LatinAnalysisResponse;
        console.log('JSON parsed successfully');
        
        // Store in cache for future requests
        latinCache.set(text, parsedResponse);
        console.log('Response cached for future requests');
        
        return new Response(
          JSON.stringify(parsedResponse),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Cache': 'MISS'
            },
          }
        );
      } catch (parseError) {
        logDebugError('JSON Parsing', parseError);
        console.error('Raw response was:', responseText);
        console.error('Cleaned JSON was:', cleanedJson);
        
        return new Response(
          JSON.stringify({
            error: 'Failed to parse analysis results',
            details: parseError instanceof Error ? parseError.message : String(parseError),
            rawResponse: cleanedJson.substring(0, 200) + '...', // Include partial raw response for debugging
            fallback: true, // Indicator that client should use fallback
            errorType: 'parsing_error'
          } as LatinAnalysisError),
          {
            status: 422, // Unprocessable Entity - more specific than 500
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    } catch (apiError) {
      logDebugError('Gemini API Call', apiError);
      
      // Determine if this is a rate limit error, authentication error, or other error
      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
      let statusCode = 500;
      let errorType = 'unknown_error';
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
        statusCode = 429; // Too Many Requests
        errorType = 'rate_limit_error';
      } else if (errorMessage.includes('authentication') || errorMessage.includes('auth') || errorMessage.includes('key')) {
        statusCode = 401; // Unauthorized
        errorType = 'authentication_error';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('deadline')) {
        statusCode = 504; // Gateway Timeout
        errorType = 'timeout_error';
      }
      
      return new Response(
        JSON.stringify({
          error: 'Failed to call Gemini API',
          details: errorMessage,
          errorType,
          retryable: statusCode === 429 || statusCode === 504, // Mark if client should retry
          fallback: true,
          suggestions: getErrorSuggestions(errorType)
        } as LatinAnalysisError),
        {
          status: statusCode,
          headers: {
            'Content-Type': 'application/json',
            ...(statusCode === 429 ? { 'Retry-After': '60' } : {}) // Suggest retry after 1 minute for rate limits
          },
        }
      );
    }
  } catch (error) {
    logDebugError('Latin Analysis API', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to analyze text',
        details: error instanceof Error ? error.message : String(error),
        errorType: 'general_error',
        fallback: true, // Indicator that client should use fallback
        timestamp: new Date().toISOString() // Include timestamp for logging purposes
      } as LatinAnalysisError),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * Provides user-friendly suggestions based on error type
 * @param errorType The type of error encountered
 * @returns Array of user-friendly suggestions
 */
function getErrorSuggestions(errorType: string): string[] {
  switch (errorType) {
    case 'rate_limit_error':
      return [
        'Wait a moment and try again',
        'Try analyzing a shorter text passage',
        'Check your API usage limits in your Google Cloud console'
      ];
    case 'authentication_error':
      return [
        'Verify your Gemini API key is correct in the .env file',
        'Ensure your API key has permission to use the Gemini API',
        'Check if your API key has expired or been revoked'
      ];
    case 'timeout_error':
      return [
        'Try with a shorter text passage',
        'The server might be experiencing high load, try again later',
        'Check your network connection'
      ];
    case 'parsing_error':
      return [
        'The AI generated malformed JSON. Try again or use simpler Latin text',
        'Report this issue with the text you were analyzing'
      ];
    default:
      return [
        'Try refreshing the page',
        'Try with a different Latin text',
        'If the problem persists, contact support'
      ];
  }
}

/**
 * Extracts valid JSON from a text that might contain other formatting like markdown code blocks
 * @param text The text to extract JSON from
 * @returns Cleaned JSON string
 */
function extractJsonFromText(text: string): string {
  // Check if the text is already valid JSON
  try {
    JSON.parse(text);
    return text; // If it parses successfully, return as is
  } catch (e) {
    // Not valid JSON, try to extract it
    console.log('Response is not valid JSON, attempting to extract...');
  }
  
  // If the response is wrapped in markdown code blocks ```json ... ```, extract just the JSON part
  const jsonCodeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = text.match(jsonCodeBlockRegex);
  
  if (match && match[1]) {
    console.log('Found JSON in code block');
    return match[1].trim();
  }
  
  // If no code block, try to find anything that looks like JSON (starts with { and ends with })
  const jsonObjectRegex = /(\{[\s\S]*\})/;
  const objectMatch = text.match(jsonObjectRegex);
  
  if (objectMatch && objectMatch[1]) {
    console.log('Found JSON object pattern');
    return objectMatch[1].trim();
  }
  
  // If we still can't find valid JSON, remove backticks and any non-JSON text
  // First, strip all backticks
  console.log('Attempting to clean and extract JSON with more aggressive methods');
  let cleaned = text.replace(/`/g, '');
  
  // Try to find the start of a JSON object
  const startIndex = cleaned.indexOf('{');
  const endIndex = cleaned.lastIndexOf('}');
  
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    console.log(`Found JSON boundaries from index ${startIndex} to ${endIndex}`);
    cleaned = cleaned.substring(startIndex, endIndex + 1);
    return cleaned;
  }
  
  // If all else fails, return the original text and let the JSON parser throw an error
  // This will help with debugging
  console.warn('Could not extract valid JSON from the response');
  return text;
} 
