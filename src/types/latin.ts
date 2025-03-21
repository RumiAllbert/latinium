/**
 * Latin analysis type definitions for use across the application
 */

export interface Meaning {
  short: string;
  detailed: string;
}

export interface Morphology {
  // Noun properties
  case?: 'nominative' | 'genitive' | 'dative' | 'accusative' | 'ablative' | 'vocative';
  number?: 'singular' | 'plural';
  gender?: 'masculine' | 'feminine' | 'neuter';
  
  // Verb properties
  person?: '1' | '2' | '3';
  tense?: 'present' | 'imperfect' | 'future' | 'perfect' | 'pluperfect' | 'future perfect';
  mood?: 'indicative' | 'subjunctive' | 'imperative' | 'infinitive';
  voice?: 'active' | 'passive';
  
  // Additional properties for other parts of speech can be added as needed
  degree?: 'positive' | 'comparative' | 'superlative'; // For adjectives/adverbs
}

export interface Relationship {
  type: string; // e.g., "subject-verb", "verb-object", "adjective-noun"
  relatedWordIndex: number;
  description: string;
  direction: 'from' | 'to'; // Indicates if this word points to another or is pointed to
}

export interface RelatedWords {
  synonyms: string[];
  derivedForms: string[];
  usageExamples: string[];
}

export interface WordAnalysis {
  word: string;
  partOfSpeech: string;
  lemma: string;
  meaning: Meaning;
  morphology: Morphology;
  relationships: Relationship[];
  relatedWords: RelatedWords;
  position: {
    sentenceIndex: number;
    wordIndex: number;
  };
}

export interface LatinSentence {
  original: string;
  translation?: string;
  structure?: string;
}

export interface LatinAnalysisResponse {
  words: WordAnalysis[];
  sentences?: LatinSentence[];
}

export interface LatinAnalysisError {
  error: string;
  details: string;
  errorType?: string;
  fallback?: boolean;
  retryable?: boolean;
  suggestions?: string[];
  timestamp?: string;
}

// API request/response types
export interface AnalyzeLatinRequest {
  text: string;
  stream?: boolean;
}

export interface AnalyzeLatinStreamChunk {
  chunk: string;
}

export interface AnalyzeLatinStreamComplete {
  status: 'complete';
  fullResult: LatinAnalysisResponse;
}

export interface AnalyzeLatinStreamError {
  status: 'error';
  error: string;
  details: string;
}

export type AnalyzeLatinStreamResponse = 
  | { status: 'streaming', data: Record<string, unknown> }
  | AnalyzeLatinStreamChunk
  | AnalyzeLatinStreamComplete
  | AnalyzeLatinStreamError; 