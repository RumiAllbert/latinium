# Tier 1 — Infra + AI Backbone + Cache — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Latinium from Astro static + client-side Gemini to Astro SSR on Netlify, with all AI calls going through one server-side path that's IP-rate-limited and content-addressed-cached in Supabase, plus shareable analysis URLs.

**Architecture:** A single `createAiHandler` factory wraps each of the seven AI routes; it hashes the request, reads/writes a Supabase `analyses` cache, enforces a sliding-window IP rate limit via a Supabase `rate_limits` table, and returns a uniform error envelope. Share URLs (`/a/<hash>`) are SSR pages that read the cache directly. The Gemini key never leaves the server.

**Tech Stack:** Astro 4 SSR (`output: 'server'`) + `@astrojs/netlify` adapter, `@supabase/supabase-js` (service role on server), `@google/generative-ai`, `zod` for I/O validation, `vitest` for tests.

**Spec reference:** `docs/superpowers/specs/2026-04-30-tier-1-infra-ai-backbone-design.md`

---

## Pre-flight notes

- The repo currently has `output: 'static'` and a hacky `.env`-loading shim in `astro.config.mjs`. Both are replaced.
- Existing files we keep and extend: `src/server/ai/{gemini,prompts,json,errors}.ts`. Existing types: `src/types/AnalysisResult.ts`.
- All the seven AI route files exist and already share `getGeminiModel` + prompts. The migration is mostly *wrapping* them, not rewriting prompts.
- Tests run against the **real Supabase project** (one is already provisioned per the user's `.env.local`). Cleanup happens between tests so we don't pollute prod tables — see Task 5/6 for the test data isolation strategy (uses an `ip_hash`/`text_hash` prefix unique to each test run).
- Plan assumes Node 18.14.1+ (already required by the project) and `npm` (already used).
- All commits are made from a feature branch `tier-1-infra-ai-backbone`. Create it in Task 0.

---

## Task 0: Pre-flight — branch, model verification, env vars, test runner

**Files:**
- Modify: `.env.local` (user file, do not commit)
- Modify: `.env.example`
- Modify: `package.json`, `package-lock.json`
- Create: `vitest.config.ts`

- [ ] **Step 0.1: Create feature branch**

```bash
git checkout -b tier-1-infra-ai-backbone
git status
```

Expected: `On branch tier-1-infra-ai-backbone` with no uncommitted changes (apart from the unrelated `package.json`/`package-lock.json` drift the user already had — leave those alone for now).

- [ ] **Step 0.2: Verify the Gemini model identifier**

Use Context7 to look up the exact ID. From the agent harness:

```
ToolSearch query: "select:mcp__plugin_context7_context7__resolve-library-id,mcp__plugin_context7_context7__query-docs"
mcp__plugin_context7_context7__resolve-library-id with libraryName="@google/generative-ai"
mcp__plugin_context7_context7__query-docs with the resolved id, query="gemini-3.1-flash-lite-preview model identifier"
```

Confirm one of:
- `gemini-3.1-flash-lite-preview` (use as-is)
- A dated variant like `gemini-3.1-flash-lite-preview-MMDD` (use the dated string)
- Something else entirely (use the actual current "newest cheap Flash" ID and document the divergence in the commit message)

Record the chosen string. From here on the plan uses the placeholder `<MODEL_ID>` — substitute the verified value into the literal `MODEL` constant in Task 7 (and nowhere else).

- [ ] **Step 0.3: Confirm Supabase project + capture keys**

```
mcp__plugin_supabase_supabase__list_projects
```

Find the Latinium project. Capture:
- Project ref / `id`
- Project URL (matches the existing `SUPABASE_URL` in `.env.local`)
- Service role key — **NOT** the same as `SUPABASE_KEY` (which is anon). Get it via:

```
mcp__plugin_supabase_supabase__get_publishable_keys
```

If the MCP can only return publishable (anon) keys, fetch the service role key from the Supabase dashboard manually (Project Settings → API). The user already has the project linked, so this is a copy-paste.

- [ ] **Step 0.4: Generate APP_SECRET**

```bash
openssl rand -hex 32
```

Copy the output (a 64-char hex string).

- [ ] **Step 0.5: Update `.env.local`**

Open `.env.local` (don't read it through the agent — user file). Ensure these names exist with values:

```
GEMINI_API_KEY=<existing>
SUPABASE_URL=<existing>
SUPABASE_ANON_KEY=<existing or rename from SUPABASE_KEY>
SUPABASE_SERVICE_ROLE_KEY=<from step 0.3>
APP_SECRET=<from step 0.4>
```

If `SUPABASE_KEY` is the only one present and is the anon key, keep it AND add `SUPABASE_ANON_KEY=<same value>` so we standardize.

- [ ] **Step 0.6: Update `.env.example`**

Replace the entire file contents with:

```bash
# Latinium environment configuration
# Copy this file to .env.local and fill in real values for development.
# Set the same keys in the Netlify dashboard for deploys.

# Server-side Gemini key. NEVER expose to the client (no PUBLIC_ prefix).
GEMINI_API_KEY=

# Supabase project URL (https://<project-ref>.supabase.co)
SUPABASE_URL=

# Server-only Supabase service role key. NEVER expose to the client.
SUPABASE_SERVICE_ROLE_KEY=

# Public Supabase anon key. Safe to expose; used by the browser starting in Tier 2.
SUPABASE_ANON_KEY=

# Salt for hashing client IPs in the rate limiter. Generate with:
#   openssl rand -hex 32
APP_SECRET=
```

- [ ] **Step 0.7: Push env vars to Netlify**

User does this (or executor instructs the user):

```
Netlify dashboard → Site settings → Environment variables → Add:
  GEMINI_API_KEY
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_ANON_KEY
  APP_SECRET
```

Verify with `netlify env:list` if the Netlify CLI is installed. Skip if user prefers to set on first deploy.

- [ ] **Step 0.8: Install vitest**

```bash
npm install --save-dev vitest @types/node
```

- [ ] **Step 0.9: Create vitest config**

Create `vitest.config.ts` at repo root:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 15_000,
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

- [ ] **Step 0.10: Create vitest setup file**

Create `vitest.setup.ts` at repo root:

```ts
import { config } from 'dotenv';
config({ path: '.env.local' });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Tests require SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
}
if (!process.env.APP_SECRET) {
  throw new Error('Tests require APP_SECRET in .env.local');
}
```

```bash
npm install --save-dev dotenv
```

- [ ] **Step 0.11: Wire test script**

In `package.json`, add to `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 0.12: Verify vitest runs (no tests yet)**

```bash
npm test
```

Expected: `No test files found, exiting with code 0` (or vitest exit 0). Setup file must run without throwing — that confirms env vars loaded.

- [ ] **Step 0.13: Commit**

```bash
git add .env.example vitest.config.ts vitest.setup.ts package.json package-lock.json
git commit -m "chore(tier1): add vitest, env scaffolding, feature branch"
```

---

## Task 1: Switch to Astro SSR on Netlify

**Files:**
- Modify: `astro.config.mjs`
- Modify: `netlify.toml`
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1.1: Install adapter + supabase + zod**

```bash
npm install @astrojs/netlify @supabase/supabase-js zod
```

- [ ] **Step 1.2: Replace `astro.config.mjs`**

Overwrite the file entirely:

```js
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: netlify(),
  integrations: [tailwind(), react()],
  site: 'https://latinium.rumiallbert.com',
});
```

The previous file's `.env`-loading shim and `vite.define` block are deleted — Astro + Netlify already inject `process.env.*` at runtime, and we never want client-side Gemini keys.

- [ ] **Step 1.3: Replace `netlify.toml`**

Overwrite with:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18.20.4"

[dev]
  framework = "astro"
  targetPort = 4321
```

