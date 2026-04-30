# Tier 1 — Infra + AI Backbone + Cache

**Date:** 2026-04-30
**Scope:** Foundation for the Latinium refactor. After Tier 1 ships, the app runs on Astro SSR (Netlify), all AI calls go through a single server-side path with IP-based rate limiting and content-addressed caching in Supabase, and analyses are shareable via permalink. User-data tables, the UI cleanup, and the landing-page polish are explicitly **out of scope** and live in Tiers 2/3/4.
**Host:** Netlify (existing domain, existing build pipeline — no migration).

---

## 1. Goals & non-goals

### Goals
1. Move the app from `output: 'static'` to `output: 'server'` using `@astrojs/netlify`, so all AI calls run server-side and the Gemini key is never shipped to the browser.
2. Consolidate to a single AI route path (`src/pages/api/ai/*`) with shared middleware for hashing, caching, rate limiting, validation, and error shape.
3. Stand up a Supabase Postgres project with two tables (`analyses`, `rate_limits`) used only by the server.
4. Enforce **15 AI calls per IP per 3-hour sliding window**, with cache hits not counted.
5. Ship shareable analysis URLs at `/a/<text-hash>` that work without sign-in and prefer cached responses for any subsequent learning artifacts (quiz, tutor, vocab, prosody, graph, parsing) on the same text.
6. Switch the model to `gemini-3.1-flash-lite-preview` (subject to verification — see §8).
7. Delete duplicated and dead code paths so the architecture is one-of-a-kind.

### Non-goals (Tier 1)
- User accounts, anonymous Supabase auth, profile/vocab/text/study tables, RLS for user data — Tier 2.
- Picking one analysis view, breaking up `StructuredTextView.tsx`, fixing the read→quiz→vocab loop — Tier 3.
- Landing-page aesthetic polish, dependency pruning beyond what's required to remove dead code — Tier 4.
- Migrating existing browser `localStorage` data into Supabase — Tier 2 (and likely a no-op since the app has no real user base yet).

---

## 2. Decisions log

| Decision | Choice | Reason |
|---|---|---|
| Anonymous-first vs sign-in-required | **Anonymous-first** | Shareable analyses only shine if a recipient can use the tool without signing up. |
| Anonymous persistence | **Supabase anonymous auth** (Tier 2) | Single RLS model, server-side persistence, account upgrade is a one-call op. |
| Rate limit bucket | **15/IP/3hr across all AI endpoints, cache hits excluded** | Matches the cost shape (every Gemini call costs the same); cached responses are the natural escape valve. |
| Share URL semantics | **Cache learning artifacts by text hash** | First visitor pays for the quiz; subsequent visitors of the same shared analysis get it free. |
| Hosting | **Stay on Netlify** | Domain already wired, `@astrojs/netlify` adapter handles SSR + Functions identically to Vercel for this app. |
| Cache + rate-limit storage | **Supabase Postgres only** | One source of truth, no Vercel KV / Upstash dependency. |
| IP storage | **Hash with `APP_SECRET`, never store raw** | Counts are all we need; raw IPs are PII. |

---

## 3. Architecture

### Runtime topology

```
Browser (workspace UI)
        │ POST /api/ai/<endpoint>
        ▼
Netlify Function (Astro SSR API route)
        │ uses createAiHandler(...)
        ▼
src/server/ai/handler.ts
        │   1. parse + validate request
        │   2. compute deterministic hash
        │   3. cache lookup via src/server/cache.ts
        │      └── Supabase: analyses table
        │   4. on miss: rate-limit check via src/server/rate-limit.ts
        │      └── Supabase: rate_limits table
        │   5. call Gemini via src/server/ai/gemini.ts
        │   6. validate response (zod)
        │   7. persist to analyses
        │   8. return JSON + rate-limit headers
        ▼
Browser (renders result)
```

The browser never holds the Gemini key. The browser never talks to Supabase in Tier 1 — only the server does, and it uses the service-role key. This will change in Tier 2 when client-side queries for user data come online with the anon key + RLS.

### Files: created, modified, deleted

