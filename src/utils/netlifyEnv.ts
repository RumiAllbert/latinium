/**
 * Utility to safely access environment variables in a Netlify-deployed application
 * with fallbacks and helpful debug information
 */

/**
 * Get the Gemini API key with various fallback mechanisms and debug logging
 * @returns The API key as a string, or empty string if not found
 */
export const getGeminiApiKey = (): string => {
  // Try the standard public environment variable first
  const publicKey = import.meta.env.PUBLIC_GEMINI_API_KEY;
  
  // If found, use it
  if (publicKey) {
    console.log('Using PUBLIC_GEMINI_API_KEY from import.meta.env');
    return publicKey;
  }
  
  // Fallback to direct window object check (sometimes Netlify exposes variables this way)
  // @ts-ignore - Access potential global variables for environment check
  if (typeof window !== 'undefined' && window.PUBLIC_GEMINI_API_KEY) {
    // @ts-ignore
    console.log('Using PUBLIC_GEMINI_API_KEY from window object');
    // @ts-ignore
    return window.PUBLIC_GEMINI_API_KEY;
  }

  // Check for non-public version as last resort
  const nonPublicKey = import.meta.env.GEMINI_API_KEY;
  if (nonPublicKey) {
    console.log('Using GEMINI_API_KEY from import.meta.env (non-public version)');
    return nonPublicKey;
  }
  
  // Log detailed debug information if no key is found
  console.warn('No Gemini API key found. Debugging environment:');
  console.warn('- Available env variables:', Object.keys(import.meta.env).filter(key => !key.includes('SECRET')));
  console.warn('- Build mode:', import.meta.env.MODE);
  console.warn('- Is production?', import.meta.env.PROD);
  
  // Return empty string as fallback
  return '';
}; 