CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup_inactive_users_daily',
  '0 3 * * *',
  $$SELECT cleanup_inactive_users();$$
);
