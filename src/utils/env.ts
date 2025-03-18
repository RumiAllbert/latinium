/**
 * Environment variable utility functions
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Directly reads the API key from the .env file
 * @returns The API key or empty string if not found
 */
function readApiKeyFromFile(): string {
  try {
    // Check multiple possible locations
    const possiblePaths = [
      path.join(process.cwd(), '.env'),
      path.join(process.cwd(), 'src', '.env'),
      path.join(process.cwd(), '..', '.env')
    ];

    for (const envPath of possiblePaths) {
      if (fs.existsSync(envPath)) {
        console.log(`Found .env file at: ${envPath}`);
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        // Simple regex to extract the API key
        const keyMatch = envContent.match(/GEMINI_API_KEY=([^\r\n]+)/);
        if (keyMatch && keyMatch[1]) {
          return keyMatch[1].trim();
        }
      }
    }
    
    return '';
  } catch (error) {
    console.error('Error reading .env file:', error);
    return '';
  }
}

export function getEnvVariable(key: string, defaultValue: string = ''): string {
  // Try different ways to access environment variables
  const value = 
    // For server-side
    (typeof process !== 'undefined' && process.env && process.env[key]) ||
    // For client-side (if exposed)
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env[key] as string)) ||
    // Direct file read for API key specifically
    (key === 'GEMINI_API_KEY' ? readApiKeyFromFile() : '') ||
    // Default value as fallback
    defaultValue;
  
  return value;
}

/**
 * Gets the Gemini API key from environment variables
 * Provides a safe default and logs warnings if not set
 */
export function getGeminiApiKey(): string {
  const apiKey = getEnvVariable('GEMINI_API_KEY', '');
  
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not found in environment variables!');
    console.warn('Please add it to your .env file at the project root.');
    console.warn('Current working directory:', process.cwd());
    
    // Additional debug info
    try {
      const rootEnvPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(rootEnvPath)) {
        console.log(`The .env file exists at ${rootEnvPath}`);
        const content = fs.readFileSync(rootEnvPath, 'utf8');
        console.log('File content length:', content.length);
        console.log('First 50 chars (sanitized):', content.substring(0, 50).replace(/[a-zA-Z0-9_-]{20,}/g, '[REDACTED]'));
      } else {
        console.log(`No .env file found at ${rootEnvPath}`);
      }
    } catch (err) {
      console.error('Error during debug check:', err);
    }
  }
  
  return apiKey;
} 