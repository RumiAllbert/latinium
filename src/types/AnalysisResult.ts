// Unified rich schema: reuse Latin types so UI can rely on
// relationships, structured meaning, and optional sentences.
import type {
    LatinSentence,
    WordAnalysis as RichWord,
} from "./latin";

export interface AnalysisResult {
  words: RichWord[];
  sentences?: LatinSentence[];
  learningObjectives?: {
    goals: string[];
    grammar: string[];
    vocabulary: string[];
  };
  pedagogicalMetadata?: {
    estimatedDifficulty: 'easy' | 'medium' | 'hard';
    learningTime: string;
    prerequisites: string[];
    followUpConcepts: string[];
  };
  degraded?: boolean;
  warning?: string;
}

// Backwards compatibility helpers (optional type exports)
export type AnalyzedWord = RichWord;
export type WordMeaning = RichWord["meaning"];
export type Morphology = RichWord["morphology"];
