import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { checkAndRecord } from './rate-limit';
import { supabaseAdmin } from './supabase';

const TEST_PREFIX = `test_${randomUUID()}_`;

async function cleanup() {
  await supabaseAdmin
    .from('rate_limits')
    .delete()
    .like('ip_hash', `${TEST_PREFIX}%`);
}

beforeAll(cleanup);
afterAll(cleanup);

describe('rate limiter', () => {
  it('first call allowed, remaining = 14', async () => {
    const ip = `${TEST_PREFIX}first`;
    const r = await checkAndRecord(ip);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.remaining).toBe(14);
  });

  it('15th call allowed (remaining = 0), 16th blocked', async () => {
    const ip = `${TEST_PREFIX}fifteen`;
    for (let i = 0; i < 14; i++) {
      const r = await checkAndRecord(ip);
      expect(r.ok).toBe(true);
    }
    const fifteenth = await checkAndRecord(ip);
    expect(fifteenth.ok).toBe(true);
    if (fifteenth.ok) expect(fifteenth.remaining).toBe(0);

    const sixteenth = await checkAndRecord(ip);
    expect(sixteenth.ok).toBe(false);
    if (!sixteenth.ok) {
      expect(sixteenth.retryAfter).toBeGreaterThan(0);
      expect(sixteenth.retryAfter).toBeLessThanOrEqual(3 * 60 * 60);
      expect(sixteenth.resetAt).toBeGreaterThan(Date.now());
    }
  });

  it('two different IPs are independent', async () => {
    const a = `${TEST_PREFIX}sepA`;
    const b = `${TEST_PREFIX}sepB`;
    for (let i = 0; i < 15; i++) await checkAndRecord(a);
    const aBlocked = await checkAndRecord(a);
    expect(aBlocked.ok).toBe(false);
    const bAllowed = await checkAndRecord(b);
    expect(bAllowed.ok).toBe(true);
  });

  it('only counts rows inside the 3h window', async () => {
    const ip = `${TEST_PREFIX}window`;
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    // Manually insert 20 rows older than the window
    const oldRows = Array.from({ length: 20 }, () => ({
      ip_hash: ip,
      called_at: fourHoursAgo,
    }));
    const { error } = await supabaseAdmin.from('rate_limits').insert(oldRows);
    expect(error).toBeNull();
    const r = await checkAndRecord(ip);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.remaining).toBe(14);
  });
});
