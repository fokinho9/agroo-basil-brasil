
-- Fix Chapéu Stetson Feltro Preto 4X - was showing Rodeo West logo
-- Deactivate since we can't find the correct product image
UPDATE products SET active = false
WHERE id = '36615640-249b-40ba-8723-8e0411e478ee';

-- Fix Chapéu de Feltro Alpaca Santa Fé II Pralana 30764 - broken supabase storage
-- Use Pralana Alpaca Fashion Preto image (same line, similar product)
UPDATE products SET 
  image_url = 'https://img.irroba.com.br/fit-in/600x600/filters:format(webp):fill(fff):quality(80)/chapeusb/catalog/11012385-alpaca-fashion-3360.jpg',
  images = ARRAY[
    'https://img.irroba.com.br/fit-in/600x600/filters:format(webp):fill(fff):quality(80)/chapeusb/catalog/11012385-alpaca-fashion-3360.jpg',
    'https://img.irroba.com.br/fit-in/600x600/filters:format(webp):fill(transparent):quality(80)/chapeusb/catalog/11012385-alpaca-fashion-3360-interna.jpg'
  ]
WHERE id = '0113c706-b36c-4ebb-9952-7c416eef1c47';

-- Fix Chapéu Country Pralana Preto 35074 - broken supabase storage
-- Use Pralana American Horse Preto image (country preto line)
UPDATE products SET 
  image_url = 'https://img.irroba.com.br/fit-in/600x600/filters:format(webp):fill(fff):quality(80)/chapeusb/catalog/12012485-american-horse-3360.jpg',
  images = ARRAY[
    'https://img.irroba.com.br/fit-in/600x600/filters:format(webp):fill(fff):quality(80)/chapeusb/catalog/12012485-american-horse-3360.jpg',
    'https://img.irroba.com.br/fit-in/600x600/filters:format(webp):fill(transparent):quality(80)/chapeusb/catalog/12012485-american-horse-3360-interna.jpg'
  ]
WHERE id = '47eb0cdd-c5ef-4a6f-9be9-b6afbea74807';

-- Fix Chapéu de Palha Shantung Aba Larga Natural - broken supabase storage
-- Use Pralana Shantung 30x Agro Tec image
UPDATE products SET 
  image_url = 'https://img.irroba.com.br/fit-in/600x600/filters:format(webp):fill(fff):quality(80)/chapeusb/catalog/18012940-agrotec-30x-3315.jpg',
  images = ARRAY[
    'https://img.irroba.com.br/fit-in/600x600/filters:format(webp):fill(fff):quality(80)/chapeusb/catalog/18012940-agrotec-30x-3315.jpg',
    'https://img.irroba.com.br/fit-in/600x600/filters:format(webp):fill(fff):quality(80)/chapeusb/catalog/18012940-agrotec-30x-3315-interno.jpg'
  ]
WHERE id = '0d180900-bda2-4a5b-955a-b82b940d7cc5';

-- Fix Chapéu Eldorado Outback Café - broken supabase storage, no source URL
-- Deactivate since we can't verify correct image
UPDATE products SET active = false
WHERE id = 'dd4bcf11-8c8b-4223-a811-2136e8e7d97f';

-- Fix Chapéu Pralana Country 30X Bege - broken supabase storage, no source URL
-- Deactivate since we can't verify correct image
UPDATE products SET active = false
WHERE id = '9e55eb25-a95a-4474-a1c9-4e72dddd6015';
