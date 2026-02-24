
-- Coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_purchase NUMERIC DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read active coupons" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage coupons" ON public.coupons FOR ALL USING (true);

-- Popup banners table
CREATE TABLE public.popup_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  description TEXT,
  image_url TEXT,
  button_text TEXT DEFAULT 'Ver Oferta',
  button_link TEXT DEFAULT '/produtos',
  popup_type TEXT NOT NULL DEFAULT 'banner' CHECK (popup_type IN ('banner', 'email_capture', 'countdown')),
  show_on_pages TEXT[] DEFAULT '{}',
  delay_seconds INTEGER NOT NULL DEFAULT 3,
  show_once BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.popup_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read popup_banners" ON public.popup_banners FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage popup_banners" ON public.popup_banners FOR ALL USING (true);

-- Quiz tables
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read quizzes" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage quizzes" ON public.quizzes FOR ALL USING (true);

CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read quiz_questions" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage quiz_questions" ON public.quiz_questions FOR ALL USING (true);

CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  result_label TEXT NOT NULL,
  description TEXT,
  recommended_category_slug TEXT,
  recommended_product_ids TEXT[] DEFAULT '{}',
  match_rules JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read quiz_results" ON public.quiz_results FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage quiz_results" ON public.quiz_results FOR ALL USING (true);

-- Email captures
CREATE TABLE public.email_captures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  phone TEXT,
  name TEXT,
  source TEXT DEFAULT 'popup',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_captures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert email_captures" ON public.email_captures FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated read email_captures" ON public.email_captures FOR SELECT USING (true);
