import { describe, expect, it } from 'vitest';
import { MODEL } from './gemini';

describe('MODEL', () => {
  it('is the verified Tier 1 model identifier', () => {
    expect(MODEL).toBe('gemini-3.1-flash-lite-preview');
  });
});