**Created**
- `src/server/supabase.ts` — server-only Supabase client (service role).
- `src/server/cache.ts` — `get(endpoint, hash, model)` / `put(endpoint, hash, model, input, output)`.
- `src/server/rate-limit.ts` — `checkAndRecord(ipHash) → { ok, remaining, resetAt } | { rateLimited, retryAfter, resetAt }`.
- `src/server/ai/handler.ts` — `createAiHandler(opts)` factory used by all seven routes.
- `src/server/ai/hash.ts` — canonical body serializer + sha256.
- `src/pages/a/[hash].astro` — share-URL landing page that SSR-renders the workspace pre-populated from the cache.
- `supabase/migrations/<timestamp>_tier1_init.sql` — `analyses`, `rate_limits`, indexes, daily cleanup function.

**Rewritten (each becomes ~15 lines using `createAiHandler`)**
- `src/pages/api/ai/analyze.ts`
- `src/pages/api/ai/quiz.ts`
- `src/pages/api/ai/tutor.ts`
- `src/pages/api/ai/vocab.ts`
- `src/pages/api/ai/graph.ts`
- `src/pages/api/ai/prosody.ts`
- `src/pages/api/ai/parsing.ts`

**Modified**
- `astro.config.mjs` — `output: 'server'`, `adapter: netlify()`.
- `src/server/ai/gemini.ts` — single source for model name + client construction.
- `src/server/ai/prompts.ts` / `errors.ts` / `json.ts` — kept; `errors.ts` becomes the canonical error envelope.
- `src/components/app/InputCard.tsx` — read rate-limit state from response headers instead of running a client-side counter.
- `src/utils/apiClient.ts` — handle the unified error envelope (`{ error, code, retryAfter? }`).
- `package.json` — add `@astrojs/netlify`, `@supabase/supabase-js`, `zod`. Remove `@google/generative-ai`-specific dead utility imports if any.
- `netlify.toml` — keep, drop dead redirects (none currently relevant).

**Deleted**
- `src/pages/api/analyze.ts` — 642-line legacy duplicate of `/api/ai/analyze`. Was the old "Netlify Functions" path, never used by current UI.
- `src/utils/directGeminiApi.ts` — client-side Gemini caller. Exposes the key.
- `src/utils/geminiApi.ts` — orphaned helper for the direct path.
- `src/utils/netlifyEnv.ts` — orphaned env-loader for the legacy path.
- `src/utils/cache.ts` — in-memory cache replaced by Supabase.
- `src/utils/rateLimiter.ts` — client-side counter (security theatre; the server is the only enforceable limiter).
- `src/pages/direct-api-demo.astro` — demo page for the deleted direct-API path.
- `test-client.html` — orphaned test harness from the old API.
- `progress.md` — 2-year-stale status doc; replaced by spec/plan docs in `docs/superpowers/`.

---

## 4. Data model

Both tables live in the public schema. RLS is enabled and **denies all** by default — only the service role (used exclusively by the server) can read/write. When Tier 2 adds user tables, those will have proper user-scoped RLS; Tier 1 tables stay server-only forever.

### `analyses`

Content-addressed cache keyed by `(endpoint, text_hash, model)`.

```sql
create table analyses (
  id          uuid primary key default gen_random_uuid(),
  endpoint    text not null check (endpoint in
              ('analyze','quiz','tutor','vocab','graph','prosody','parsing')),
  text_hash   text not null,        -- sha256 of canonical(input)
  input       jsonb not null,       -- full request body (for debugging / re-runs)
  output      jsonb not null,       -- validated Gemini response
  model       text not null,        -- e.g. 'gemini-3.1-flash-lite-preview'
  created_at  timestamptz not null default now()
);

create unique index analyses_endpoint_hash_model_key
  on analyses (endpoint, text_hash, model);

create index analyses_endpoint_hash_idx
  on analyses (endpoint, text_hash);

alter table analyses enable row level security;
-- No policies = nothing accessible to any role except service_role.
```

The unique constraint on `(endpoint, text_hash, model)` is also the conflict target for `putCached`'s `upsert(..., { onConflict: 'endpoint,text_hash,model' })`. Concurrent first-time writers no-op silently — whoever's row lands first wins, the others' upserts are harmless overwrites of identical content.

