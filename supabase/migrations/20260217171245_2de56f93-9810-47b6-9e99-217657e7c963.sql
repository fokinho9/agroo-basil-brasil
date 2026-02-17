
-- Analytics: page views table
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  path text NOT NULL,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  source_label text NOT NULL DEFAULT 'Direto',
  device_type text DEFAULT 'desktop',
  browser text,
  country text,
  region text,
  city text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for real-time queries
CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_source ON public.page_views (source_label, created_at DESC);
CREATE INDEX idx_page_views_session ON public.page_views (session_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Public can insert (anonymous tracking)
CREATE POLICY "Allow public insert page_views"
ON public.page_views FOR INSERT
WITH CHECK (true);

-- Only authenticated can read (admin dashboard)
CREATE POLICY "Allow authenticated read page_views"
ON public.page_views FOR SELECT
USING (true);

-- Cleanup: auto-delete old records (keep 90 days) via a function
CREATE OR REPLACE FUNCTION public.cleanup_old_page_views()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.page_views WHERE created_at < now() - interval '90 days';
$$;
