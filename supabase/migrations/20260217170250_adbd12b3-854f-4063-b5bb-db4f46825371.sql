
-- Delete products referencing categories first
DELETE FROM reviews;
DELETE FROM order_items;
DELETE FROM products;

-- Now delete existing categories
DELETE FROM categories;

-- ============================================
-- MAIN CATEGORIES
-- ============================================
INSERT INTO categories (id, name, slug, parent_id, display_order) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Selaria', 'selaria', NULL, 1),
  ('a0000001-0000-0000-0000-000000000002', 'Mantas & Proteção para Cavalo', 'mantas-e-protecao-para-cavalo', NULL, 2),
  ('a0000001-0000-0000-0000-000000000003', 'Vestuário', 'vestuario', NULL, 3),
  ('a0000001-0000-0000-0000-000000000004', 'Botas', 'botas', NULL, 4),
  ('a0000001-0000-0000-0000-000000000005', 'Linha Pet', 'linha-pet', NULL, 5),
  ('a0000001-0000-0000-0000-000000000006', 'Equipamentos para Cavalos', 'equipamentos-para-cavalos-01', NULL, 6),
  ('a0000001-0000-0000-0000-000000000007', 'Produtos Cavalaria', 'produtos-cavalaria-02', NULL, 7),
  ('a0000001-0000-0000-0000-000000000008', 'Promoções', 'promocoes', NULL, 8);

-- SELARIA > Subcategorias
INSERT INTO categories (id, name, slug, parent_id, display_order) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'Esporas e Correias', 'selaria-esporas-e-correias', 'a0000001-0000-0000-0000-000000000001', 1),
  ('b0000001-0000-0000-0000-000000000002', 'Selas e Acessórios', 'selaria-selas-e-acessorios', 'a0000001-0000-0000-0000-000000000001', 2),
  ('b0000001-0000-0000-0000-000000000003', 'Cabeçadas', 'selaria-cabecadas', 'a0000001-0000-0000-0000-000000000001', 3),
  ('b0000001-0000-0000-0000-000000000004', 'Barrigueira', 'selaria-barrigueira', 'a0000001-0000-0000-0000-000000000001', 4),
  ('b0000001-0000-0000-0000-000000000005', 'Escovas para Cavalos', 'selaria-escovas-para-cavalos', 'a0000001-0000-0000-0000-000000000001', 5),
  ('b0000001-0000-0000-0000-000000000006', 'Rédeas e Chicotes', 'selaria-redeas-e-chicotes', 'a0000001-0000-0000-0000-000000000001', 6),
  ('b0000001-0000-0000-0000-000000000007', 'Cordas', 'selaria-cordas', 'a0000001-0000-0000-0000-000000000001', 7),
  ('b0000001-0000-0000-0000-000000000008', 'Freios e Bridões', 'selaria-freios-e-bridoes', 'a0000001-0000-0000-0000-000000000001', 8),
  ('b0000001-0000-0000-0000-000000000009', 'Cabresto e Cabos', 'selaria-cabresto-e-cabos', 'a0000001-0000-0000-0000-000000000001', 9),
  ('b0000001-0000-0000-0000-000000000010', 'Gamarras', 'selaria-gamarras', 'a0000001-0000-0000-0000-000000000001', 10),
  ('b0000001-0000-0000-0000-000000000011', 'Acessório p/ Cavaleiro', 'selaria-acessorio-p-cavaleiro', 'a0000001-0000-0000-0000-000000000001', 11);

