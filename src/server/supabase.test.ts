import { describe, expect, it } from 'vitest';
import { supabaseAdmin } from './supabase';

describe('supabaseAdmin', () => {
  it('connects and can run a trivial query', async () => {
    const { data, error } = await supabaseAdmin.rpc('prune_rate_limits');
    expect(error).toBeNull();
    expect(data ?? null).toBeNull();
  });

  it('reads from analyses table (empty result is fine)', async () => {
    const { data, error } = await supabaseAdmin
      .from('analyses')
      .select('id')
      .limit(1);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
