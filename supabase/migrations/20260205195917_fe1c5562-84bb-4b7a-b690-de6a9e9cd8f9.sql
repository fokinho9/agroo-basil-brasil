-- Deletar produtos com nome "Frete grátis" que foram importados incorretamente
DELETE FROM products WHERE name ILIKE 'frete gr%';