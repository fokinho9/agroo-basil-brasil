DROP POLICY "Allow public read orders for tracking" ON public.orders;

CREATE POLICY "Allow public read orders for tracking"
ON public.orders
FOR SELECT
TO anon
USING (true);