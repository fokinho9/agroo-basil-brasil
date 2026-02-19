
-- Delete reviews for products with broken images
DELETE FROM reviews WHERE product_id IN (
  SELECT id FROM products WHERE 
    image_url LIKE '%cowboystore.com.br%' 
    OR image_url LIKE '%cavalariashop.com.br%' 
    OR image_url LIKE '%uploads.shoppub.io%'
);

-- Delete order_items for products with broken images
DELETE FROM order_items WHERE product_id IN (
  SELECT id FROM products WHERE 
    image_url LIKE '%cowboystore.com.br%' 
    OR image_url LIKE '%cavalariashop.com.br%' 
    OR image_url LIKE '%uploads.shoppub.io%'
);

-- Delete products with broken images (33 products total)
-- 16 from cowboystore.com.br (Magento placeholder)
-- 1 from cavalariashop.com.br (not found)
-- 16 from uploads.shoppub.io (generic "qualidade-garantida" image, not actual product images)
DELETE FROM products WHERE 
  image_url LIKE '%cowboystore.com.br%' 
  OR image_url LIKE '%cavalariashop.com.br%' 
  OR image_url LIKE '%uploads.shoppub.io%';
