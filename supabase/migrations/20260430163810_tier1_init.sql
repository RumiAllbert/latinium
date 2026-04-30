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

-- rate_limits: sliding-window log per IP hash
create table if not exists public.rate_limits (
  id         bigserial primary key,
  ip_hash    text not null,
  called_at  timestamptz not null default now()
);

create index if not exists rate_limits_ip_called_idx
  on public.rate_limits (ip_hash, called_at desc);

alter table public.rate_limits enable row level security;

-- Cleanup function: prune rate_limits older than 24h
create or replace function public.prune_rate_limits()
returns void
language sql
security definer
as $$
  delete from public.rate_limits where called_at < now() - interval '24 hours';
$$;
