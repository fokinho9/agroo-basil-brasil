-- First delete reviews for products with broken images
DELETE FROM reviews WHERE product_id IN (
  SELECT id FROM products WHERE category_id = '6c6c18c3-07ae-42f1-a196-c0e81f1f237b' AND (image_url LIKE '%cdn.iset.io%' OR image_url LIKE '%tcdn.com.br/img/img_prod/795863%')
);

-- Then delete the products
DELETE FROM products WHERE category_id = '6c6c18c3-07ae-42f1-a196-c0e81f1f237b' AND (image_url LIKE '%cdn.iset.io%' OR image_url LIKE '%tcdn.com.br/img/img_prod/795863%');