import { describe, expect, it } from 'vitest';
import { canonicalize, hashIp, hashRequest } from './hash';

describe('canonicalize', () => {
  it('serializes primitives via JSON.stringify', () => {
    expect(canonicalize('a')).toBe('"a"');
    expect(canonicalize(42)).toBe('42');
    expect(canonicalize(null)).toBe('null');
    expect(canonicalize(true)).toBe('true');
  });

  it('sorts object keys', () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    expect(canonicalize({ b: 1, a: 2 })).toBe(canonicalize({ a: 2, b: 1 }));
  });

  it('preserves array order', () => {
    expect(canonicalize([3, 1, 2])).toBe('[3,1,2]');
  });

  it('handles nested structures', () => {
    expect(canonicalize({ b: [{ y: 1, x: 2 }], a: 'x' })).toBe(
      '{"a":"x","b":[{"x":2,"y":1}]}',
    );
  });
});

describe('hashRequest', () => {
  it('returns a 64-char hex string', () => {
    const h = hashRequest('analyze', { text: 'Gallia' });
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is stable across key order', () => {
    const a = hashRequest('quiz', { sentence: 's', level: 'basic' });
    const b = hashRequest('quiz', { level: 'basic', sentence: 's' });
    expect(a).toBe(b);
  });

  it('differs when endpoint differs', () => {
    expect(hashRequest('analyze', { text: 'x' }))
      .not.toBe(hashRequest('quiz', { text: 'x' }));
  });
});

describe('hashIp', () => {
  it('returns a 64-char hex string', () => {
    expect(hashIp('1.2.3.4')).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic for the same input + APP_SECRET', () => {
    expect(hashIp('1.2.3.4')).toBe(hashIp('1.2.3.4'));
  });

  it('differs for different IPs', () => {
    expect(hashIp('1.2.3.4')).not.toBe(hashIp('1.2.3.5'));
  });
});
