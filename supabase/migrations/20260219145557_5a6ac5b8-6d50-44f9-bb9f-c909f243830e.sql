
-- Fix Suporte Cross Fire - use image from protechorse
UPDATE products SET 
  image_url = 'https://img.irroba.com.br/fit-in/600x600/filters:format(webp):fill(fff):quality(80)/protecho/catalog/suporte-para-chapeu-boots-horse-cross-fire.20250212150922.jpg',
  images = ARRAY['https://img.irroba.com.br/fit-in/600x600/filters:format(webp):fill(fff):quality(80)/protecho/catalog/suporte-para-chapeu-boots-horse-cross-fire.20250212150922.jpg']
WHERE id = 'f6d2637b-93d6-45a1-986f-37fc978bc2dc';

-- Fix Suporte Couro Ventosa - same product different listing
UPDATE products SET 
  image_url = 'https://img.irroba.com.br/fit-in/600x600/filters:format(webp):fill(fff):quality(80)/protecho/catalog/suporte-para-chapeu-boots-horse-cross-fire.20250212150922.jpg',
  images = ARRAY['https://img.irroba.com.br/fit-in/600x600/filters:format(webp):fill(fff):quality(80)/protecho/catalog/suporte-para-chapeu-boots-horse-cross-fire.20250212150922.jpg']
WHERE id = '7f31bf46-9e63-497d-81cd-2d028af0109e';

-- Fix Chapéu Country Pralana Preto 35074 - restore original supabase images (was correct before)
-- Keep existing supabase images since rodeowest returned wrong ones
UPDATE products SET 
  image_url = 'https://zugcumtokvyszishwcwh.supabase.co/storage/v1/object/public/product-images/chapeus/47eb0cdd-c5ef-4a6f-9be9-b6afbea74807/0.jpg',
  images = ARRAY[
    'https://zugcumtokvyszishwcwh.supabase.co/storage/v1/object/public/product-images/chapeus/47eb0cdd-c5ef-4a6f-9be9-b6afbea74807/0.jpg',
    'https://zugcumtokvyszishwcwh.supabase.co/storage/v1/object/public/product-images/chapeus/47eb0cdd-c5ef-4a6f-9be9-b6afbea74807/1.jpg'
  ]
WHERE id = '47eb0cdd-c5ef-4a6f-9be9-b6afbea74807';

-- Fix Chapéu de Feltro Alpaca Santa Fé II - restore original supabase images
UPDATE products SET 
  image_url = 'https://zugcumtokvyszishwcwh.supabase.co/storage/v1/object/public/product-images/chapeus/0113c706-b36c-4ebb-9952-7c416eef1c47/0.jpg',
  images = ARRAY[
    'https://zugcumtokvyszishwcwh.supabase.co/storage/v1/object/public/product-images/chapeus/0113c706-b36c-4ebb-9952-7c416eef1c47/0.jpg',
    'https://zugcumtokvyszishwcwh.supabase.co/storage/v1/object/public/product-images/chapeus/0113c706-b36c-4ebb-9952-7c416eef1c47/1.jpg'
  ]
WHERE id = '0113c706-b36c-4ebb-9952-7c416eef1c47';

-- Fix Chapéu de Palha Shantung Aba Larga - restore original supabase image
UPDATE products SET 
  image_url = 'https://zugcumtokvyszishwcwh.supabase.co/storage/v1/object/public/product-images/chapeus/0d180900-bda2-4a5b-955a-b82b940d7cc5/0.jpg',
  images = ARRAY['https://zugcumtokvyszishwcwh.supabase.co/storage/v1/object/public/product-images/chapeus/0d180900-bda2-4a5b-955a-b82b940d7cc5/0.jpg']
WHERE id = '0d180900-bda2-4a5b-955a-b82b940d7cc5';
