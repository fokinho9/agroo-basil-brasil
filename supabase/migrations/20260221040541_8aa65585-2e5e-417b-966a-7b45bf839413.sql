
-- Table to log pixel firing events for export/download
CREATE TABLE public.pixel_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  pixel_platform text NOT NULL, -- facebook, google_analytics, google_ads, tiktok, kwai, pinterest, twitter, snapchat
  event_name text NOT NULL, -- PageView, ViewContent, AddToCart, Purchase, etc.
  event_data jsonb DEFAULT '{}'::jsonb,
  path text NOT NULL,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pixel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert pixel_events" ON public.pixel_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated read pixel_events" ON public.pixel_events
  FOR SELECT USING (true);

-- Index for efficient querying
CREATE INDEX idx_pixel_events_created ON public.pixel_events (created_at DESC);
CREATE INDEX idx_pixel_events_platform ON public.pixel_events (pixel_platform);

-- Cleanup function for old pixel events (30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_pixel_events()
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  DELETE FROM public.pixel_events WHERE created_at < now() - interval '30 days';
$$;
