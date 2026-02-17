-- Add parent_id and display_order columns for subcategory support
ALTER TABLE categories ADD COLUMN parent_id uuid REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE categories ADD COLUMN display_order integer DEFAULT 0;

-- Create index for faster hierarchy queries
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- Insert main categories
INSERT INTO categories (name, slug, display_order) VALUES
  ('Selaria', 'selaria', 1),
  ('Mantas e Proteção', 'mantas-e-protecao-para-cavalo', 2),
  ('Vestuário', 'vestuario', 3),
  ('Botas', 'botas', 4),
  ('Linha Pet', 'linha-pet', 5),
  ('Promoções', 'promocoes', 6),
  ('Equipamentos para Cavalos', 'equipamentos-para-cavalos', 7);

-- Selaria subcategories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Cabeçadas', 'selaria-cabecadas', (SELECT id FROM categories WHERE slug = 'selaria'), 1),
  ('Barrigueira', 'selaria-barrigueira', (SELECT id FROM categories WHERE slug = 'selaria'), 2),
  ('Escovas para Cavalos', 'selaria-escovas-para-cavalos', (SELECT id FROM categories WHERE slug = 'selaria'), 3),
  ('Rédeas e Chicotes', 'selaria-redeas-e-chicotes', (SELECT id FROM categories WHERE slug = 'selaria'), 4),
  ('Cordas', 'selaria-cordas', (SELECT id FROM categories WHERE slug = 'selaria'), 5),
  ('Freios e Bridões', 'selaria-freios-e-bridoes', (SELECT id FROM categories WHERE slug = 'selaria'), 6),
  ('Cabresto e Cabos', 'selaria-cabresto-e-cabos', (SELECT id FROM categories WHERE slug = 'selaria'), 7),
  ('Acessório para Cavaleiro', 'selaria-acessorio-p-cavaleiro', (SELECT id FROM categories WHERE slug = 'selaria'), 8),
  ('Gamarras', 'selaria-gamarras', (SELECT id FROM categories WHERE slug = 'selaria'), 9),
  ('Esporas e Correias', 'selaria-esporas-e-correias', (SELECT id FROM categories WHERE slug = 'selaria'), 10),
  ('Selas e Acessórios', 'selaria-selas-e-acessorios', (SELECT id FROM categories WHERE slug = 'selaria'), 11);

-- Selas e Acessórios sub-subcategories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Pochete para Sela', 'selaria-pochete-p-sela', (SELECT id FROM categories WHERE slug = 'selaria-selas-e-acessorios'), 1),
  ('Lategos', 'selaria-lategos', (SELECT id FROM categories WHERE slug = 'selaria-selas-e-acessorios'), 2),
  ('Sela Tambor', 'selaria-sela-tambor', (SELECT id FROM categories WHERE slug = 'selaria-selas-e-acessorios'), 3),
  ('Sela em Neoprene', 'selaria-sela-em-neoprene', (SELECT id FROM categories WHERE slug = 'selaria-selas-e-acessorios'), 4),
  ('Bolsas', 'selaria-bolsas', (SELECT id FROM categories WHERE slug = 'selaria-selas-e-acessorios'), 5),
  ('Peitoral', 'selaria-peitoral', (SELECT id FROM categories WHERE slug = 'selaria-selas-e-acessorios'), 6);

-- Barrigueira subcategories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Barrigueira Airflex', 'selaria-barrigueira-airflex', (SELECT id FROM categories WHERE slug = 'selaria-barrigueira'), 1),
  ('Barrigueira Neoprene', 'selaria-barrigueira-neoprene', (SELECT id FROM categories WHERE slug = 'selaria-barrigueira'), 2),
  ('Barrigueira Importada', 'selaria-barrigueira-importada', (SELECT id FROM categories WHERE slug = 'selaria-barrigueira'), 3);

-- Rédeas e Chicotes subcategories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Rédeas', 'selaria-redeas', (SELECT id FROM categories WHERE slug = 'selaria-redeas-e-chicotes'), 1),
  ('Chicotes', 'selaria-chicotes', (SELECT id FROM categories WHERE slug = 'selaria-redeas-e-chicotes'), 2);

