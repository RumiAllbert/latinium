create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'prune-rate-limits-daily',
  '17 3 * * *',
  $$select public.prune_rate_limits()$$
);
