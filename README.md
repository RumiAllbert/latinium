# 🏛️ Latinium: Learn Latin Interactively

> **Bring ancient Latin to life with modern visualization and AI analysis.**

Latinium is a learning-first web app for reading Latin. Paste text, hover sentences for instant breakdowns, then dig into a guided Tutor walkthrough, an auto-generated Quiz, and a personal Vocab deck. Powered by Google's Gemini.

[Latinium In Action](https://latinium.rumiallbert.com/)

## ✨ Key Features

- 🔒 Hover analysis: fast sentence-level breakdowns with relationship cues
- 📌 Pin a sentence: open Tutor (guided steps) and Quiz (MCQs) for that line
- 🗂️ Vocab deck: save words and meanings to a deck with spaced repetition
- 🎨 Case-based coloring for instant grammatical recognition
- 🔗 Shareable analysis links — copy a `/a/<hash>` URL and a friend can explore it without an account
- ⚡ Server-side Gemini calls with content-addressed caching and IP rate limiting

## 🚀 Getting Started

### Prerequisites

- 📦 Node.js v18.14.1+
- 🔑 Google Gemini API key ([get one](https://ai.google.dev/))
- 🗄️ Supabase project (free tier is fine) — for the cache and rate-limit tables
- 🌐 Netlify account — the project ships as Astro SSR with the `@astrojs/netlify` adapter

### Setup

1. **Clone & install**
   ```bash
   git clone https://github.com/yourusername/latinium.git
   cd latinium
   npm install --legacy-peer-deps
   ```

2. **Provision Supabase tables**

   Apply the migrations in `supabase/migrations/` to your Supabase project (via the Supabase CLI or the dashboard SQL editor).

3. **Configure `.env.local`**

   Copy `.env.example` to `.env.local` and fill in:
   ```
   GEMINI_API_KEY=...
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=...           # Server only — never expose to client
   SUPABASE_ANON_KEY=...                   # Reserved for Tier 2
   APP_SECRET=<openssl rand -hex 32>       # Salt for IP hashing
   ```

4. **Run locally**
   ```bash
   npm run dev
   ```
   Then visit http://localhost:4321.

## 🏗️ Architecture

- **Astro SSR** on Netlify (`output: 'server'`, `@astrojs/netlify` adapter).
- **One AI route path** — `src/pages/api/ai/{analyze,quiz,tutor,vocab,graph,prosody,parsing}.ts`. Each is a five-line wrapper around `createAiHandler`, which handles request hashing, cache lookup, IP rate limiting, Gemini call, response validation, and cache write.
- **Supabase Postgres** stores the `analyses` cache (content-addressed by `endpoint + text_hash + model`) and the `rate_limits` log.
- **Rate limit:** 15 AI calls per IP per 3-hour sliding window. Cache hits don't count.
- **Share URLs:** `/a/<hash>` is an SSR page that reads the cached analysis straight from Postgres. No sign-in required to view a shared link.

The Gemini key never leaves the server. The browser only ever talks to `/api/ai/*`.

## 📁 Project Structure

```
latinium
├── src/
│   ├── components/         # React UI (workspace, learning panels)
│   ├── layouts/            # Astro layouts
│   ├── pages/              # Astro pages + API routes
│   │   ├── a/              #   shareable analysis URLs
│   │   └── api/ai/         #   the seven AI endpoints
│   ├── server/             # Server-only modules (Supabase, cache, rate-limit, Gemini)
│   │   └── ai/             #   handler factory, hash, schemas, prompts, gemini wrapper
│   ├── store/              # Zustand client store
│   ├── styles/             # Global CSS
│   ├── utils/              # Browser utilities
│   └── types/              # TypeScript types
├── supabase/migrations/    # Postgres schema + RLS
└── public/                 # Static assets
```

## 📝 Deployment

The repo deploys cleanly on Netlify:

1. Connect the repo in the Netlify dashboard.
2. Set the same environment variables you have in `.env.local` (Site settings → Environment variables).
3. Push to `main` (or open a PR for a deploy preview).

## 🔮 Future Enhancements

- 🔐 User accounts (anonymous Supabase auth) and cross-device vocab/progress sync
- 📱 Mobile-optimized interface
- 🌍 Greek/Sanskrit support once the Latin loop is sticky

## 📜 License

MIT
