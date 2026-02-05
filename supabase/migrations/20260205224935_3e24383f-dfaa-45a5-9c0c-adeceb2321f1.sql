-- Create abandoned_carts table
CREATE TABLE public.abandoned_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_cep TEXT,
  customer_address TEXT,
  customer_city TEXT,
  customer_state TEXT,
  cart_items JSONB NOT NULL,
  cart_total NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'abandoned',
  contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can manage abandoned carts" 
ON public.abandoned_carts 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can create abandoned carts" 
ON public.abandoned_carts 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_abandoned_carts_updated_at
BEFORE UPDATE ON public.abandoned_carts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();