The previous SPA fallback redirects (`/* → /index.html`) are deleted — they would intercept SSR routes. The Netlify adapter generates the function routing automatically.

- [ ] **Step 1.4: Build to verify**

```bash
npm run build
```

Expected: Astro reports "server" output, builds without errors. A `.netlify/` folder appears with the SSR function bundle.

- [ ] **Step 1.5: Commit**

```bash
git add astro.config.mjs netlify.toml package.json package-lock.json
git commit -m "feat(tier1): switch to Astro SSR with @astrojs/netlify adapter"
```

---

## Task 2: Supabase migration — `analyses`, `rate_limits`, cleanup cron

**Files:**
- Create: `supabase/migrations/<timestamp>_tier1_init.sql` (committed for record)

- [ ] **Step 2.1: Apply the schema migration via MCP**

Call:

```
mcp__plugin_supabase_supabase__apply_migration
  name: "tier1_init"
  query: <SQL below>
```

SQL:

```sql
-- analyses: content-addressed cache for AI responses
create table if not exists public.analyses (
  id          uuid primary key default gen_random_uuid(),
  endpoint    text not null check (endpoint in
              ('analyze','quiz','tutor','vocab','graph','prosody','parsing')),
  text_hash   text not null,
  input       jsonb not null,
  output      jsonb not null,
  model       text not null,
  created_at  timestamptz not null default now()
);

create unique index if not exists analyses_endpoint_hash_model_key
  on public.analyses (endpoint, text_hash, model);

create index if not exists analyses_endpoint_hash_idx
  on public.analyses (endpoint, text_hash);

alter table public.analyses enable row level security;
-- No policies = service_role only.

-- rate_limits: sliding-window log per IP hash
create table if not exists public.rate_limits (
  id         bigserial primary key,
  ip_hash    text not null,
  called_at  timestamptz not null default now()
);

create index if not exists rate_limits_ip_called_idx
  on public.rate_limits (ip_hash, called_at desc);

alter table public.rate_limits enable row level security;
-- No policies = service_role only.

-- Cleanup function: prune rate_limits older than 24h
create or replace function public.prune_rate_limits()
returns void
language sql
security definer
as $$
  delete from public.rate_limits where called_at < now() - interval '24 hours';
$$;
```

- [ ] **Step 2.2: Schedule the daily cleanup**

```
mcp__plugin_supabase_supabase__apply_migration
  name: "tier1_schedule_prune"
  query: <SQL below>
```

```sql
-- Enable pg_cron if not already
create extension if not exists pg_cron with schema extensions;

-- Schedule the prune to run daily at 03:17 UTC
select cron.schedule(
  'prune-rate-limits-daily',
  '17 3 * * *',
  $$select public.prune_rate_limits()$$
);
```

If the project doesn't have `pg_cron` available (free tier sometimes doesn't), skip this step and add a TODO in §11 of the spec to revisit. Tier 1 still works; the table just grows indefinitely until manually pruned.

- [ ] **Step 2.3: Verify the schema**

```
mcp__plugin_supabase_supabase__list_tables  schemas: ["public"]
```

Expected: `analyses` and `rate_limits` both present, both with `rls_enabled: true`.

```
mcp__plugin_supabase_supabase__execute_sql
  query: "select count(*) from public.analyses; select count(*) from public.rate_limits;"
```

Expected: both return 0.

- [ ] **Step 2.4: Mirror the migration into the repo**

The MCP records migrations on the Supabase side, but we want them in version control too. Look up the timestamp the MCP assigned:

```
mcp__plugin_supabase_supabase__list_migrations
```

Take the most recent two `version` strings (something like `20260430120000`). Create:

`supabase/migrations/<version>_tier1_init.sql` — paste the SQL from Step 2.1.
`supabase/migrations/<version>_tier1_schedule_prune.sql` — paste the SQL from Step 2.2.

(If pg_cron was unavailable, only commit the first migration.)

- [ ] **Step 2.5: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(tier1): add analyses + rate_limits tables and prune cron"
```

---

## Task 3: Server primitive — Supabase admin client

**Files:**
- Create: `src/server/supabase.ts`
- Create: `src/server/supabase.test.ts`

- [ ] **Step 3.1: Write the failing test**

Create `src/server/supabase.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { supabaseAdmin } from './supabase';

