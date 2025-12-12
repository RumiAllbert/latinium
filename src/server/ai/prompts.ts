export const LATIN_SYSTEM_INSTRUCTION = `You are Latinium, an expert Latin language tutor and analysis engine.
You return clean, structured JSON exactly as requested. No markdown, no prose outside JSON.`;

export function analysisPrompt(text: string): string {
  // Keep schema compact but stable; UI expects words[].word/lemma/partOfSpeech/meaning/morphology/relationships.
  const schema = `
  AnalysisResult = {
    "words": Array<{
      "word": string,
      "partOfSpeech": string,
      "lemma": string,
      "meaning": { "short": string, "detailed": string },
      "morphology": Record<string, any>,
      "relationships": Array<{ "type": string, "relatedWordIndex": number, "description": string, "direction": "from"|"to" }>
    }>,
    "sentences"?: Array<{ "text": string, "translation"?: string }>
  }
  Return: AnalysisResult (JSON only)`;

  return `Return ONLY valid JSON matching the schema below. Analyze the Latin text word-by-word. Be conservative: if unsure, set fields to empty strings or empty arrays rather than guessing wildly.
${schema}
Text: ${JSON.stringify(text)}`;
}

export function tutorPrompt(params: { sentence: string; level: 'basic' | 'detailed' }): string {
  const schema = `
  TutorExplanation = {
    "sentence": string,
    "translation"?: string,
    "steps": Array<{ "title": string, "question": string, "hint"?: string, "expectedAnswer"?: string, "explanation"?: string }>
  }
  Return: TutorExplanation (JSON only)`;

  return `Return ONLY valid JSON matching the schema below. You are a Latin tutor. Create a short step-by-step guide: find verb, find subject, find objects, modifiers, then produce a concise translation. Level: ${params.level}.
${schema}
Sentence: ${JSON.stringify(params.sentence)}`;
}

export function quizPrompt(sentence: string): string {
  const schema = `
  QuizData = {
    "questions": Array<{
      "question": string,
      "options": string[],
      "correctAnswer": number,
      "explanation": string
    }>
  }
  Return: QuizData (JSON only)`;

  return `Return ONLY valid JSON matching the schema below. Create a 3–6 question quiz for the Latin sentence. Mix morphology, syntax, and translation. Ensure correctAnswer is an index into options.
${schema}
Sentence: ${JSON.stringify(sentence)}`;
}

export function vocabPrompt(text: string): string {
  const schema = `
  VocabularyData = {
    "cards": Array<{
      "word": string,
      "lemma": string,
      "partOfSpeech": string,
      "meaning": string,
      "relatedWords": string[],
      "usageExamples": string[],
      "frequency": "common"|"uncommon"|"rare"
    }>
  }
  Return: VocabularyData (JSON only)`;

  return `Return ONLY valid JSON matching the schema below. Produce 10–25 vocabulary cards from the Latin text (focus on pedagogically useful words). Avoid duplicates.
${schema}
Text: ${JSON.stringify(text)}`;
}

export function graphPrompt(text: string): string {
  const schema = `
  GraphData = {
    "nodes": Array<{ "id": string, "label": string, "type": string }>,
    "edges": Array<{ "source": string, "target": string, "label": string }>
  }
  Return: GraphData (JSON only)`;

  return `Return ONLY valid JSON matching the schema below. Build a dependency-style graph for the Latin text.
- Nodes should be content words (include function words only if helpful).
- Types: noun|verb|adjective|adverb|prep|pronoun|conjunction|other.
- Edges should be labeled with relations like subject, object, modifier, prep-object, etc.
${schema}
Text: ${JSON.stringify(text)}`;
}

export function prosodyPrompt(text: string): string {
  const schema = `
  ProsodyData = {
    "scansion": Array<{
      "word": string,
      "syllables": Array<{ "syllable": string, "length": "long"|"short"|"anceps", "stress": boolean }>
    }>,
    "meter": string,
    "analysis": string
  }
  Return: ProsodyData (JSON only)`;

  return `Return ONLY valid JSON matching the schema below. If the text is prose, set meter to "prose" and still provide helpful stress/quantity notes where possible.
${schema}
Text: ${JSON.stringify(text)}`;
}

export function parsingPrompt(text: string): string {
  const schema = `
  ParsingData = {
    "exercises": Array<{
      "type": "identify-function"|"transform-sentence",
      "instruction": string,
      "sentence": string,
      "elements"?: Array<{ "word": string, "function": string, "explanation": string }>,
      "transformation"?: { "from": string, "to": string, "explanation": string },
      "difficulty": "easy"|"medium"|"hard",
      "hint"?: string
    }>
  }
  Return: ParsingData (JSON only)`;

  return `Return ONLY valid JSON matching the schema below. Create 3–6 parsing exercises from the Latin text.
${schema}
Text: ${JSON.stringify(text)}`;
}


