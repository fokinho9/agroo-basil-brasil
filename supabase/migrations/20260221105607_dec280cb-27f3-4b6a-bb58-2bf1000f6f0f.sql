CREATE OR REPLACE FUNCTION public.find_order_by_code(search_code text)
RETURNS SETOF orders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM orders
  WHERE tracking_code = upper(search_code)
     OR id::text ILIKE (lower(search_code) || '%')
  LIMIT 1;
$$;