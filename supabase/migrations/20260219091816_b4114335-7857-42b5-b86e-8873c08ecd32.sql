
-- Delete order_items referencing camisetas products
DELETE FROM order_items WHERE product_id IN (
  SELECT p.id FROM products p JOIN categories c ON p.category_id = c.id WHERE c.slug = 'vestuario-camisetas'
);

-- Delete reviews for camisetas products
DELETE FROM reviews WHERE product_id IN (
  SELECT p.id FROM products p JOIN categories c ON p.category_id = c.id WHERE c.slug = 'vestuario-camisetas'
);

-- Delete camisetas products
DELETE FROM products WHERE category_id IN (
  SELECT id FROM categories WHERE slug = 'vestuario-camisetas'
);
