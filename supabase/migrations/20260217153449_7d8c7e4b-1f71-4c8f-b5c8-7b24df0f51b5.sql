-- Create a test import job with 3 specific product URLs
INSERT INTO import_jobs (type, status, total_items, config)
VALUES (
  'site-import', 
  'pending', 
  3,
  '{"siteUrl": "https://www.cavalariashop.com.br/", "categoryId": null, "productUrls": ["https://www.cavalariashop.com.br/produto/kit-banho-boots-horse/", "https://www.cavalariashop.com.br/produto/pente-plastico-c-cabo-para-crina-importado-partrade/", "https://www.cavalariashop.com.br/produto/lixa-para-casco-de-cavalo/"]}'::jsonb
);