
CREATE TABLE public.section_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  path TEXT NOT NULL,
  section_id TEXT NOT NULL,
  time_visible_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.section_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert section_views" ON public.section_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated read section_views" ON public.section_views
  FOR SELECT USING (true);

CREATE INDEX idx_section_views_created ON public.section_views (created_at DESC);
CREATE INDEX idx_section_views_path ON public.section_views (path, section_id);
