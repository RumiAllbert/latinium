import type { AnalysisResult } from '../types/AnalysisResult';
import { getUserFriendlyErrorMessage, logDebugError, trySafe } from './errorHandling';
import { getMockAnalysisData } from './mockData';

/**
 * Analyzes Latin text using the Gemini API.
 * 
 * @param text The Latin text to analyze
 * @returns An object containing the analysis result and a flag indicating if mock data was used
 */
export async function analyzeLatin(text: string): Promise<{ 
  result: AnalysisResult, 
  isMockData: boolean 
}> {
  try {
    // Try to call the server-side API endpoint
    console.log('Attempting to analyze Latin text via server API...');
    
    // Check if text is empty
    if (!text || text.trim() === '') {
      console.warn('Empty text provided, returning mock data');
      return {
        result: getMockAnalysisData(text || 'empty text', true),
        isMockData: true
      };
    }
    
    try {
      const response = await fetch('/api/analyze', {
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
 * Provides mock analysis data when API is unavailable
 */
export { getMockAnalysisData };
