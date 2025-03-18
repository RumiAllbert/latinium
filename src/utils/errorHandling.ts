/**
 * Utility functions for error handling
 */

/**
 * Safely attempts an operation that might throw an error
 * @param operation The operation to attempt
 * @param fallback The fallback value if the operation fails
 * @returns The result of the operation or the fallback value
 */
export function trySafe<T>(operation: () => T, fallback: T): T {
  try {
    return operation();
  } catch (error) {
    console.error('Operation failed:', error);
    return fallback;
  }
}

/**
 * Creates a simple error message for display to users
 * @param error The error object
 * @returns A user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // For specific errors, provide more helpful messages
    if (error.message.includes('API key not configured')) {
      return 'The Gemini API key is missing or invalid. Please check your .env file.';
    }
    
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return 'Too many requests to the Gemini API. Please try again in a few minutes.';
    }
    
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Logs detailed debugging information about an error
 * @param context A description of where the error occurred
 * @param error The error object
 */
export function logDebugError(context: string, error: unknown): void {
  console.group(`Error in ${context}`);
  console.error('Error details:', error);
  
  if (error instanceof Error) {
    console.error('Stack trace:', error.stack);
  }
  
  console.groupEnd();
} 