describe('supabaseAdmin', () => {
  it('connects and can run a trivial query', async () => {
    const { data, error } = await supabaseAdmin.rpc('prune_rate_limits');
    // prune_rate_limits returns void; we just want no error here.
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
```

- [ ] **Step 3.2: Run test (expect failure)**

```bash
npm test -- src/server/supabase.test.ts
```

Expected: FAIL with "Cannot find module './supabase'".

- [ ] **Step 3.3: Implement `src/server/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the server env',
  );
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
```

- [ ] **Step 3.4: Run test (expect pass)**

```bash
npm test -- src/server/supabase.test.ts
```

Expected: PASS, both tests green.

- [ ] **Step 3.5: Commit**

```bash
git add src/server/supabase.ts src/server/supabase.test.ts
git commit -m "feat(tier1): server-only Supabase admin client"
```

---

## Task 4: Server primitive — request hashing

**Files:**
- Create: `src/server/ai/hash.ts`
- Create: `src/server/ai/hash.test.ts`

- [ ] **Step 4.1: Write the failing tests**

Create `src/server/ai/hash.test.ts`:

```ts
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
```

- [ ] **Step 4.2: Run tests (expect failure)**

```bash
npm test -- src/server/ai/hash.test.ts
```

Expected: FAIL with "Cannot find module './hash'".

- [ ] **Step 4.3: Implement `src/server/ai/hash.ts`**

```ts
import { createHash } from 'node:crypto';

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`)
    .join(',')}}`;
}

export function hashRequest(endpoint: string, body: unknown): string {
  return createHash('sha256')
    .update(`${endpoint}\n${canonicalize(body)}`)
    .digest('hex');
}

export function hashIp(ip: string): string {
  const secret = process.env.APP_SECRET;
  if (!secret) {
    throw new Error('APP_SECRET is not set');
  }
  return createHash('sha256').update(`${ip}\n${secret}`).digest('hex');
}
```

- [ ] **Step 4.4: Run tests (expect pass)**

```bash
npm test -- src/server/ai/hash.test.ts
```

Expected: PASS, all 10 tests green.

- [ ] **Step 4.5: Commit**

```bash
git add src/server/ai/hash.ts src/server/ai/hash.test.ts
git commit -m "feat(tier1): canonical request hashing + IP hashing"
```

---

## Task 5: Server primitive — analyses cache

**Files:**
- Create: `src/server/cache.ts`
- Create: `src/server/cache.test.ts`

Tests run against the live Supabase. They use a unique `text_hash` per test run (UUID-prefixed) so concurrent runs don't collide and so cleanup is targeted.

- [ ] **Step 5.1: Write the failing tests**

Create `src/server/cache.test.ts`:

```ts
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
```

- [ ] **Step 5.2: Run tests (expect failure)**

```bash
npm test -- src/server/cache.test.ts
```

Expected: FAIL with "Cannot find module './cache'".

- [ ] **Step 5.3: Implement `src/server/cache.ts`**

```ts
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
```

- [ ] **Step 5.4: Run tests (expect pass)**

```bash
npm test -- src/server/cache.test.ts
```

Expected: PASS, 5 tests green.

- [ ] **Step 5.5: Commit**

```bash
git add src/server/cache.ts src/server/cache.test.ts
git commit -m "feat(tier1): analyses cache (Supabase-backed)"
```

---

## Task 6: Server primitive — IP rate limiter

**Files:**
- Create: `src/server/rate-limit.ts`
- Create: `src/server/rate-limit.test.ts`

- [ ] **Step 6.1: Write the failing tests**

Create `src/server/rate-limit.test.ts`:

```ts
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
```

- [ ] **Step 6.2: Run tests (expect failure)**

```bash
npm test -- src/server/rate-limit.test.ts
```

Expected: FAIL with "Cannot find module './rate-limit'".

- [ ] **Step 6.3: Implement `src/server/rate-limit.ts`**

```ts
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
```

- [ ] **Step 6.4: Run tests (expect pass)**

```bash
npm test -- src/server/rate-limit.test.ts
```

Expected: PASS, 4 tests green. The 15-call test takes ~2s; the 4h-window test takes ~500ms.

- [ ] **Step 6.5: Commit**

```bash
git add src/server/rate-limit.ts src/server/rate-limit.test.ts
git commit -m "feat(tier1): IP-hashed sliding-window rate limiter (15/3h)"
```

---

## Task 7: Refactor `src/server/ai/gemini.ts` to single MODEL constant

**Files:**
- Modify: `src/server/ai/gemini.ts`
- Create: `src/server/ai/gemini.test.ts`

The current `gemini.ts` exposes `getGeminiModel(...)` with per-call options. We collapse this to a single `MODEL` constant and a `callGemini(prompt)` function — every endpoint uses the same temperature for now (a pedagogically conservative 0.2 — current routes use 0.15–0.3, this is the median).

- [ ] **Step 7.1: Write the failing test**

Create `src/server/ai/gemini.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { MODEL } from './gemini';

describe('MODEL', () => {
  it('is the verified Tier 1 model identifier', () => {
    expect(MODEL).toBe('<MODEL_ID>'); // substitute the verified ID from Task 0.2
  });
});
```

Replace `<MODEL_ID>` literally with the string verified in Task 0.2.

- [ ] **Step 7.2: Run test (expect failure)**

```bash
npm test -- src/server/ai/gemini.test.ts
```

Expected: FAIL — current `gemini.ts` exports no `MODEL` constant.

- [ ] **Step 7.3: Replace `src/server/ai/gemini.ts`**

Overwrite the file with:

```ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractJsonFromText } from './json';

export const MODEL = '<MODEL_ID>'; // substitute verified ID from Task 0.2

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY (server env)');
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: MODEL,
  generationConfig: {
    temperature: 0.2,
    maxOutputTokens: 4096,
  },
});

/**
 * Calls Gemini with the given prompt and returns the parsed JSON output.
 * Uses the existing extractJsonFromText helper to tolerate code-fenced or
 * prose-wrapped JSON.
 */
export async function callGemini(prompt: string): Promise<unknown> {
  const res = await model.generateContent(prompt);
  const raw = res.response.text();
  const json = extractJsonFromText(raw);
  return JSON.parse(json);
}
```

- [ ] **Step 7.4: Run test (expect pass)**

```bash
npm test -- src/server/ai/gemini.test.ts
```

Expected: PASS.

- [ ] **Step 7.5: Commit**

```bash
git add src/server/ai/gemini.ts src/server/ai/gemini.test.ts
git commit -m "feat(tier1): single MODEL constant + callGemini helper"
```

---

## Task 8: Handler factory — `createAiHandler`

**Files:**
- Create: `src/server/ai/handler.ts`
- Create: `src/server/ai/handler.test.ts`

Tests use `vi.mock` on the cache, rate-limit, and gemini modules so this test is fast and deterministic. Real-DB integration is covered by Tasks 5/6.

- [ ] **Step 8.1: Write the failing tests**

Create `src/server/ai/handler.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

vi.mock('../cache', () => ({
  getCached: vi.fn(),
  putCached: vi.fn(),
}));
vi.mock('../rate-limit', () => ({
  checkAndRecord: vi.fn(),
}));
vi.mock('./gemini', () => ({
  MODEL: 'test-model',
  callGemini: vi.fn(),
}));

import { getCached, putCached } from '../cache';
import { checkAndRecord } from '../rate-limit';
import { callGemini } from './gemini';
import { createAiHandler } from './handler';

const bodySchema = z.object({ text: z.string().min(1) });
const outputSchema = z.object({ greeting: z.string() });

const handler = createAiHandler({
  endpoint: 'analyze',
  bodySchema,
  outputSchema,
  buildPrompt: ({ text }) => `Hello ${text}`,
});

