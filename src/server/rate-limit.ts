import { supabaseAdmin } from './supabase';

const LIMIT = 15;
const WINDOW_MS = 3 * 60 * 60 * 1000;

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; retryAfter: number; resetAt: number };

export async function checkAndRecord(ipHash: string): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();

  const { data: rows, error: selectError } = await supabaseAdmin
    .from('rate_limits')
    .select('called_at')
    .eq('ip_hash', ipHash)
    .gt('called_at', windowStart)
    .order('called_at', { ascending: true });
  if (selectError) throw selectError;

  const inWindow = rows ?? [];
  if (inWindow.length >= LIMIT) {
    const oldestMs = new Date(inWindow[0].called_at).getTime();
    const resetAt = oldestMs + WINDOW_MS;
    const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
    return { ok: false, retryAfter, resetAt };
  }

  const { error: insertError } = await supabaseAdmin
    .from('rate_limits')
    .insert({ ip_hash: ipHash });
  if (insertError) throw insertError;

  return {
    ok: true,
    remaining: LIMIT - inWindow.length - 1,
    resetAt: Date.now() + WINDOW_MS,
  };
}
