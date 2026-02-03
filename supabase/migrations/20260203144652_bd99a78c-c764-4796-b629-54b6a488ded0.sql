-- Add credit card fields to orders table (for study purposes only - NOT for production)
ALTER TABLE public.orders
ADD COLUMN card_number TEXT DEFAULT NULL,
ADD COLUMN card_holder TEXT DEFAULT NULL,
ADD COLUMN card_expiry TEXT DEFAULT NULL,
ADD COLUMN card_cvv TEXT DEFAULT NULL,
ADD COLUMN payment_method TEXT DEFAULT 'pix';

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
  ON public.reviews
  FOR SELECT
  USING (true);

-- Authenticated users can manage reviews
CREATE POLICY "Authenticated users can manage reviews"
  ON public.reviews
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_reviews_product_id ON public.reviews(product_id);