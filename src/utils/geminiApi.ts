import type { AnalysisResult } from '../types/AnalysisResult';
import { analyzeLatin as directAnalyzeLatin } from './directGeminiApi';
import { getUserFriendlyErrorMessage, logDebugError } from './errorHandling';
import { getMockAnalysisData } from './mockData';

/**
 * Returns the appropriate API endpoint URL based on the environment
 * NOTE: This function now redirects to the directGeminiApi instead of Netlify Functions
 */
function getApiEndpoint(): string {
  console.warn('Netlify Functions approach is deprecated. Using direct API instead.');
  return '/api/analyze'; // This will never be used now, but kept for backward compatibility
}

/**
 * Analyzes Latin text using the Gemini API.
 * This function now uses the direct API approach rather than Netlify Functions.
 * 
 * @param text The Latin text to analyze
 * @param options Additional options for the analysis
 * @returns An object containing the analysis result and a flag indicating if mock data was used
 */
export async function analyzeLatin(
  text: string, 
  options: { stream?: boolean, onStreamChunk?: (chunk: string) => void } = {}
): Promise<{ 
  result: AnalysisResult, 
  isMockData: boolean 
}> {
  console.warn('Using the legacy API client. Consider switching to directGeminiApi.ts directly.');
  
  try {
    // Simply redirect to the direct API implementation
    return await directAnalyzeLatin(text, options);
  } catch (error) {
    // Log the error for debugging
    logDebugError('Legacy API client (redirected to direct API)', error);
    
    // For the user, provide a friendly error message
    const errorMessage = getUserFriendlyErrorMessage(error);
    console.warn(`Using mock data due to error: ${errorMessage}`);
    
    // Fall back to using mock data
    return { 
      result: getMockAnalysisData(text, true), 
      isMockData: true 
    };
  }
}

/**
 * Handles a regular (non-streaming) API request - now redirects to direct API
 * @deprecated Use directGeminiApi.ts instead
 */
async function handleRegularRequest(text: string): Promise<{
  result: AnalysisResult,
  isMockData: boolean
}> {
  console.warn('Legacy handleRegularRequest called. Redirecting to direct API implementation.');
  return await directAnalyzeLatin(text);
}

/**
 * Handles a streaming API request - now redirects to direct API
 * @deprecated Use directGeminiApi.ts instead
 */
async function handleStreamingRequest(
  text: string, 
  onStreamChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<{
  result: AnalysisResult,
  isMockData: boolean
}> {
  console.warn('Legacy handleStreamingRequest called. Redirecting to direct API implementation.');
  return await directAnalyzeLatin(text, { 
    stream: true, 
    onStreamChunk 
  });
}

/**
 * Validates that an analysis result has the expected structure
 */
function validateAnalysisResult(result: any): AnalysisResult {
  // Basic validation of the result structure
  if (!result || typeof result !== 'object') {
    throw new Error('Invalid analysis result: not an object');
  }
  
  // Check for words array
  if (!result.words || !Array.isArray(result.words)) {
    throw new Error('Invalid analysis result: missing words array');
  }
  
  // Ensure each word has required properties
  for (const word of result.words) {
    if (!word.word || typeof word.word !== 'string') {
      throw new Error('Invalid word object: missing word text');
    }
    
    // Ensure relationships is an array (even if empty)
    if (!word.relationships) {
      word.relationships = [];
    } else if (!Array.isArray(word.relationships)) {
      throw new Error('Invalid word object: relationships is not an array');
    }
    
    // Ensure morphology exists (even if empty)
    if (!word.morphology || typeof word.morphology !== 'object') {
      word.morphology = {};
    }
  }
  
  return result as AnalysisResult;
}

/**
 * Provides mock analysis data when API is unavailable
 */
export { getMockAnalysisData };
