import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getCached, putCached } from './cache';
import { supabaseAdmin } from './supabase';

const TEST_PREFIX = `test_${randomUUID()}_`;
const MODEL = 'test-model-v1';

async function cleanup() {
  await supabaseAdmin
    .from('analyses')
    .delete()
    .like('text_hash', `${TEST_PREFIX}%`);
}

beforeAll(cleanup);
afterAll(cleanup);

describe('cache', () => {
  it('returns null for a missing entry', async () => {
    const result = await getCached('analyze', `${TEST_PREFIX}miss`, MODEL);
    expect(result).toBeNull();
  });

  it('round-trips put -> get', async () => {
    const hash = `${TEST_PREFIX}roundtrip`;
    const input = { text: 'Gallia est' };
    const output = { words: [{ word: 'Gallia', lemma: 'Gallia' }] };
    await putCached('analyze', hash, MODEL, input, output);
    const result = await getCached('analyze', hash, MODEL);
    expect(result).toEqual(output);
  });

  it('treats endpoint as part of the key', async () => {
    const hash = `${TEST_PREFIX}endpoint`;
    await putCached('analyze', hash, MODEL, { x: 1 }, { kind: 'analyze' });
    await putCached('quiz', hash, MODEL, { x: 1 }, { kind: 'quiz' });
    expect(await getCached('analyze', hash, MODEL)).toEqual({ kind: 'analyze' });
    expect(await getCached('quiz', hash, MODEL)).toEqual({ kind: 'quiz' });
  });

  it('treats model as part of the key', async () => {
    const hash = `${TEST_PREFIX}model`;
    await putCached('analyze', hash, 'm1', { x: 1 }, { v: 1 });
    await putCached('analyze', hash, 'm2', { x: 1 }, { v: 2 });
    expect(await getCached('analyze', hash, 'm1')).toEqual({ v: 1 });
    expect(await getCached('analyze', hash, 'm2')).toEqual({ v: 2 });
  });

  it('upsert is idempotent — second put on the same key is a no-op overwrite', async () => {
    const hash = `${TEST_PREFIX}upsert`;
    await putCached('analyze', hash, MODEL, { x: 1 }, { v: 'first' });
    await putCached('analyze', hash, MODEL, { x: 1 }, { v: 'second' });
    expect(await getCached('analyze', hash, MODEL)).toEqual({ v: 'second' });
  });
});
