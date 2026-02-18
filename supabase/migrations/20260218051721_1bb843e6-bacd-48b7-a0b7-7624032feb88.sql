
SELECT
  cron.schedule(
    'check-stuck-import-jobs',
    '* * * * *',
    $$
    SELECT net.http_post(
      url := 'https://zugcumtokvyszishwcwh.supabase.co/functions/v1/import-from-site',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1Z2N1bXRva3Z5c3ppc2h3Y3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3ODA2ODIsImV4cCI6MjA4NjM1NjY4Mn0.bx8JE-zcQBaziG3jjU1TNfoVLY6jQXkVgjB1qX-S0f0"}'::jsonb,
      body := '{"checkStuck": true}'::jsonb
    ) AS request_id;
    $$
  );
