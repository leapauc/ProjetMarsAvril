-- Activer pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Planifier le job (tous les jours à 03:00)
SELECT cron.schedule(
  'cleanup_inactive_users_job',
  '0 3 * * *',
  $$SELECT cleanup_inactive_users();$$
);