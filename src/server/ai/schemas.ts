import { z } from 'zod';

// --- analyze ---
export const analyzeBodySchema = z.object({
  text: z.string().min(1).max(2000),
});

const analyzeWordSchema = z
  .object({
    word: z.string(),
    partOfSpeech: z.string(),
    lemma: z.string(),
    meaning: z
      .object({
        short: z.string().optional(),
        detailed: z.string().optional(),
      })
      .partial()
      .optional(),
    morphology: z.record(z.unknown()).optional(),
    relationships: z
      .array(
        z.object({
          type: z.string(),
          relatedWordIndex: z.number(),
          description: z.string().optional(),
          direction: z.enum(['from', 'to']).optional(),
        }),
      )
      .optional(),
  })
  .passthrough();

export const analyzeOutputSchema = z
  .object({
    words: z.array(analyzeWordSchema),
    sentences: z
      .array(
        z
          .object({
            text: z.string().optional(),
            original: z.string().optional(),
            translation: z.string().optional(),
            structure: z.string().optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

// --- quiz ---
export const quizBodySchema = z.object({
  sentence: z.string().min(1).max(1000),
});

export const quizOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).min(2),
      correctAnswer: z.number().int().nonnegative(),
      explanation: z.string(),
    }),
  ),
});

// --- tutor ---
export const tutorBodySchema = z.object({
  sentence: z.string().min(1).max(1000),
  level: z.enum(['basic', 'detailed']).default('basic'),
});

export const tutorOutputSchema = z.object({
  sentence: z.string().optional(),
  translation: z.string().optional(),
  steps: z.array(
    z.object({
      title: z.string(),
      question: z.string(),
      hint: z.string().optional(),
      expectedAnswer: z.string().optional(),
      explanation: z.string().optional(),
    }),
  ),
});

// --- vocab ---
export const vocabBodySchema = z.object({
  text: z.string().min(1).max(2000),
});

export const vocabOutputSchema = z.object({
  cards: z.array(
    z.object({
      word: z.string(),
      lemma: z.string(),
      partOfSpeech: z.string(),
      meaning: z.string(),
      etymology: z.string().optional(),
      relatedWords: z.array(z.string()),
      usageExamples: z.array(z.string()),
      mnemonicDevice: z.string().optional(),
      frequency: z.enum(['common', 'uncommon', 'rare']),
    }),
  ),
});

// --- graph ---
export const graphBodySchema = z.object({
  text: z.string().min(1).max(2000),
});

export const graphOutputSchema = z.object({
  nodes: z.array(
    z.object({ id: z.string(), label: z.string(), type: z.string() }),
  ),
  edges: z.array(
    z.object({ source: z.string(), target: z.string(), label: z.string() }),
  ),
});

// --- prosody ---
export const prosodyBodySchema = z.object({
  text: z.string().min(1).max(2000),
});

export const prosodyOutputSchema = z.object({
  scansion: z.array(
    z.object({
      word: z.string(),
      syllables: z.array(
        z.object({
          syllable: z.string(),
          length: z.enum(['long', 'short', 'anceps']),
          stress: z.boolean(),
        }),
      ),
    }),
  ),
  meter: z.string(),
  analysis: z.string(),
});

// --- parsing ---
export const parsingBodySchema = z.object({
  text: z.string().min(1).max(2000),
});

export const parsingOutputSchema = z.object({
  exercises: z.array(
    z.object({
      type: z.enum(['identify-function', 'transform-sentence']),
      instruction: z.string(),
      sentence: z.string(),
      correctOrder: z.array(z.string()).optional(),
      elements: z
        .array(
          z.object({
            word: z.string(),
            function: z.string(),
            explanation: z.string(),
          }),
        )
        .optional(),
      transformation: z
        .object({
          from: z.string(),
          to: z.string(),
          explanation: z.string(),
        })
        .optional(),
      difficulty: z.enum(['easy', 'medium', 'hard']),
      hint: z.string().optional(),
    }),
  ),
});