-- SELARIA > Selas e Acessórios > Sub-subcategorias
INSERT INTO categories (id, name, slug, parent_id, display_order) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'Pochete p/ Sela', 'selaria-selaria-selas-e-acessorios-pochete-p-sela', 'b0000001-0000-0000-0000-000000000002', 1),
  ('c0000001-0000-0000-0000-000000000002', 'Lategos', 'selaria-selaria-selas-e-acessorios-lategos', 'b0000001-0000-0000-0000-000000000002', 2),
  ('c0000001-0000-0000-0000-000000000003', 'Sela Tambor', 'selaria-selaria-selas-e-acessorios-sela-tambor', 'b0000001-0000-0000-0000-000000000002', 3),
  ('c0000001-0000-0000-0000-000000000004', 'Sela em Neoprene', 'selaria-selaria-selas-e-acessorios-sela-em-neoprene', 'b0000001-0000-0000-0000-000000000002', 4),
  ('c0000001-0000-0000-0000-000000000005', 'Bolsas', 'selaria-selaria-selas-e-acessorios-bolsas', 'b0000001-0000-0000-0000-000000000002', 5),
  ('c0000001-0000-0000-0000-000000000006', 'Peitoral', 'selaria-selas-e-acessorios-peitoral', 'b0000001-0000-0000-0000-000000000002', 6);

-- SELARIA > Barrigueira > Sub-subcategorias
INSERT INTO categories (id, name, slug, parent_id, display_order) VALUES
  ('c0000002-0000-0000-0000-000000000001', 'Barrigueira Airflex', 'selaria-selaria-barrigueira-barrigueira-airflex', 'b0000001-0000-0000-0000-000000000004', 1),
  ('c0000002-0000-0000-0000-000000000002', 'Barrigueira Neoprene', 'selaria-selaria-barrigueira-barrigueira-neoprene', 'b0000001-0000-0000-0000-000000000004', 2),
  ('c0000002-0000-0000-0000-000000000003', 'Barrigueira Importada', 'selaria-selaria-barrigueira-barrigueira-importada', 'b0000001-0000-0000-0000-000000000004', 3);

-- SELARIA > Rédeas e Chicotes > Sub-subcategorias
INSERT INTO categories (id, name, slug, parent_id, display_order) VALUES
  ('c0000003-0000-0000-0000-000000000001', 'Rédeas', 'selaria-selaria-redeas-e-chicotes-redeas', 'b0000001-0000-0000-0000-000000000006', 1),
  ('c0000003-0000-0000-0000-000000000002', 'Chicotes', 'selaria-selaria-redeas-e-chicotes-chicotes', 'b0000001-0000-0000-0000-000000000006', 2);

-- SELARIA > Cabresto e Cabos > Sub-subcategorias
INSERT INTO categories (id, name, slug, parent_id, display_order) VALUES
  ('c0000004-0000-0000-0000-000000000001', 'Cabresto Nylon', 'selaria-selaria-cabresto-e-cabos-cabresto-nylon', 'b0000001-0000-0000-0000-000000000009', 1),
  ('c0000004-0000-0000-0000-000000000002', 'Cabresto Personalizado', 'selaria-selaria-cabresto-e-cabos-cabresto-personalizado', 'b0000001-0000-0000-0000-000000000009', 2),
  ('c0000004-0000-0000-0000-000000000003', 'Cabos', 'selaria-selaria-cabresto-e-cabos-cabos', 'b0000001-0000-0000-0000-000000000009', 3);

