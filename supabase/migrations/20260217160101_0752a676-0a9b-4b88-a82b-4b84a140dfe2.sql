
-- Add variants column to products for colors and sizes
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '[]'::jsonb;

-- Add source_url to track where product was imported from
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS source_url text;
