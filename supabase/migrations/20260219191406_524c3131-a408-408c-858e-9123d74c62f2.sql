
-- Desativar produtos na categoria Mantas que NÃO começam com 'manta'
UPDATE products SET active = false
WHERE active = true AND category_id = 'b0000002-0000-0000-0000-000000000003' 
AND NOT (lower(name) LIKE 'manta %' OR lower(name) LIKE 'manta-%' OR lower(name) = 'manta');

-- Desativar produtos na categoria Selas que NÃO começam com 'sela'
UPDATE products SET active = false
WHERE active = true AND category_id = 'b0000001-0000-0000-0000-000000000002' 
AND NOT (lower(name) LIKE 'sela %' OR lower(name) LIKE 'sela-%' OR lower(name) = 'sela');

-- Desativar produtos na categoria Capas de Frio que NÃO começam com 'capa'
UPDATE products SET active = false
WHERE active = true AND category_id = 'b0000002-0000-0000-0000-000000000005' 
AND NOT (lower(name) LIKE 'capa %' OR lower(name) LIKE 'capa-%' OR lower(name) = 'capa');