### `rate_limits`

Sliding-window log per IP hash. One row per AI call (cache misses only).

```sql
create table rate_limits (
  id         bigserial primary key,
  ip_hash    text not null,         -- sha256(ip + APP_SECRET)
  called_at  timestamptz not null default now()
);

create index rate_limits_ip_called_idx
  on rate_limits (ip_hash, called_at desc);

alter table rate_limits enable row level security;
-- service_role only.
```

### Cleanup

A daily Supabase cron job (`select cron.schedule(...)`) prunes `rate_limits` rows older than 24 hours. Older rows have no business value (the window is 3h) and would otherwise grow unboundedly. `analyses` is **not** pruned — it's the cache that backs every share URL forever.

---

## 5. Server primitives

### `src/server/supabase.ts`

```ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
```

Only imported from files under `src/server/` and `src/pages/api/`. A lint rule (or a comment + manual review for now) keeps this from leaking into client code.

### `src/server/ai/hash.ts`

```ts
import { createHash } from 'node:crypto';

// Canonicalises objects so {a:1,b:2} and {b:2,a:1} hash identically.
export function canonicalize(value: unknown): string { /* sorted-key JSON */ }

export function hashRequest(endpoint: string, body: unknown): string {
  return createHash('sha256').update(`${endpoint}\n${canonicalize(body)}`).digest('hex');
}

export function hashIp(ip: string): string {
  const secret = process.env.APP_SECRET!;
  return createHash('sha256').update(`${ip}\n${secret}`).digest('hex');
}
```

### `src/server/cache.ts`

```ts
export async function getCached(endpoint, textHash, model): Promise<unknown | null>;
export async function putCached(endpoint, textHash, model, input, output): Promise<void>;
```

`putCached` uses `upsert` with `onConflict: 'endpoint,text_hash,model'` so the herd case is a silent no-op.

### `src/server/rate-limit.ts`

```ts
const LIMIT = 15;
const WINDOW_MS = 3 * 60 * 60 * 1000;

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; retryAfter: number; resetAt: number };

export async function checkAndRecord(ipHash: string): Promise<RateLimitResult> {
  // 1. Count rows where ip_hash = $1 and called_at > now() - 3h
  // 2. If count >= 15: compute resetAt = oldest_in_window + 3h, return { ok: false, ... }
  // 3. Else: insert a row, return { ok: true, remaining: 15 - count - 1, resetAt: now + 3h }
}
```

The check + insert run as separate statements; we accept a tiny race window where two concurrent first-time requests could both pass the check at count=14. Acceptable for a cost-control limiter — the cap can briefly tick to 16, not 1500. If we need stricter, we'll wrap it in a Postgres function in Tier 1.5.

### `src/server/ai/handler.ts`

```ts
type HandlerOpts<TBody, TOut> = {
  endpoint: 'analyze' | 'quiz' | 'tutor' | 'vocab' | 'graph' | 'prosody' | 'parsing';
  bodySchema: ZodSchema<TBody>;
  outputSchema: ZodSchema<TOut>;
  buildPrompt: (body: TBody) => string;
};

export function createAiHandler<TBody, TOut>(opts: HandlerOpts<TBody, TOut>): APIRoute {
  return async ({ request }) => {
    const body = opts.bodySchema.safeParse(await request.json());
    if (!body.success) return errorResponse(400, 'invalid_input', body.error.message);

    const hash = hashRequest(opts.endpoint, body.data);
    const cached = await getCached(opts.endpoint, hash, MODEL);
    if (cached) return ok(cached, { cache: 'HIT' });

    const ip = extractIp(request);
    const rl = await checkAndRecord(hashIp(ip));
    if (!rl.ok) return errorResponse(429, 'rate_limited', 'Too many requests', rl);

    let raw;
    try { raw = await callGemini(opts.buildPrompt(body.data)); }
    catch (e) { return errorResponse(502, 'model_error', String(e)); }

    const parsed = opts.outputSchema.safeParse(raw);
    if (!parsed.success) return errorResponse(502, 'model_error', 'Malformed Gemini output');

    await putCached(opts.endpoint, hash, MODEL, body.data, parsed.data);
    return ok(parsed.data, { cache: 'MISS', rateLimit: rl });
  };
}
```

