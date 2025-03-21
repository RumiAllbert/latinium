import type { AnalysisResult } from '../types/AnalysisResult';
import { getUserFriendlyErrorMessage, logDebugError, trySafe } from './errorHandling';
import { getMockAnalysisData } from './mockData';

/**
 * Returns the appropriate API endpoint URL based on the environment
 */
function getApiEndpoint(): string {
  // When running locally or in dev mode, use the Astro API endpoint
  if (import.meta.env.DEV) {
    return '/api/analyze';
  }
  
  // In production on Netlify, use the direct Netlify function endpoint
  // This avoids relying on redirects which might cause issues
  return '/.netlify/functions/analyze';
}

/**
 * Analyzes Latin text using the Gemini API.
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
  try {
    // Check if text is empty
    if (!text || text.trim() === '') {
      console.warn('Empty text provided, returning mock data');
      return {
        result: getMockAnalysisData(text || 'empty text', true),
        isMockData: true
      };
    }

    // If streaming is requested but no callback is provided, it doesn't make sense
    if (options.stream && !options.onStreamChunk) {
      console.warn('Stream option set but no onStreamChunk callback provided. Falling back to non-streaming request.');
      options.stream = false;
    }
    
    // Try to call the server-side API endpoint
    console.log(`Attempting to analyze Latin text via server API (streaming: ${options.stream ? 'yes' : 'no'})...`);
    
    try {
      if (options.stream) {
        // Handle streaming request
        return await handleStreamingRequest(text, options.onStreamChunk!);
      } else {
        // Handle regular request
        return await handleRegularRequest(text);
      }
    } catch (fetchError) {
      console.error('Fetch or API error:', fetchError);
      // If there's a network error or API issue, use mock data
      console.warn('Using mock data due to API error');
      return {
        result: getMockAnalysisData(text, true),
        isMockData: true
      };
    }
  } catch (error) {
    // Log the error for debugging
    logDebugError('Client-side Latin analysis', error);
    
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
 * Handles a regular (non-streaming) API request
 */
async function handleRegularRequest(text: string): Promise<{
  result: AnalysisResult,
  isMockData: boolean
}> {
  const apiEndpoint = getApiEndpoint();
  console.log(`Sending request to API endpoint: ${apiEndpoint}`);
  
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  console.log('API response status:', response.status);
  
  if (!response.ok) {
    // If we get a non-OK response, check if it's a structured error
    const errorData = await trySafe(async () => await response.json(), null);
    console.log('Error data from server:', errorData);
    
    if (errorData && errorData.fallback) {
      // Server indicated we should use the fallback
      console.log('Server recommended using fallback, switching to mock data');
      return { 
        result: getMockAnalysisData(text, true), 
        isMockData: true 
      };
    }
    
    // Otherwise, throw a more specific error
    const errorMessage = errorData?.message || errorData?.error || `Server error: ${response.status}`;
    throw new Error(errorMessage);
  }

  // Parse the successful response
  const data = await trySafe(async () => await response.json(), null);
  
  if (!data) {
    console.error('Failed to parse response as JSON');
    throw new Error('Invalid response format from server');
  }
  
  console.log('Successfully received analysis from server API');
  
  // Validate the response has the expected structure
  if (!data.words || !Array.isArray(data.words)) {
    console.warn('Invalid or incomplete analysis data structure, falling back to mock data');
    return {
      result: getMockAnalysisData(text, true),
      isMockData: true
    };
  }
  
  return { 
    result: data, 
    isMockData: false 
  };
}

/**
 * Handles a streaming API request and processes chunks as they arrive
 */
async function handleStreamingRequest(
  text: string, 
  onStreamChunk: (chunk: string) => void
): Promise<{
  result: AnalysisResult,
  isMockData: boolean
}> {
  const apiEndpoint = getApiEndpoint();
  console.log(`Sending streaming request to API endpoint: ${apiEndpoint}`);
  
  // Create a ReadableStream to receive streamed data
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, stream: true }),
  });

  if (!response.ok) {
    // Handle error response
    const errorData = await trySafe(async () => await response.json(), null);
    console.log('Error data from streaming server:', errorData);
    
    if (errorData && errorData.fallback) {
      console.log('Server recommended using fallback for streaming, switching to mock data');
      return { 
        result: getMockAnalysisData(text, true), 
        isMockData: true 
      };
    }
    
    // Otherwise, throw a more specific error
    const errorMessage = errorData?.message || errorData?.error || `Server error: ${response.status}`;
    throw new Error(errorMessage);
  }

  // Ensure we have a valid response body to read from
  if (!response.body) {
    throw new Error('No response body available for streaming');
  }

  // Create a reader from the response body stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let finalResult: AnalysisResult | null = null;
  let chunksReceived = 0;

  try {
    let receivedChunks = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('Stream complete');
        break;
      }
      
      // Decode the chunk and process it
      const chunk = decoder.decode(value, { stream: true });
      receivedChunks += chunk;
      chunksReceived++;
      
      try {
        // Try to parse complete JSON objects from the accumulated chunks
        // Split by possible JSON delimiters - each chunk might contain multiple JSON objects
        const parts = receivedChunks.split(/(?<=})(?=\{)/g);
        
        // Process all complete parts except the last one (which might be incomplete)
        for (let i = 0; i < parts.length - 1; i++) {
          try {
            const parsedPart = JSON.parse(parts[i]);
            
            if (parsedPart && typeof parsedPart === 'object') {
              if ('chunk' in parsedPart) {
                // This is a streaming chunk - send it to the callback
                onStreamChunk(parsedPart.chunk || "");
              } else if (parsedPart.status === 'complete' && parsedPart.fullResult) {
                // This is the final result - validate and keep it
                finalResult = validateAnalysisResult(parsedPart.fullResult);
              } else if (parsedPart.status === 'error') {
                console.error('Stream error:', parsedPart.error);
                throw new Error(parsedPart.error || "Unknown streaming error");
              }
            }
          } catch (e) {
            console.warn('Failed to parse stream chunk, skipping:', parts[i].substring(0, 100));
          }
        }
        
        // Keep the potentially incomplete last part
        receivedChunks = parts[parts.length - 1];
      } catch (e) {
        console.warn('Error processing stream chunk:', e);
      }
      
      // Also send the raw chunk to the callback for UI updates
      onStreamChunk(chunk);
    }
    
    // Try to process any remaining data
    if (receivedChunks.trim()) {
      try {
        const parsedRemaining = JSON.parse(receivedChunks);
        
        if (parsedRemaining && parsedRemaining.status === 'complete' && parsedRemaining.fullResult) {
          finalResult = validateAnalysisResult(parsedRemaining.fullResult);
        }
      } catch (e) {
        console.warn('Failed to parse remaining stream data');
      }
    }
    
    // If we have a final result, return it
    if (finalResult) {
      return {
        result: finalResult,
        isMockData: false
      };
    }
    
    // If we don't have a final result but received chunks, construct one from the chunks
    if (chunksReceived > 0) {
      console.log('No final result received, but chunks were processed. Using mock data as fallback.');
    }
    
    // Otherwise, use mock data as a fallback
    console.warn('No valid final result received from stream, using mock data');
    return { 
      result: getMockAnalysisData(text, true), 
      isMockData: true 
    };
  } catch (error) {
    console.error('Error in stream processing:', error);
    return { 
      result: getMockAnalysisData(text, true), 
      isMockData: true 
    };
  } finally {
    try {
      // Ensure the reader is released
      await reader.cancel();
    } catch (e) {
      console.warn('Failed to cancel stream reader:', e);
    }
  }
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
