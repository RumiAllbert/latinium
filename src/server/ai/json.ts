/**
 * Extract a JSON substring from model output. Models sometimes wrap
 * JSON in code fences or surrounding prose.
 */
export function extractJsonFromText(text: string): string {
  const trimmed = text.trim();

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();

  const firstIdx = trimmed.indexOf('{');
  const lastIdx = trimmed.lastIndexOf('}');
  if (firstIdx !== -1 && lastIdx !== -1 && lastIdx > firstIdx) {
    return trimmed.slice(firstIdx, lastIdx + 1).trim();
  }

  throw new Error('Model did not return JSON.');
}