`ok()` and `errorResponse()` add `X-Cache`, `X-Content-Hash`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After` headers as appropriate.

### IP extraction

```ts
function extractIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-nf-client-connection-ip') ?? '0.0.0.0';
}
```

Netlify sets `x-nf-client-connection-ip` reliably; `x-forwarded-for` is the cross-platform fallback. Local dev with no client IP falls through to `0.0.0.0` — fine, since we hash before using.

---

## 6. Error envelope

Every AI route returns one of two shapes:

```jsonc
// success
{ /* validated output object */ }
// (with X-Cache, X-RateLimit-* headers)

// error
{ "error": "human-readable message", "code": "rate_limited|invalid_input|model_error|server_error", "retryAfter"?: 1234 }
```

The seven different error formats currently sprinkled across the legacy `analyze.ts` (`fallback`, `degradedAnalysis`, `errorType`, `suggestions`, `debug`, `rawResponse`, etc.) are all gone. The client `apiClient.ts` reads `code` and the workspace surfaces matching UI states.

Notable removals from the legacy route:
- The `createDegradedAnalysis()` regex-based fallback that fakes parts of speech is **deleted**. It produces wrong information that looks correct, which is worse than an honest 502.
- The `getErrorSuggestions()` helper is **deleted**. Suggestions belong in the UI, not the API.
- The streaming branch of `analyze.ts` is **deleted**. Nothing in the current UI uses streaming, and Gemini structured output works fine without it. If we want streaming later, it's a clean addition to `handler.ts`.

---

## 7. Share URLs

`src/pages/a/[hash].astro` is a server-rendered page:

```astro
---
const { hash } = Astro.params;
const cached = await getCached('analyze', hash, MODEL);
if (!cached) return Astro.redirect('/app?notFound=' + hash);
---
<MainLayout>
  <Workspace client:load initialAnalysis={cached} initialHash={hash} />
