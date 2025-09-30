// Unified rich schema: reuse Latin types so UI can rely on
// relationships, structured meaning, and optional sentences.
import type {
  WordAnalysis as RichWord,
  LatinSentence,
} from "./latin";

export interface AnalysisResult {
  words: RichWord[];
  sentences?: LatinSentence[];
}

// Backwards compatibility helpers (optional type exports)
export type AnalyzedWord = RichWord;
export type WordMeaning = RichWord["meaning"];
export type Morphology = RichWord["morphology"];
