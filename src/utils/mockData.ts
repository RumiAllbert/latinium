import type { AnalysisResult } from '../types/AnalysisResult';

/**
 * Generates mock analysis data for Latin text
 * Used as a fallback when the API is unavailable
 * 
 * @param latinText The Latin text to analyze
 * @param isMockData Flag to indicate this is mock data
 * @returns Mock analysis data in the correct format
 */
export function getMockAnalysisData(latinText: string, isMockData = false): AnalysisResult {
  // Split the text into words
  const words = latinText.split(/\s+/).filter(Boolean);
  
  // Create a basic analysis result
  const result: AnalysisResult = {
    words: words.map((word, index) => {
      // Determine part of speech based on word ending (very simplistic)
      let partOfSpeech = "noun"; // default
      if (word.endsWith("re") || word.endsWith("ri") || word.endsWith("t")) {
        partOfSpeech = "verb";
      } else if (word.endsWith("us") || word.endsWith("is") || word.endsWith("um")) {
        partOfSpeech = "adjective";
      } else if (word.endsWith("e") || word.endsWith("iter")) {
        partOfSpeech = "adverb";
      }

      // Create proper morphology based on part of speech
      const morphology = partOfSpeech === "verb" 
        ? {
            person: '3' as const,
            number: 'singular' as const,
            tense: 'present' as const,
            mood: 'indicative' as const,
            voice: 'active' as const
          }
        : {
            case: 'nominative' as const,
            number: 'singular' as const,
            gender: 'masculine' as const
          };

      // Create relationships with previous words when possible
      const relationships = index > 0 
        ? [{
            type: partOfSpeech === "verb" ? "verb-subject" : "adjective-noun",
            relatedWordIndex: Math.max(0, index - 1),
            description: `Related to "${words[Math.max(0, index - 1)]}"`
          }]
        : [];

      // Add mock meanings
      const meaning = {
        short: `Mock ${partOfSpeech}`,
        detailed: `This is a mock definition for the ${partOfSpeech} "${word}" generated for testing purposes.`
      };

      // Add mock related words
      const relatedWords = {
        synonyms: [`${word}us`, `${word}a`],
        derivedForms: [`${word}ium`, `${word}ibus`],
        usageExamples: [`${word} in exemplum.`]
      };

      return {
        word,
        partOfSpeech,
        lemma: word.toLowerCase(),
        morphology,
        relationships,
        meaning,
        relatedWords
      };
    })
  };
  
  // Add a flag to indicate this is mock data if requested
  if (isMockData) {
    (result as any)._isMockData = true;
  }
  
  return result;
}

/**
 * Simple hash function to generate consistent pseudorandom values based on strings
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
} 