import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { latinCache } from './cache';
import type {
    AnalyzeLatinRequest,
    LatinAnalysisError,
    LatinAnalysisResponse
} from './types';

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
        'Verify your Gemini API key is correct in the environment variables',
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

// Add a timeout wrapper for the Gemini API call
async function callWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    // Race between the original promise and the timeout
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }
  
  try {
    // Parse the request body
    const body = JSON.parse(event.body || '{}') as AnalyzeLatinRequest;
    const { text, stream = false, shortenedText = false } = body;
    
    if (!text) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'No text provided for analysis',
        }),
        headers: {
          'Content-Type': 'application/json'
        } as Record<string, string>
      };
    }
    
    // Add some debug logging
    console.log(`Received analysis request for text of length ${text.length} (${stream ? 'streaming' : 'regular'} request)`);
    
    // For streaming requests with very long text, we can truncate to avoid timeouts
    let textToAnalyze = text;
    if (stream && shortenedText && text.length > 500) {
      // Truncate to first few sentences or 500 chars max for streaming
      const sentenceMatch = text.match(/^((?:[^.!?]+[.!?]+\s*){1,3})/);
      textToAnalyze = sentenceMatch ? sentenceMatch[0] : text.slice(0, 500);
      console.log(`Long text detected for streaming request. Truncated from ${text.length} to ${textToAnalyze.length} characters.`);
    }
    
    // Simple client ID for rate limiting
    const clientId = event.headers['x-forwarded-for'] || 'anonymous';
    
    // Check rate limiting
    if (rateLimiter.isRateLimited(clientId)) {
      const resetTime = rateLimiter.getTimeUntilReset(clientId);
      return {
        statusCode: 429,
        body: JSON.stringify({
          error: 'Rate limit exceeded',
          details: 'Too many requests in a short period',
          errorType: 'rate_limit_error',
          retryable: true,
          resetInMs: resetTime,
          resetInSeconds: Math.ceil(resetTime / 1000),
          suggestions: getErrorSuggestions('rate_limit_error')
        }),
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(resetTime / 1000).toString()
        }
      };
    }
    
    // Check if we have a cached result (except for streaming requests)
    if (!stream && latinCache.has(text)) {
      console.log('Cache hit! Returning cached analysis result');
      const cachedResult = latinCache.get(text);
      
      if (cachedResult) {
        return {
          statusCode: 200,
          body: JSON.stringify(cachedResult),
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT'
          }
        };
      }
    }
    
    // Record this request for rate limiting
    rateLimiter.recordRequest(clientId);
    
    // Get the API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Log the API key status (without revealing the actual key)
    console.log('API key status:', apiKey ? 'Found' : 'Not found');
    
    if (!apiKey) {
      console.error('Missing API key. Could not find GEMINI_API_KEY in environment variables.');
      
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'API key not configured',
          details: 'Please add your Gemini API key to the site environment variables',
          message: 'Please add your Gemini API key to the site environment variables',
          fallback: true
        } as LatinAnalysisError)
      };
    }
    
    // Initialize the Gemini API client with the newer model
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-lite", // Use the faster flash model for speed
      generationConfig: {
        temperature: 0.1,  // Lower temperature for faster, more deterministic outputs
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096, // Limit output size for faster responses
      }
    });
    
    // Create system instructions to guide the model
    const systemInstructions = `You are Latinium, an expert Latin language analysis system that specializes in 
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
    explanations, or markdown formatting.`;
    
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
    // If using shortened text for streaming, inform the model
    const analysisNote = shortenedText && textToAnalyze !== text 
      ? "\n\nNote: This is a partial analysis of the first part of a longer text." 
      : "";
    
    const prompt = `${systemInstructions}

Analyze the following Latin text and provide a comprehensive grammatical breakdown following this schema:

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
8. Include position data for enabling UI visualization features${analysisNote}

Latin text to analyze: "${textToAnalyze}"
`;
    
    // Log information about the request to help with debugging
    console.log(`Processing ${stream ? 'streaming' : 'standard'} request for Latin text analysis`);
    console.log(`API key status: ${apiKey ? 'Available' : 'Missing'}`);
    console.log(`Text length: ${textToAnalyze.length} characters`);
    console.log(`Using model: gemini-1.5-flash with low temperature`);

    try {
      // Generate content with the model with a timeout
      console.log('Sending request to Gemini API...');
      const startTime = Date.now();
      
      const result = await callWithTimeout(
        model.generateContent(prompt),
        25000 // 25 seconds timeout
      );
      
      const endTime = Date.now();
      console.log(`Gemini API response received in ${endTime - startTime}ms`);
      
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
        
        return {
          statusCode: 200,
          body: JSON.stringify(parsedResponse),
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'MISS'
          } as Record<string, string>
        };
      } catch (parseError) {
        console.error('Raw response was:', responseText);
        console.error('Cleaned JSON was:', cleanedJson);
        
        return {
          statusCode: 422,
          body: JSON.stringify({
            error: 'Failed to parse analysis results',
            details: parseError instanceof Error ? parseError.message : String(parseError),
            rawResponse: cleanedJson.substring(0, 200) + '...', // Include partial raw response for debugging
            fallback: true, // Indicator that client should use fallback
            errorType: 'parsing_error'
          } as LatinAnalysisError),
          headers: {
            'Content-Type': 'application/json'
          } as Record<string, string>
        };
      }
    } catch (apiError) {
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
      
      return {
        statusCode,
        body: JSON.stringify({
          error: 'Failed to call Gemini API',
          details: errorMessage,
          errorType,
          retryable: statusCode === 429 || statusCode === 504, // Mark if client should retry
          fallback: true,
          suggestions: getErrorSuggestions(errorType)
        } as LatinAnalysisError),
        headers: {
          'Content-Type': 'application/json',
          ...(statusCode === 429 ? { 'Retry-After': '60' } : {}) // Suggest retry after 1 minute for rate limits
        } as Record<string, string>
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to analyze text',
        details: error instanceof Error ? error.message : String(error),
        errorType: 'general_error',
        fallback: true,
        timestamp: new Date().toISOString()
      } as LatinAnalysisError),
      headers: {
        'Content-Type': 'application/json'
      } as Record<string, string>
    };
  }
};

export { handler };