function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/ai/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.mocked(getCached).mockReset();
  vi.mocked(putCached).mockReset();
  vi.mocked(checkAndRecord).mockReset();
  vi.mocked(callGemini).mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('createAiHandler', () => {
  it('returns 400 invalid_input on bad JSON', async () => {
    const req = new Request('http://localhost/api/ai/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not-json',
    });
    const res = await handler({ request: req } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('invalid_input');
  });

  it('returns 400 invalid_input on schema failure', async () => {
    const res = await handler({ request: jsonRequest({ text: '' }) } as any);
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('invalid_input');
  });

  it('returns cached response on hit, no rate-limit increment', async () => {
    vi.mocked(getCached).mockResolvedValue({ greeting: 'cached' });
    const res = await handler({ request: jsonRequest({ text: 'world' }) } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(res.headers.get('X-Content-Hash')).toMatch(/^[a-f0-9]{64}$/);
    expect(await res.json()).toEqual({ greeting: 'cached' });
    expect(checkAndRecord).not.toHaveBeenCalled();
    expect(callGemini).not.toHaveBeenCalled();
  });

  it('returns 429 rate_limited when limiter says no', async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(checkAndRecord).mockResolvedValue({
      ok: false,
      retryAfter: 1234,
      resetAt: Date.now() + 1234_000,
    });
    const res = await handler({
      request: jsonRequest({ text: 'world' }, { 'x-forwarded-for': '1.2.3.4' }),
    } as any);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('1234');
    expect(res.headers.get('X-RateLimit-Limit')).toBe('15');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    const body = await res.json();
    expect(body.code).toBe('rate_limited');
    expect(callGemini).not.toHaveBeenCalled();
  });

  it('miss path: rate-limits, calls model, caches, returns', async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(checkAndRecord).mockResolvedValue({
      ok: true,
      remaining: 14,
      resetAt: 1_700_000_000_000,
    });
    vi.mocked(callGemini).mockResolvedValue({ greeting: 'hello world' });

    const res = await handler({
      request: jsonRequest({ text: 'world' }, { 'x-forwarded-for': '1.2.3.4' }),
    } as any);

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('MISS');
    expect(res.headers.get('X-Content-Hash')).toMatch(/^[a-f0-9]{64}$/);
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('14');
    expect(await res.json()).toEqual({ greeting: 'hello world' });
    expect(callGemini).toHaveBeenCalledOnce();
    expect(callGemini).toHaveBeenCalledWith('Hello world');
    expect(putCached).toHaveBeenCalledOnce();
  });

  it('returns 502 model_error when Gemini throws', async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(checkAndRecord).mockResolvedValue({
      ok: true,
      remaining: 14,
      resetAt: Date.now() + 1000,
    });
    vi.mocked(callGemini).mockRejectedValue(new Error('upstream 500'));
    const res = await handler({ request: jsonRequest({ text: 'world' }) } as any);
    expect(res.status).toBe(502);
    expect((await res.json()).code).toBe('model_error');
    expect(putCached).not.toHaveBeenCalled();
  });

  it('returns 502 model_error when Gemini output fails schema', async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(checkAndRecord).mockResolvedValue({
      ok: true,
      remaining: 14,
      resetAt: Date.now() + 1000,
    });
    vi.mocked(callGemini).mockResolvedValue({ unexpected: true });
    const res = await handler({ request: jsonRequest({ text: 'world' }) } as any);
    expect(res.status).toBe(502);
    expect((await res.json()).code).toBe('model_error');
    expect(putCached).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 8.2: Run tests (expect failure)**

```bash
npm test -- src/server/ai/handler.test.ts
```

Expected: FAIL with "Cannot find module './handler'".

- [ ] **Step 8.3: Implement `src/server/ai/handler.ts`**

```ts
import type { APIRoute } from 'astro';
import type { ZodSchema } from 'zod';
import { getCached, putCached, type Endpoint } from '../cache';
import { checkAndRecord } from '../rate-limit';
import { callGemini, MODEL } from './gemini';
import { hashIp, hashRequest } from './hash';

interface HandlerOpts<TBody, TOut> {
  endpoint: Endpoint;
  bodySchema: ZodSchema<TBody>;
  outputSchema: ZodSchema<TOut>;
  buildPrompt: (body: TBody) => string;
}

const RATE_LIMIT = 15;

function extractIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-nf-client-connection-ip') ?? '0.0.0.0';
}

function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

export function createAiHandler<TBody, TOut>(
  opts: HandlerOpts<TBody, TOut>,
): APIRoute {
  return async ({ request }) => {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return jsonResponse(400, {
        error: 'Invalid JSON in request body',
        code: 'invalid_input',
      });
    }

    const parsedBody = opts.bodySchema.safeParse(raw);
    if (!parsedBody.success) {
      return jsonResponse(400, {
        error: parsedBody.error.message,
        code: 'invalid_input',
      });
    }

    const hash = hashRequest(opts.endpoint, parsedBody.data);

    const cached = await getCached(opts.endpoint, hash, MODEL);
    if (cached !== null) {
      return jsonResponse(200, cached, {
        'X-Cache': 'HIT',
        'X-Content-Hash': hash,
      });
    }

    const rl = await checkAndRecord(hashIp(extractIp(request)));
    if (!rl.ok) {
      return jsonResponse(
        429,
        {
          error: 'Rate limit exceeded',
          code: 'rate_limited',
          retryAfter: rl.retryAfter,
        },
        {
          'Retry-After': String(rl.retryAfter),
          'X-RateLimit-Limit': String(RATE_LIMIT),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(rl.resetAt / 1000)),
        },
      );
    }

    let modelOutput: unknown;
    try {
      modelOutput = await callGemini(opts.buildPrompt(parsedBody.data));
    } catch (err) {
      console.error('[ai] gemini call failed', { endpoint: opts.endpoint, hash, err });
      return jsonResponse(502, {
        error: 'The model could not be reached. Please retry.',
        code: 'model_error',
      });
    }

    const parsedOutput = opts.outputSchema.safeParse(modelOutput);
    if (!parsedOutput.success) {
      console.error('[ai] gemini output failed validation', {
        endpoint: opts.endpoint,
        hash,
        issues: parsedOutput.error.issues,
      });
      return jsonResponse(502, {
        error: 'The model returned an unexpected response. Please retry.',
        code: 'model_error',
      });
    }

    await putCached(
      opts.endpoint,
      hash,
      MODEL,
      parsedBody.data,
      parsedOutput.data,
    );

    return jsonResponse(200, parsedOutput.data, {
      'X-Cache': 'MISS',
      'X-Content-Hash': hash,
      'X-RateLimit-Limit': String(RATE_LIMIT),
      'X-RateLimit-Remaining': String(rl.remaining),
      'X-RateLimit-Reset': String(Math.floor(rl.resetAt / 1000)),
    });
  };
}
```

- [ ] **Step 8.4: Run tests (expect pass)**

```bash
npm test -- src/server/ai/handler.test.ts
```

Expected: PASS, 7 tests green.

- [ ] **Step 8.5: Commit**

```bash
git add src/server/ai/handler.ts src/server/ai/handler.test.ts
git commit -m "feat(tier1): createAiHandler factory with cache + rate limit"
```

---

## Task 9: Migrate `analyze` route

**Files:**
- Modify: `src/pages/api/ai/analyze.ts`
- Create: `src/server/ai/schemas.ts`

The seven endpoints share a schemas file so they're all in one place.

- [ ] **Step 9.1: Create `src/server/ai/schemas.ts`**

```ts
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
```

- [ ] **Step 9.2: Replace `src/pages/api/ai/analyze.ts`**

```ts
import { createAiHandler } from '../../../server/ai/handler';
import { analysisPrompt } from '../../../server/ai/prompts';
import {
  analyzeBodySchema,
  analyzeOutputSchema,
} from '../../../server/ai/schemas';

export const POST = createAiHandler({
  endpoint: 'analyze',
  bodySchema: analyzeBodySchema,
  outputSchema: analyzeOutputSchema,
  buildPrompt: ({ text }) => analysisPrompt(text),
});
```

- [ ] **Step 9.3: Verify the build passes**

```bash
npm run build
```

Expected: Astro build succeeds, no type errors.

- [ ] **Step 9.4: Commit**

```bash
git add src/server/ai/schemas.ts src/pages/api/ai/analyze.ts
git commit -m "feat(tier1): migrate /api/ai/analyze to createAiHandler"
```

---

## Task 10: Migrate `quiz`, `tutor`, `vocab` routes

**Files:**
- Modify: `src/pages/api/ai/quiz.ts`
- Modify: `src/pages/api/ai/tutor.ts`
- Modify: `src/pages/api/ai/vocab.ts`

- [ ] **Step 10.1: Replace `src/pages/api/ai/quiz.ts`**

```ts
import { createAiHandler } from '../../../server/ai/handler';
import { quizPrompt } from '../../../server/ai/prompts';
import { quizBodySchema, quizOutputSchema } from '../../../server/ai/schemas';

export const POST = createAiHandler({
  endpoint: 'quiz',
  bodySchema: quizBodySchema,
  outputSchema: quizOutputSchema,
  buildPrompt: ({ sentence }) => quizPrompt(sentence),
});
```

- [ ] **Step 10.2: Replace `src/pages/api/ai/tutor.ts`**

```ts
import { createAiHandler } from '../../../server/ai/handler';
import { tutorPrompt } from '../../../server/ai/prompts';
import {
  tutorBodySchema,
  tutorOutputSchema,
} from '../../../server/ai/schemas';

export const POST = createAiHandler({
  endpoint: 'tutor',
  bodySchema: tutorBodySchema,
  outputSchema: tutorOutputSchema,
  buildPrompt: ({ sentence, level }) => tutorPrompt({ sentence, level }),
});
```

- [ ] **Step 10.3: Replace `src/pages/api/ai/vocab.ts`**

```ts
import { createAiHandler } from '../../../server/ai/handler';
import { vocabPrompt } from '../../../server/ai/prompts';
import {
  vocabBodySchema,
  vocabOutputSchema,
} from '../../../server/ai/schemas';

export const POST = createAiHandler({
  endpoint: 'vocab',
  bodySchema: vocabBodySchema,
  outputSchema: vocabOutputSchema,
  buildPrompt: ({ text }) => vocabPrompt(text),
});
```

- [ ] **Step 10.4: Verify the build passes**

```bash
npm run build
```

Expected: success.

- [ ] **Step 10.5: Commit**

```bash
git add src/pages/api/ai/quiz.ts src/pages/api/ai/tutor.ts src/pages/api/ai/vocab.ts
git commit -m "feat(tier1): migrate quiz/tutor/vocab routes to createAiHandler"
```

---

## Task 11: Migrate `graph`, `prosody`, `parsing` routes

**Files:**
- Modify: `src/pages/api/ai/graph.ts`
- Modify: `src/pages/api/ai/prosody.ts`
- Modify: `src/pages/api/ai/parsing.ts`

- [ ] **Step 11.1: Replace `src/pages/api/ai/graph.ts`**

```ts
import { createAiHandler } from '../../../server/ai/handler';
import { graphPrompt } from '../../../server/ai/prompts';
import {
  graphBodySchema,
  graphOutputSchema,
} from '../../../server/ai/schemas';

export const POST = createAiHandler({
  endpoint: 'graph',
  bodySchema: graphBodySchema,
  outputSchema: graphOutputSchema,
  buildPrompt: ({ text }) => graphPrompt(text),
});
```

- [ ] **Step 11.2: Replace `src/pages/api/ai/prosody.ts`**

```ts
import { createAiHandler } from '../../../server/ai/handler';
import { prosodyPrompt } from '../../../server/ai/prompts';
import {
  prosodyBodySchema,
  prosodyOutputSchema,
} from '../../../server/ai/schemas';

export const POST = createAiHandler({
  endpoint: 'prosody',
  bodySchema: prosodyBodySchema,
  outputSchema: prosodyOutputSchema,
  buildPrompt: ({ text }) => prosodyPrompt(text),
});
```

- [ ] **Step 11.3: Replace `src/pages/api/ai/parsing.ts`**

```ts
import { createAiHandler } from '../../../server/ai/handler';
import { parsingPrompt } from '../../../server/ai/prompts';
import {
  parsingBodySchema,
  parsingOutputSchema,
} from '../../../server/ai/schemas';

export const POST = createAiHandler({
  endpoint: 'parsing',
  bodySchema: parsingBodySchema,
  outputSchema: parsingOutputSchema,
  buildPrompt: ({ text }) => parsingPrompt(text),
});
```

- [ ] **Step 11.4: Verify the build passes**

```bash
npm run build
```

Expected: success.

- [ ] **Step 11.5: Commit**

```bash
git add src/pages/api/ai/graph.ts src/pages/api/ai/prosody.ts src/pages/api/ai/parsing.ts
git commit -m "feat(tier1): migrate graph/prosody/parsing routes to createAiHandler"
```

---

## Task 12: Update `apiClient.ts` for unified envelope + headers

**Files:**
- Modify: `src/utils/apiClient.ts`

- [ ] **Step 12.1: Replace `src/utils/apiClient.ts`**

```ts
import type { AnalysisResult } from '../types/AnalysisResult';

export type ApiErrorCode =
  | 'invalid_input'
  | 'rate_limited'
  | 'model_error'
  | 'server_error';

export interface ApiErrorBody {
  error: string;
  code: ApiErrorCode;
  retryAfter?: number;
}

export interface RateLimitState {
  limit: number;
  remaining: number;
  resetAt: number; // ms epoch
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: ApiErrorCode,
    public readonly status: number,
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface AiResponse<T> {
  data: T;
  hash: string;
  cache: 'HIT' | 'MISS';
  rateLimit: RateLimitState | null;
}

function readRateLimit(headers: Headers): RateLimitState | null {
  const limit = headers.get('X-RateLimit-Limit');
  const remaining = headers.get('X-RateLimit-Remaining');
  const reset = headers.get('X-RateLimit-Reset');
  if (limit === null || remaining === null || reset === null) return null;
  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    resetAt: parseInt(reset, 10) * 1000,
  };
}

async function postJson<T>(path: string, body: unknown): Promise<AiResponse<T>> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let parsed: ApiErrorBody | null = null;
    try {
      parsed = (await res.json()) as ApiErrorBody;
    } catch {
      /* ignore */
    }
    throw new ApiError(
      parsed?.error ?? `Request failed (${res.status})`,
      parsed?.code ?? 'server_error',
      res.status,
      parsed?.retryAfter,
    );
  }

  const data = (await res.json()) as T;
  const hash = res.headers.get('X-Content-Hash') ?? '';
  const cache = (res.headers.get('X-Cache') as 'HIT' | 'MISS') ?? 'MISS';
  return { data, hash, cache, rateLimit: readRateLimit(res.headers) };
}

export async function apiAnalyzeLatin(
  text: string,
): Promise<AiResponse<AnalysisResult>> {
  return postJson<AnalysisResult>('/api/ai/analyze', { text });
}

export async function apiQuiz(sentence: string): Promise<
  AiResponse<{
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>;
  }>
> {
  return postJson('/api/ai/quiz', { sentence });
}

export async function apiTutor(
  sentence: string,
  level: 'basic' | 'detailed' = 'basic',
): Promise<
  AiResponse<{
    steps: Array<{
      title: string;
      question: string;
      hint?: string;
      expectedAnswer?: string;
      explanation?: string;
    }>;
    translation?: string;
    sentence?: string;
  }>
> {
  return postJson('/api/ai/tutor', { sentence, level });
}

export async function apiVocab(text: string): Promise<
  AiResponse<{
    cards: Array<{
      word: string;
      lemma: string;
      partOfSpeech: string;
      meaning: string;
      etymology?: string;
      relatedWords: string[];
      usageExamples: string[];
      mnemonicDevice?: string;
      frequency: 'common' | 'uncommon' | 'rare';
    }>;
  }>
> {
  return postJson('/api/ai/vocab', { text });
}

export async function apiGraph(text: string): Promise<
  AiResponse<{
    nodes: Array<{ id: string; label: string; type: string }>;
    edges: Array<{ source: string; target: string; label: string }>;
  }>
> {
  return postJson('/api/ai/graph', { text });
}

export async function apiProsody(text: string): Promise<
  AiResponse<{
    scansion: Array<{
      word: string;
      syllables: Array<{
        syllable: string;
        length: 'long' | 'short' | 'anceps';
        stress: boolean;
      }>;
    }>;
    meter: string;
    analysis: string;
  }>
> {
  return postJson('/api/ai/prosody', { text });
}

export async function apiParsing(text: string): Promise<
  AiResponse<{
    exercises: Array<{
      type: 'identify-function' | 'transform-sentence';
      instruction: string;
      sentence: string;
      correctOrder?: string[];
      elements?: Array<{
        word: string;
        function: string;
        explanation: string;
      }>;
      transformation?: { from: string; to: string; explanation: string };
      difficulty: 'easy' | 'medium' | 'hard';
      hint?: string;
    }>;
  }>
> {
  return postJson('/api/ai/parsing', { text });
}
```

- [ ] **Step 12.2: Update `src/store/appStore.ts` to consume the new wrapped response**

The store currently treats the API helpers as returning the raw data. Now they return `AiResponse<T>` with `.data`, `.hash`, `.cache`, `.rateLimit`. Update each call site. Add new state fields: `lastAnalysisHash: string | null` and `rateLimit: RateLimitState | null`.

In `src/store/appStore.ts`, add to imports:

```ts
import type { ApiError, RateLimitState } from '../utils/apiClient';
```

Change the `AppState` interface — add:

```ts
  lastAnalysisHash: string | null;
  rateLimit: RateLimitState | null;
```

Initial state — add:

```ts
  lastAnalysisHash: null,
  rateLimit: null,
```

Replace `analyzeText`:

```ts
  analyzeText: async (text: string) => {
    set({
      analysisState: 'analyzing',
      error: null,
      analysisResult: null,
      hoveredWordIndex: null,
      inspectedWordIndex: null,
      currentText: text,
      lastAnalysisHash: null,
    });

    try {
      const res = await apiAnalyzeLatin(text);
      set({
        analysisResult: res.data,
        analysisState: 'success',
        rateLimitError: false,
        lastAnalysisHash: res.hash,
        rateLimit: res.rateLimit,
      });
    } catch (e) {
      const isRateLimit =
        e instanceof Error && (e as any).code === 'rate_limited';
      set({
        error: e instanceof Error ? e.message : 'An unknown error occurred.',
        analysisState: 'error',
        rateLimitError: !!isRateLimit,
      });
    }
  },
```

For each of `generateQuiz`, `generateTutoring`, `generateGraph`, `generateProsody`, `generateVocabulary`, `generateParsingExercises`: change the line that assigns the result so it pulls `.data` from the response and updates `rateLimit`:

```ts
      const res = await apiQuiz(currentText);
      set({ quizData: res.data, quizState: 'loaded', rateLimit: res.rateLimit });
```

(and the analogous changes for the other five generators).

- [ ] **Step 12.3: Verify the build**

```bash
npm run build
```

Expected: success. If type errors surface in components consuming `quizData` etc., they were already pulling from `.data`-shaped state, so updates here should be sufficient. Fix any complaint with the same `.data` extraction pattern.

- [ ] **Step 12.4: Commit**

```bash
git add src/utils/apiClient.ts src/store/appStore.ts
git commit -m "feat(tier1): unified API envelope with rate-limit + cache headers"
```

---

## Task 13: Update `InputCard.tsx` to read rate limit from server headers

**Files:**
- Modify: `src/components/app/InputCard.tsx`

- [ ] **Step 13.1: Read the current `src/components/app/InputCard.tsx`**

```bash
cat src/components/app/InputCard.tsx | head -80
```

(For context — already read in earlier work.)

- [ ] **Step 13.2: Patch `InputCard.tsx`**

Make these specific edits:

1. Remove the import of `getRateLimitStatus`:

   - Delete: `import { getRateLimitStatus } from "../../utils/rateLimiter";`

2. Replace the `rateLimitInfo` local state and effect:

   - Delete:
     ```ts
     const [rateLimitInfo, setRateLimitInfo] = useState(getRateLimitStatus());
     // Update rate limit status periodically
     useEffect(() => {
       const interval = setInterval(() => {
         setRateLimitInfo(getRateLimitStatus());
       }, 1000); // Update every second
       return () => clearInterval(interval);
     }, []);
     ```

   - Replace with:
     ```ts
     const rateLimit = useAppStore((s) => s.rateLimit);
     const rateLimitInfo = (() => {
       if (!rateLimit) {
         return {
           remaining: 15,
           isLimited: false,
           timeUntilReset: '—',
           percentage: 100,
         };
       }
       const msLeft = Math.max(0, rateLimit.resetAt - Date.now());
       const minutes = Math.ceil(msLeft / 60_000);
       return {
         remaining: rateLimit.remaining,
         isLimited: rateLimit.remaining <= 0,
         timeUntilReset:
           minutes > 60
             ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
             : `${minutes}m`,
         percentage: Math.round((rateLimit.remaining / rateLimit.limit) * 100),
       };
     })();
     ```

3. Remove the now-unused `useEffect` import if nothing else uses it; otherwise leave it.

- [ ] **Step 13.3: Verify the build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 13.4: Commit**

```bash
git add src/components/app/InputCard.tsx
git commit -m "feat(tier1): drive rate-limit UI from server response headers"
```

---

## Task 14: Add Share button to the workspace

**Files:**
- Modify: `src/components/app/Workspace.tsx`

- [ ] **Step 14.1: Add Share button + hash usage**

In `src/components/app/Workspace.tsx`, locate the destructure of `useAppStore` near the top of the component (lines 17–24 in the current file). Update it to include `lastAnalysisHash`:

```ts
const {
  analysisState,
  error,
  reset,
  loadStoredData,
  currentText,
  analyzeText,
  lastAnalysisHash,
} = useAppStore();
```

Below the existing View Toggle block (around line 96 in current file, just before `<AnimatePresence>`), add this new block:

```tsx
{showAnalysis && analysisState === 'success' && lastAnalysisHash && (
  <div className="flex items-center justify-center">
    <button
      onClick={() => {
        const url = `${window.location.origin}/a/${lastAnalysisHash}`;
        void navigator.clipboard.writeText(url);
      }}
      className="px-5 py-2.5 text-sm font-medium rounded-lg glass-button text-white"
      title="Copy a shareable link to this analysis"
    >
      Copy share link
    </button>
  </div>
)}
```

- [ ] **Step 14.2: Verify the build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 14.3: Commit**

```bash
git add src/components/app/Workspace.tsx
git commit -m "feat(tier1): copy-share-link button after successful analysis"
```

---

## Task 15: Share URL page `/a/[hash]`

**Files:**
- Create: `src/pages/a/[hash].astro`
- Modify: `src/components/app/Workspace.tsx` (accept seeded analysis)

- [ ] **Step 15.1: Add seeding props to `Workspace.tsx`**

Open `src/components/app/Workspace.tsx`. Change the component signature to accept optional props:

```tsx
interface WorkspaceProps {
  seedAnalysis?: unknown;
  seedHash?: string;
  seedText?: string;
}

const Workspace = ({ seedAnalysis, seedHash, seedText }: WorkspaceProps = {}) => {
```

Inside the body, just after the existing two `useEffect`s (for `loadStoredData` and `autoAnalyze`), add:

```tsx
useEffect(() => {
  if (!seedAnalysis || !seedHash || !seedText) return;
  // Seed the store directly without re-calling the API.
  useAppStore.setState({
    analysisResult: seedAnalysis as any,
    analysisState: 'success',
    currentText: seedText,
    lastAnalysisHash: seedHash,
    error: null,
    rateLimitError: false,
  });
}, [seedAnalysis, seedHash, seedText]);
```

- [ ] **Step 15.2: Create `src/pages/a/[hash].astro`**

```astro
---
import { getCached } from '../../server/cache';
import { MODEL } from '../../server/ai/gemini';
import TopBar from '../../components/app/TopBar.tsx';
import Workspace from '../../components/app/Workspace.tsx';
import MainLayout from '../../layouts/MainLayout.astro';

const { hash } = Astro.params;

let seedAnalysis: unknown = null;
let seedText = '';

if (hash && /^[a-f0-9]{64}$/.test(hash)) {
  const cached = (await getCached('analyze', hash, MODEL)) as
    | { words?: unknown[]; sentences?: { original?: string; text?: string }[] }
    | null;
  seedAnalysis = cached;
  if (cached?.sentences?.length) {
    seedText = cached.sentences
      .map((s) => s.original ?? s.text ?? '')
      .filter(Boolean)
      .join(' ');
  }
}

if (!seedAnalysis) {
  return Astro.redirect(`/app?notFound=${hash ?? ''}`);
}
---

<MainLayout
  title="Latinium.ai – Shared Analysis"
  description="A shared Latin analysis on Latinium."
>
  <div
    class="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
    style={{ color: 'var(--fg)' }}
  >
    <TopBar client:load />
    <main class="flex-1 pt-16">
      <Workspace
        client:load
        seedAnalysis={seedAnalysis}
        seedHash={hash}
        seedText={seedText}
      />
    </main>
  </div>
</MainLayout>
```

- [ ] **Step 15.3: Verify the build**

```bash
npm run build
```

Expected: success. Note: the route generates a Netlify Function because of SSR.

- [ ] **Step 15.4: Commit**

```bash
git add src/pages/a/ src/components/app/Workspace.tsx
git commit -m "feat(tier1): /a/<hash> share URLs with SSR-seeded workspace"
```

---

## Task 16: Delete dead code

**Files:**
- Delete: `src/pages/api/analyze.ts`
- Delete: `src/utils/directGeminiApi.ts`
- Delete: `src/utils/geminiApi.ts`
- Delete: `src/utils/netlifyEnv.ts`
- Delete: `src/utils/cache.ts`
- Delete: `src/utils/rateLimiter.ts`
- Delete: `src/pages/direct-api-demo.astro`
- Delete: `test-client.html`
- Delete: `progress.md`
- Delete: `DIRECT_API_APPROACH.md`
- Delete: `src/server/ai/errors.ts` (orphaned after route migration — handler.ts emits its own envelope)
- Modify: `src/server/ai/json.ts` (drop unused `parseModelJson`)

- [ ] **Step 16.1: Verify nothing else imports the doomed files**

```bash
git grep -nE "from ['\"](\.\./)+utils/(directGeminiApi|geminiApi|netlifyEnv|cache|rateLimiter)['\"]"
git grep -nE "/api/analyze['\"]"
git grep -nE "direct-api-demo"
git grep -nE "from ['\"](\.\./)+server/ai/errors['\"]"
git grep -nE "\bjsonError\b"
git grep -nE "\bparseModelJson\b"
```

Expected: each command returns either no results, or only results from inside files that are themselves about to be deleted. If a *live* file (e.g., a component) still imports any of these, this is the moment to update it; in practice the imports were already replaced in earlier tasks (`apiClient.ts` replacing `directGeminiApi.ts`, store no longer using `cache.ts`, `InputCard.tsx` no longer using `rateLimiter.ts`, route files no longer using `jsonError`/`parseModelJson`).

- [ ] **Step 16.2: Slim down `src/server/ai/json.ts` to just `extractJsonFromText`**

Replace the file with:

```ts
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
```

- [ ] **Step 16.3: Delete the dead files**

```bash
rm src/pages/api/analyze.ts
rm src/utils/directGeminiApi.ts
rm src/utils/geminiApi.ts
rm src/utils/netlifyEnv.ts
rm src/utils/cache.ts
rm src/utils/rateLimiter.ts
rm src/pages/direct-api-demo.astro
rm test-client.html
rm progress.md
rm DIRECT_API_APPROACH.md
rm src/server/ai/errors.ts
```

- [ ] **Step 16.4: Verify the build still passes**

```bash
npm run build
```

Expected: success.

- [ ] **Step 16.5: Verify tests still pass**

```bash
npm test
```

Expected: all tests green.

- [ ] **Step 16.6: Commit**

```bash
git add -A
git commit -m "chore(tier1): delete legacy routes, client gemini path, orphaned helpers, stale docs"
```

---

## Task 17: Smoke test on Netlify deploy preview

**Files:** none (deployment + manual verification)

- [ ] **Step 17.1: Push the branch**

```bash
git push -u origin tier-1-infra-ai-backbone
```

This triggers a Netlify deploy preview. Wait for the build to finish in the Netlify dashboard.

- [ ] **Step 17.2: Verify env vars in the preview**

In the Netlify dashboard, confirm the deploy preview has these env vars set: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `APP_SECRET`. If any are missing, add them and trigger a redeploy.

- [ ] **Step 17.3: Smoke test 1 — fresh analyze**

```bash
PREVIEW_URL=<from Netlify>
curl -i -X POST "$PREVIEW_URL/api/ai/analyze" \
  -H 'content-type: application/json' \
  -d '{"text":"Gallia est omnis divisa in partes tres."}'
```

Expected: HTTP 200, `X-Cache: MISS`, `X-Content-Hash: <64-hex>`, `X-RateLimit-Remaining: 14`, JSON body has `words` array.

- [ ] **Step 17.4: Smoke test 2 — cache hit**

Repeat the same curl command.

Expected: HTTP 200, `X-Cache: HIT`, `X-RateLimit-Remaining` unchanged from previous response (because hits don't burn budget — verify by running a third request and confirming remaining still didn't decrement on hit, then decrements on a fresh miss).

- [ ] **Step 17.5: Smoke test 3 — share URL**

In a fresh browser (incognito), visit:

```
$PREVIEW_URL/a/<hash-from-X-Content-Hash>
```

Expected: workspace renders pre-populated with the analysis. No analyze API call is fired (Network tab confirms).

- [ ] **Step 17.6: Smoke test 4 — rate limit**

Run a script that hits 16 unique analyzes in a row from one IP:

```bash
for i in $(seq 1 16); do
  echo "--- request $i ---"
  curl -s -o /dev/null -w "%{http_code} remaining=%header{X-RateLimit-Remaining}\n" \
    -X POST "$PREVIEW_URL/api/ai/analyze" \
    -H 'content-type: application/json' \
    -d "{\"text\":\"smoke test $i $(date +%s%N)\"}"
done
```

Expected: requests 1–15 return 200, request 16 returns 429 with `Retry-After` populated.

- [ ] **Step 17.7: Smoke test 5 — invalid input**

```bash
curl -i -X POST "$PREVIEW_URL/api/ai/analyze" \
  -H 'content-type: application/json' \
  -d '{}'
```

Expected: HTTP 400, JSON body `{"error":"...","code":"invalid_input"}`.

- [ ] **Step 17.8: Smoke test 6 — main app flow**

Open `$PREVIEW_URL/app` in a browser. Paste a Latin sentence, click Analyze, verify:
- Loading spinner shows
- Result renders
- Rate-limit indicator shows "14 requests left"
- Click "Copy share link" → URL is on clipboard, opens correctly in incognito

- [ ] **Step 17.9: Open PR / merge**

If all smoke tests pass:

```bash
gh pr create --base main --title "Tier 1: Infra + AI backbone + cache" \
  --body "$(cat <<'EOF'
## Summary
- Astro SSR on Netlify; Gemini key fully server-side.
- Single AI route path with shared `createAiHandler` (caching + IP rate limiting).
- Supabase Postgres for `analyses` cache and `rate_limits` log.
- Shareable analysis URLs at `/a/<hash>`.
- Model swapped to the verified Tier 1 ID.
- Removed the legacy /api/analyze route, client-side Gemini path, and stale docs.

## Test plan
- [x] vitest unit + integration suite (`npm test`)
- [x] Smoke tests on Netlify deploy preview (fresh analyze, cache hit, share URL, 16-call rate-limit, invalid input, end-to-end UI flow)
EOF
)"
```

If any smoke test fails: don't merge. Investigate, fix, repeat the smoke tests.

---

## Self-review checklist

This is implemented during plan execution as the final task — but listed here so executor knows the criteria:

- [ ] All seven AI routes return cache headers (`X-Cache`, `X-Content-Hash`).
- [ ] All seven routes return rate-limit headers on miss.
- [ ] No reference to `gemini-2.5-flash` remains: `git grep gemini-2.5-flash` returns 0 results.
- [ ] No reference to `getGeminiModel` remains: `git grep getGeminiModel` returns 0 results.
- [ ] No reference to `parseModelJson` remains: `git grep parseModelJson` returns 0 results.
- [ ] No reference to `jsonError` remains: `git grep jsonError` returns 0 results.
- [ ] No `PUBLIC_GEMINI_API_KEY` references: `git grep PUBLIC_GEMINI_API_KEY` returns 0 results.
- [ ] `npm run build` succeeds.
- [ ] `npm test` shows all suites passing.
- [ ] Smoke test §17 fully green.
