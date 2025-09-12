/**
 * Type for a word relationship in Latin text analysis
 */
export interface WordRelationship {
  type: string; // e.g., "subject-verb", "verb-object", "adjective-noun"
  relatedWordIndex: number; // Index of the related word in the words array
  description: string; // Brief explanation of the relationship
  direction?: 'from' | 'to';
}

/**
 * Type for morphological information about a Latin word
 */
export interface Morphology {
  // For nouns, adjectives, pronouns
  case?: 'nominative' | 'genitive' | 'dative' | 'accusative' | 'ablative' | 'vocative';
  number?: 'singular' | 'plural';
  gender?: 'masculine' | 'feminine' | 'neuter';
  
  // For verbs
  person?: '1' | '2' | '3';
  tense?: 'present' | 'imperfect' | 'future' | 'perfect' | 'pluperfect' | 'future perfect';
  mood?: 'indicative' | 'subjunctive' | 'imperative' | 'infinitive';
  voice?: 'active' | 'passive';
  
  // For other parts of speech
  degree?: 'positive' | 'comparative' | 'superlative'; // For adjectives and adverbs
}

/**
 * Type for meaning of a Latin word
 */
export interface WordMeaning {
  short: string; // Brief definition (1-3 words)
  detailed: string; // More complete definition explaining usage and context
}

/**
 * Type for related words (synonyms, derived forms, etc.)
 */
export interface RelatedWords {
  synonyms?: string[]; // Latin synonyms
  derivedForms?: string[]; // Other related Latin words
  usageExamples?: string[]; // Simple Latin phrases showing usage
}

/**
 * Type for a word in the Latin text analysis
 */
export interface AnalyzedWord {
  word: string; // The original Latin word
  partOfSpeech: string; // e.g., "noun", "verb", "adjective"
  lemma: string; // Dictionary form of the word
  meaning?: WordMeaning; // Word meaning and definition
  morphology: Morphology;
  relationships: WordRelationship[];
  relatedWords?: RelatedWords; // Related Latin words
  roleInSentence?: string;
  position?: { sentenceIndex: number; wordIndex: number };
  notes?: string;
}

/**
 * Type for the complete analysis result
 */
export interface AnalysisResult {
  words: AnalyzedWord[];
} 
