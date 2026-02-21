
-- Click events for heatmap
CREATE TABLE public.click_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  path text NOT NULL,
  x numeric NOT NULL,
  y numeric NOT NULL,
  viewport_width integer NOT NULL,
  viewport_height integer NOT NULL,
  element_tag text,
  element_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert click_events" ON public.click_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated read click_events" ON public.click_events FOR SELECT USING (true);

-- Feedback widget
CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  path text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert feedback" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated read feedback" ON public.feedback FOR SELECT USING (true);

-- Polls
CREATE TABLE public.polls (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  show_on_pages text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read active polls" ON public.polls FOR SELECT USING (active = true);
CREATE POLICY "Allow authenticated manage polls" ON public.polls FOR ALL USING (true);

-- Poll responses
CREATE TABLE public.poll_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_index integer NOT NULL,
  session_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.poll_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert poll_responses" ON public.poll_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated read poll_responses" ON public.poll_responses FOR SELECT USING (true);

-- Scroll depth tracking
CREATE TABLE public.scroll_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  path text NOT NULL,
  max_depth integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.scroll_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert scroll_events" ON public.scroll_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated read scroll_events" ON public.scroll_events FOR SELECT USING (true);

-- Cleanup function for old click/scroll events
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics_events()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.click_events WHERE created_at < now() - interval '30 days';
  DELETE FROM public.scroll_events WHERE created_at < now() - interval '30 days';
$$;