</MainLayout>
```

`Workspace` accepts `initialAnalysis` / `initialHash` props and seeds the Zustand store via a `useEffect` on mount. From the visitor's POV, the analysis is already done — they hover, pin, etc., immediately. Any quiz/tutor/vocab they trigger hits the cache first (because the original analyzer's calls populated those rows too, if they triggered them).

A "Share" button appears in the workspace once `analysisState === 'success'`. The server returns the hash via a response header (`X-Content-Hash`) on every AI response — keeping the JSON body free of envelope metadata. The client reads this header on the analyze response and uses it to construct `${origin}/a/${hash}` for the clipboard.

If a visitor opens a `/a/<hash>` for an analysis that's no longer in cache (extremely unlikely — we never delete `analyses` rows in Tier 1), they get redirected to `/app?notFound=<hash>` which shows a "this share has expired" empty state.

---

## 8. Model identifier

The user-specified model is **`gemini-3.1-flash-lite-preview`**. Before merging implementation:

1. Look up Google Generative AI docs via Context7 (`mcp__plugin_context7_context7__resolve-library-id` → `query-docs` for `@google/generative-ai`) to confirm the exact ID string and any required client-version bump.
2. If the actual ID differs (e.g., `gemini-3.1-flash-lite-preview-0614`), use the real one and document in the migration note.
3. Pin the chosen string as `const MODEL` in `src/server/ai/gemini.ts`. This is the only place it's referenced. `analyses` rows tagged with the old model stay valid; new requests just don't see them on lookup, so they re-cache under the new model.

---

## 9. Environment & config

### Required env vars

| Var | Where | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Netlify dashboard, `.env.local` | Server-side Gemini calls. Never `PUBLIC_*`. |
| `SUPABASE_URL` | Netlify dashboard, `.env.local` | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Netlify dashboard, `.env.local` | Server-only DB access. **Never** `PUBLIC_*`. |
| `SUPABASE_ANON_KEY` | Netlify dashboard, `.env.local` | Reserved for Tier 2 (client auth). Set now to avoid a re-deploy later. |
| `APP_SECRET` | Netlify dashboard, `.env.local` | Salt for IP hashing. Generate with `openssl rand -hex 32`. |

`.env.example` is updated to list these. The user already has `SUPABASE_KEY`, `SUPABASE_DB_PASSWORD`, `SUPABASE_URL`, `GEMINI_API_KEY` in `.env.local`; we'll standardize on the names above and the implementation plan renames as needed.

### Netlify config

- `netlify.toml` keeps the existing build command. With `output: 'server'`, the `@astrojs/netlify` adapter outputs Astro's API routes as Netlify Functions automatically — no manual function configuration needed.
- Local dev: `netlify dev` reads `.env.local` and runs the SSR + functions stack the same way production does.

---

## 10. Build sequence

The plan generated from this spec will expand each step into a verifiable goal.

1. **Verify model + Supabase project.**
   - Context7 docs lookup for the exact `gemini-3.1-flash-lite-preview` ID.
   - Supabase MCP `list_projects` → confirm the existing Latinium project the user has in `.env.local`. Capture/verify URL + service role key. Generate `APP_SECRET` via `openssl rand -hex 32` and add to `.env.local` + Netlify env.
2. **SSR adapter swap.** Install `@astrojs/netlify`, set `output: 'server'`, `adapter: netlify()`. `npm run build` succeeds; the existing seven AI routes still respond locally via `netlify dev`.
3. **Supabase migrations.** Apply the `tier1_init.sql` migration via MCP. Verify table existence + RLS enabled with no policies. Schedule the daily `rate_limits` cleanup cron.
4. **Server primitives.** Implement `supabase.ts`, `hash.ts`, `cache.ts`, `rate-limit.ts`. Cover with a small set of integration tests against the real Supabase project (cache put/get round-trip, rate-limit at 15/16).
5. **Handler factory + route migrations.** Implement `createAiHandler`. Rewrite each of the seven `src/pages/api/ai/*.ts` to use it with its own zod schema + prompt.
6. **Client cleanup.** Delete the dead utilities and components listed in §3. Update `apiClient.ts` for the new error envelope. Update `InputCard.tsx` to read rate-limit headers.
7. **Share URLs.** Add `src/pages/a/[hash].astro`. Wire a "Share" button into the workspace once the analysis succeeds.
8. **Smoke test on Netlify deploy preview.**
   - Analyze a sample text → 200 + `X-Cache: MISS`.
   - Re-analyze same text → 200 + `X-Cache: HIT`, no new `rate_limits` row.
   - Open the resulting `/a/<hash>` from a fresh browser → renders correctly.
   - Burst 16 unique analyses from one IP → 16th returns 429 with `Retry-After`.

---

## 11. Out-of-scope notes (so they're not forgotten)

These belong to later tiers and are intentionally not addressed here.

**Tier 2 (Auth + User data) — next.**
- Anonymous Supabase auth on first visit.
- Tables: `profiles`, `vocabulary_cards`, `texts`, `study_sessions`, `achievements`. RLS scoped by `auth.uid()`.
- Client Supabase wrapper (anon key) and `storage.ts` rewrite to query the DB.
- Account upgrade flow (anonymous → email/password or OAuth).

**Tier 3 (App UX).**
- Pick one analysis view; delete the other and the toggle.
- Break `StructuredTextView.tsx` (846 lines) into focused units.
- Make the read → pin → quiz → vocab → SRS loop actually compose.
- Delete dead components (achievements page, study mode, etc.) or finish them.

**Tier 4 (Landing polish + dep cleanup).**
- Tighten the hero section while keeping the existing aesthetic.
- Audit and remove unused deps (`matter-js`, `ogl`, `gl-matrix`, `maath`, `postprocessing`, `@chakra-ui/*`, `@emotion/*`, `gsap` if unused after audit).

---

## 12. Open questions

None blocking implementation. The model-ID verification in §8 is a 2-minute Context7 lookup at the top of the build sequence.
