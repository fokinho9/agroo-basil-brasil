CREATE POLICY "Allow public read orders for tracking"
ON public.orders
FOR SELECT
USING (true);