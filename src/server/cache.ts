import { supabaseAdmin } from './supabase';

export type Endpoint =
  | 'analyze'
  | 'quiz'
  | 'tutor'
  | 'vocab'
  | 'graph'
  | 'prosody'
  | 'parsing';

export async function getCached(
  endpoint: Endpoint,
  textHash: string,
  model: string,
): Promise<unknown | null> {
  const { data, error } = await supabaseAdmin
    .from('analyses')
    .select('output')
    .eq('endpoint', endpoint)
    .eq('text_hash', textHash)
    .eq('model', model)
    .maybeSingle();
  if (error) throw error;
  return data?.output ?? null;
}

export async function putCached(
  endpoint: Endpoint,
  textHash: string,
  model: string,
  input: unknown,
  output: unknown,
): Promise<void> {
  const { error } = await supabaseAdmin.from('analyses').upsert(
    { endpoint, text_hash: textHash, model, input, output },
    { onConflict: 'endpoint,text_hash,model' },
  );
  if (error) throw error;
}
