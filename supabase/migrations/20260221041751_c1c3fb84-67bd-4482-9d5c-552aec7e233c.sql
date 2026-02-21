
-- Add gclid and fbclid columns to page_views for Google Ads and Meta Ads tracking
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS gclid text;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS fbclid text;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS utm_content text;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS utm_term text;

-- Create indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_page_views_gclid ON public.page_views (gclid) WHERE gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_views_fbclid ON public.page_views (fbclid) WHERE fbclid IS NOT NULL;