-- Cabresto e Cabos subcategories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Cabresto Nylon', 'selaria-cabresto-nylon', (SELECT id FROM categories WHERE slug = 'selaria-cabresto-e-cabos'), 1),
  ('Cabos', 'selaria-cabos', (SELECT id FROM categories WHERE slug = 'selaria-cabresto-e-cabos'), 2),
  ('Cabresto Personalizado', 'selaria-cabresto-personalizado', (SELECT id FROM categories WHERE slug = 'selaria-cabresto-e-cabos'), 3);

-- Mantas e Proteção subcategories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Cloches', 'mantas-protecao-cloches', (SELECT id FROM categories WHERE slug = 'mantas-e-protecao-para-cavalo'), 1),
  ('Ligas', 'mantas-ligas', (SELECT id FROM categories WHERE slug = 'mantas-e-protecao-para-cavalo'), 2),
  ('Mantas', 'mantas-mantas', (SELECT id FROM categories WHERE slug = 'mantas-e-protecao-para-cavalo'), 3),
  ('Kits Cloche e Caneleiras', 'mantas-kits-cloche-caneleiras', (SELECT id FROM categories WHERE slug = 'mantas-e-protecao-para-cavalo'), 4),
  ('Capas de Frio', 'mantas-capas-de-frio', (SELECT id FROM categories WHERE slug = 'mantas-e-protecao-para-cavalo'), 5),
  ('Caneleiras Dianteiras', 'mantas-caneleiras-dianteiras', (SELECT id FROM categories WHERE slug = 'mantas-e-protecao-para-cavalo'), 6),
  ('Ice Boot', 'mantas-ice-boot', (SELECT id FROM categories WHERE slug = 'mantas-e-protecao-para-cavalo'), 7),
  ('Protetor de Viagem', 'mantas-protetor-de-viagem', (SELECT id FROM categories WHERE slug = 'mantas-e-protecao-para-cavalo'), 8),
  ('Caneleiras Traseiras', 'mantas-caneleiras-traseiras', (SELECT id FROM categories WHERE slug = 'mantas-e-protecao-para-cavalo'), 9),
  ('Máscara', 'mantas-mascara', (SELECT id FROM categories WHERE slug = 'mantas-e-protecao-para-cavalo'), 10);

-- Mantas sub-subcategories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Mantas Classic Equine', 'mantas-classic-equine', (SELECT id FROM categories WHERE slug = 'mantas-mantas'), 1),
  ('Mantas Boots Horse', 'mantas-boots-horse', (SELECT id FROM categories WHERE slug = 'mantas-mantas'), 2),
  ('Mantas Combat', 'mantas-combat', (SELECT id FROM categories WHERE slug = 'mantas-mantas'), 3);

-- Vestuário subcategories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Camisetas', 'vestuario-camisetas', (SELECT id FROM categories WHERE slug = 'vestuario'), 1),
  ('Acessórios', 'vestuario-acessorios', (SELECT id FROM categories WHERE slug = 'vestuario'), 2),
  ('Bonés', 'vestuario-bones', (SELECT id FROM categories WHERE slug = 'vestuario'), 3),
  ('Calça Masculina', 'vestuario-calca-masculina', (SELECT id FROM categories WHERE slug = 'vestuario'), 4);

-- Botas subcategories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Botas Masculinas', 'botas-masculinas', (SELECT id FROM categories WHERE slug = 'botas'), 1);

-- Linha Pet subcategories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Linha Pet Home', 'linha-pet-home', (SELECT id FROM categories WHERE slug = 'linha-pet'), 1);

-- Promoções subcategories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('5% Desconto', 'promocoes-5-desconto', (SELECT id FROM categories WHERE slug = 'promocoes'), 1),
  ('Black Equitech', 'promocoes-black-equitech', (SELECT id FROM categories WHERE slug = 'promocoes'), 2);