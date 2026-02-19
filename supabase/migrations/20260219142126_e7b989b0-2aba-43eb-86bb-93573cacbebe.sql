
-- Move Baixeiros to correct category
UPDATE products SET category_id = '6e0ce1d9-0ba4-4f6b-afdf-804463276d80' 
WHERE name ILIKE '%baixeiro%' AND category_id != '6e0ce1d9-0ba4-4f6b-afdf-804463276d80';

-- Move Cabo de Gamarra to Gamarras
UPDATE products SET category_id = 'b0000001-0000-0000-0000-000000000010'
WHERE name ILIKE '%gamarra%' AND category_id != 'b0000001-0000-0000-0000-000000000010';

-- Move Caneleira Dianteira to Caneleiras Dianteiras
UPDATE products SET category_id = 'b0000002-0000-0000-0000-000000000006'
WHERE name ILIKE '%caneleira%dianteira%' AND category_id != 'b0000002-0000-0000-0000-000000000006';

-- Move Chicotes to Chicotes subcategory
UPDATE products SET category_id = 'c3cd8f41-d910-4792-930f-14bbc5fdcd87'
WHERE name ILIKE '%chicote%' AND category_id = 'b0000001-0000-0000-0000-000000000006';

-- Move Rédeas to Rédeas subcategory
UPDATE products SET category_id = 'aeda6e6b-88f1-4c62-b553-7429ddc29353'
WHERE (name ILIKE '%rédea%' OR name ILIKE '%redea%') AND category_id = 'b0000001-0000-0000-0000-000000000006';

-- Move Bolsa Pets to Linha Pet
UPDATE products SET category_id = 'a0000001-0000-0000-0000-000000000005'
WHERE name ILIKE '%pets%' AND category_id != 'a0000001-0000-0000-0000-000000000005';

-- Move Caneleira e Cloche kit to Kits
UPDATE products SET category_id = 'b0000002-0000-0000-0000-000000000004'
WHERE (name ILIKE '%caneleira%cloche%' OR name ILIKE '%cloche%caneleira%' OR name ILIKE '%kit%cloche%' OR name ILIKE '%kit%caneleira%') 
AND category_id NOT IN ('b0000002-0000-0000-0000-000000000004');

-- Move Cloches solo to Cloches
UPDATE products SET category_id = 'b0000002-0000-0000-0000-000000000001'
WHERE name ILIKE '%cloche%' AND name NOT ILIKE '%caneleira%' AND name NOT ILIKE '%kit%'
AND category_id NOT IN ('b0000002-0000-0000-0000-000000000001', 'b0000002-0000-0000-0000-000000000004');

-- Move Capacetes to Acessório P/ Cavaleiro
UPDATE products SET category_id = 'ccf0b36d-4260-43f1-8b10-cf77cfef8f84'
WHERE name ILIKE '%capacete%' AND category_id = 'a0000001-0000-0000-0000-000000000001';

-- Move Cavalete to Selas e Acessórios
UPDATE products SET category_id = 'b0000001-0000-0000-0000-000000000002'
WHERE name ILIKE '%cavalete%' AND category_id = 'a0000001-0000-0000-0000-000000000001';

-- Move Cabeça de Boi to Cordas (treino de laço)
UPDATE products SET category_id = 'b0000001-0000-0000-0000-000000000007'
WHERE name ILIKE '%cabeça%boi%treino%' AND category_id = 'a0000001-0000-0000-0000-000000000001';

-- Move Liga products to Ligas
UPDATE products SET category_id = 'b0000002-0000-0000-0000-000000000002'
WHERE (name ILIKE '%liga de%' OR name ILIKE '%liga para%' OR name ILIKE '%liga descanso%' OR name ILIKE '%jogo de liga%')
AND category_id != 'b0000002-0000-0000-0000-000000000002';

-- Move Bota de casco (horse hoof boots) to Mantas & Proteções
UPDATE products SET category_id = 'a0000001-0000-0000-0000-000000000002'
WHERE name ILIKE '%bota%casco%';

-- Move remaining Caneleira e Cloche from root Selaria to Kits
UPDATE products SET category_id = 'b0000002-0000-0000-0000-000000000004'
WHERE name ILIKE '%caneleira%' AND name ILIKE '%cloche%' AND category_id = 'a0000001-0000-0000-0000-000000000001';
