-- Replace "Cavalaria" in product names
UPDATE products SET name = REPLACE(name, 'Cavalaria', 'Agro Brasil') WHERE name ILIKE '%cavalaria%';

-- Replace "cavalaria" in product descriptions (case variations)
UPDATE products SET description = REPLACE(REPLACE(description, 'Cavalaria', 'Agro Brasil'), 'cavalaria', 'agro brasil') WHERE description ILIKE '%cavalaria%';

-- Replace in source_url references
UPDATE products SET source_url = REPLACE(source_url, 'cavalariashop', 'agrobrasil') WHERE source_url ILIKE '%cavalaria%';