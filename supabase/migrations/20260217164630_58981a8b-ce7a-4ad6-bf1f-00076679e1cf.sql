-- Delete reviews first (FK to products)
DELETE FROM reviews;
-- Delete order_items referencing products
DELETE FROM order_items;
-- Delete products
DELETE FROM products;
-- Delete categories
DELETE FROM categories;
-- Delete old import jobs
DELETE FROM import_jobs;