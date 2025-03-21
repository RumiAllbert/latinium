/**
 * Extracts valid JSON from a text that might contain other formatting like markdown code blocks
 * @param text The text to extract JSON from
 * @returns Cleaned JSON string
 */
export function extractJsonFromText(text: string): string {
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