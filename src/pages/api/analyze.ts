import { GoogleGenerativeAI } from '@google/generative-ai';
import type { APIRoute } from 'astro';
import * as fs from 'node:fs';
import * as path from 'node:path';
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

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get the request body
    const body = await request.json();
    const { text } = body;
    
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
          message: 'Please add your Gemini API key to the .env file at the project root',
          debug: {
            envFile: fs.existsSync(path.join(process.cwd(), '.env')) ? 'Exists' : 'Not found',
            cwd: process.cwd(),
            checkLocations: ['.env file', 'environment variables', 'Astro config']
          },
          fallback: true
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Create prompt for Latin text analysis
    const prompt = `
      Analyze the following Latin text and provide a comprehensive grammatical breakdown.
      Return the analysis as a JSON object with the following structure for each word:
      {
        "words": [
          {
            "word": "original Latin word",
            "partOfSpeech": "noun|verb|adjective|etc",
            "lemma": "dictionary form",
            "meaning": {
              "short": "brief definition (1-3 words)",
              "detailed": "more complete definition explaining usage and context"
            },
            "morphology": {
              // For nouns:
              "case": "nominative|genitive|dative|accusative|ablative|vocative",
              "number": "singular|plural",
              "gender": "masculine|feminine|neuter",
              
              // For verbs:
              "person": "1|2|3",
              "number": "singular|plural",
              "tense": "present|imperfect|future|perfect|pluperfect|future perfect",
              "mood": "indicative|subjunctive|imperative|infinitive",
              "voice": "active|passive"
            },
            "relationships": [
              {
                "type": "subject-verb|verb-object|adjective-noun|etc",
                "relatedWordIndex": 3, // index of related word in the array
                "description": "brief explanation of relationship"
              }
            ],
            "relatedWords": {
              "synonyms": ["latin synonym1", "latin synonym2"],
              "derivedForms": ["other related latin words"],
              "usageExamples": ["simple latin phrase showing usage"]
            }
          }
        ]
      }
      
      Latin text: "${text}"
      
      IMPORTANT: Return only valid JSON without any additional text, markdown formatting, or code blocks. Do not wrap the JSON in backticks or add any other formatting.
    `;
    
    console.log('Sending request to Gemini API...');
    
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
        const parsedResponse = JSON.parse(cleanedJson);
        console.log('JSON parsed successfully');
        
        return new Response(
          JSON.stringify(parsedResponse),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
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
            fallback: true, // Indicator that client should use fallback
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    } catch (apiError) {
      logDebugError('Gemini API Call', apiError);
      
      return new Response(
        JSON.stringify({
          error: 'Failed to call Gemini API',
          details: apiError instanceof Error ? apiError.message : String(apiError),
          fallback: true,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
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
        fallback: true, // Indicator that client should use fallback
      }),
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