-- MANTAS & PROTEÇÃO > Subcategorias
INSERT INTO categories (id, name, slug, parent_id, display_order) VALUES
  ('b0000002-0000-0000-0000-000000000001', 'Cloches', 'mantas-protecao-cloches', 'a0000001-0000-0000-0000-000000000002', 1),
  ('b0000002-0000-0000-0000-000000000002', 'Ligas', 'mantas-e-protecao-para-cavalo-ligas', 'a0000001-0000-0000-0000-000000000002', 2),
  ('b0000002-0000-0000-0000-000000000003', 'Mantas', 'mantas-e-protecao-para-cavalo-mantas', 'a0000001-0000-0000-0000-000000000002', 3),
  ('b0000002-0000-0000-0000-000000000004', 'Kits Cloche + Caneleiras', 'mantas-e-protecao-para-cavalo-kits-cloche-caneleiras', 'a0000001-0000-0000-0000-000000000002', 4),
  ('b0000002-0000-0000-0000-000000000005', 'Capas de Frio', 'mantas-e-protecao-para-cavalo-capas-de-frio', 'a0000001-0000-0000-0000-000000000002', 5),
  ('b0000002-0000-0000-0000-000000000006', 'Caneleiras Dianteiras', 'mantas-protecao-caneleiras-dianteiras', 'a0000001-0000-0000-0000-000000000002', 6),
  ('b0000002-0000-0000-0000-000000000007', 'Ice Boot', 'mantas-protecoes-ice-boot', 'a0000001-0000-0000-0000-000000000002', 7),
  ('b0000002-0000-0000-0000-000000000008', 'Protetor de Viagem', 'mantas-e-protecao-para-cavalo-protetor-de-viagem', 'a0000001-0000-0000-0000-000000000002', 8),
  ('b0000002-0000-0000-0000-000000000009', 'Caneleiras Traseiras', 'mantas-e-protecao-para-cavalo-caneleiras-traseiras', 'a0000001-0000-0000-0000-000000000002', 9),
  ('b0000002-0000-0000-0000-000000000010', 'Máscara', 'mantas-e-protecao-para-cavalo-mascara', 'a0000001-0000-0000-0000-000000000002', 10);

-- MANTAS > Mantas > Sub-subcategorias
INSERT INTO categories (id, name, slug, parent_id, display_order) VALUES
  ('c0000005-0000-0000-0000-000000000001', 'Mantas Classic Equine', 'mantas-protecao-mantas-protecao-mantas-mantas-classic-equine', 'b0000002-0000-0000-0000-000000000003', 1),
  ('c0000005-0000-0000-0000-000000000002', 'Mantas Boots Horse', 'mantas-protecao-mantas-protecao-mantas-mantas-boots-horse', 'b0000002-0000-0000-0000-000000000003', 2),
  ('c0000005-0000-0000-0000-000000000003', 'Mantas Combat', 'mantas-e-protecao-para-cavalo-mantas-e-protecao-para-cavalo-mantas-mantas-combat', 'b0000002-0000-0000-0000-000000000003', 3);

-- VESTUÁRIO > Subcategorias
INSERT INTO categories (id, name, slug, parent_id, display_order) VALUES
  ('b0000003-0000-0000-0000-000000000001', 'Camisetas', 'vestuario-camisetas', 'a0000001-0000-0000-0000-000000000003', 1),
  ('b0000003-0000-0000-0000-000000000002', 'Acessório', 'vestuario-acessorio', 'a0000001-0000-0000-0000-000000000003', 2),
  ('b0000003-0000-0000-0000-000000000003', 'Bonés', 'vestuario-bones', 'a0000001-0000-0000-0000-000000000003', 3),
  ('b0000003-0000-0000-0000-000000000004', 'Calça Masculina', 'vestuario-calca-masculina', 'a0000001-0000-0000-0000-000000000003', 4);

-- BOTAS > Subcategorias
INSERT INTO categories (id, name, slug, parent_id, display_order) VALUES
  ('b0000004-0000-0000-0000-000000000001', 'Botas Masculinas', 'botas-masculinas', 'a0000001-0000-0000-0000-000000000004', 1);

-- LINHA PET > Subcategorias
INSERT INTO categories (id, name, slug, parent_id, display_order) VALUES
  ('b0000005-0000-0000-0000-000000000001', 'Home', 'linha-pet-home', 'a0000001-0000-0000-0000-000000000005', 1);

-- PROMOÇÕES > Subcategorias
INSERT INTO categories (id, name, slug, parent_id, display_order) VALUES
  ('b0000008-0000-0000-0000-000000000001', '5% Desconto', 'promocoes-5-desconto', 'a0000001-0000-0000-0000-000000000008', 1),
  ('b0000008-0000-0000-0000-000000000002', 'Black Equitech', 'promocoes-black-equitech', 'a0000001-0000-0000-0000-000000000008', 2);

-- Also clean import jobs
DELETE FROM import_jobs;
