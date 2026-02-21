

# Restaurar Conexao com o Banco de Dados Original

## Problema
O projeto foi conectado a um novo projeto Supabase "Cavalo" (xqhravgjywrttvjynvqw) que esta vazio -- sem tabelas, sem produtos, sem categorias. O banco de dados original (zugcumtokvyszishwcwh) que contem todos os produtos, categorias, pedidos e demais dados nao esta mais sendo usado.

## Solucao Recomendada
Restaurar a conexao com o banco de dados original que contem todos os dados da loja.

### Alteracoes necessarias:

1. **Atualizar `src/integrations/supabase/client.ts`** - Trocar a URL e chave do Supabase de volta para o projeto original:
   - URL: `https://zugcumtokvyszishwcwh.supabase.co`
   - Anon Key: a chave original do projeto zugcumtokvyszishwcwh

2. **Atualizar `.env`** - Atualizar as variaveis de ambiente para apontar ao projeto original:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`

3. **Atualizar `supabase/config.toml`** - Restaurar o project_id para `zugcumtokvyszishwcwh`

4. **Restaurar `src/integrations/supabase/types.ts`** - O arquivo de tipos precisa conter as definicoes das tabelas do banco original (products, categories, orders, banners, etc.) para que o TypeScript funcione corretamente e os erros de build sejam resolvidos.

## Resultado Esperado
- Todos os produtos voltarao a aparecer na loja
- Todos os erros de build serao resolvidos (os erros de tipo "never" sao causados pelo types.ts vazio)
- Categorias, pedidos, banners e demais dados voltarao a funcionar

## Nota Importante
Se voce quiser que o projeto "Cavalo" tambem use os mesmos dados, a abordagem correta e criar as tabelas nele e migrar os dados, ou usar uma API/edge function para acessar o banco original. Simplesmente conectar um projeto Supabase vazio nao copia os dados automaticamente.

