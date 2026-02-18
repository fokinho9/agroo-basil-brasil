
-- Remove old cron job
SELECT cron.unschedule('check-stuck-import-jobs');

-- Create helper function to schedule the monitor
CREATE OR REPLACE FUNCTION public.schedule_import_monitor()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Only schedule if not already scheduled
  PERFORM 1 FROM cron.job WHERE jobname = 'check-stuck-import-jobs';
  IF NOT FOUND THEN
    PERFORM cron.schedule(
      'check-stuck-import-jobs',
      '*/5 * * * *',
      $inner$
      SELECT net.http_post(
        url := 'https://zugcumtokvyszishwcwh.supabase.co/functions/v1/import-from-site',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1Z2N1bXRva3Z5c3ppc2h3Y3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3ODA2ODIsImV4cCI6MjA4NjM1NjY4Mn0.bx8JE-zcQBaziG3jjU1TNfoVLY6jQXkVgjB1qX-S0f0"}'::jsonb,
        body := '{"checkStuck": true}'::jsonb
      ) AS request_id;
      $inner$
    );
  END IF;
END;
$$;

-- Create helper function to unschedule the monitor
CREATE OR REPLACE FUNCTION public.unschedule_import_monitor()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM 1 FROM cron.job WHERE jobname = 'check-stuck-import-jobs';
  IF FOUND THEN
    PERFORM cron.unschedule('check-stuck-import-jobs');
  END IF;
END;
$$;
