
-- Create tracking_events table for simulated Jadlog tracking
CREATE TABLE public.tracking_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tracking_code text NOT NULL,
  simulated boolean NOT NULL DEFAULT true,
  status_code text NOT NULL,
  status_label text NOT NULL,
  location_city text,
  location_state text,
  location_postcode text,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_tracking_events_tracking_code ON public.tracking_events(tracking_code);
CREATE INDEX idx_tracking_events_order_id ON public.tracking_events(order_id);

-- Enable RLS
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

-- Public can read tracking events (for tracking page)
CREATE POLICY "Allow public read tracking_events"
ON public.tracking_events
FOR SELECT
USING (true);

-- Authenticated users can manage tracking events
CREATE POLICY "Allow authenticated manage tracking_events"
ON public.tracking_events
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow public insert for order creation flow
CREATE POLICY "Allow public insert tracking_events"
ON public.tracking_events
FOR INSERT
WITH CHECK (true);
