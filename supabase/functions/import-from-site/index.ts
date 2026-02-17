import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const productSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    price: { type: "number" },
    original_price: { type: ["number", "null"] },
    images: { type: "array", items: { type: "string" } },
    sku: { type: ["string", "null"] },
    stock: { type: ["number", "null"] },
    categories: { type: "array", items: { type: "string" } },
    colors: { type: "array", items: { type: "string" } },
    sizes: { type: "array", items: { type: "string" } },
    current_color: { type: ["string", "null"] },
  },
  required: ["title", "price", "images"],
};

const SCRAPE_PROMPT =
  "Extraia os dados do produto desta página. " +
  "O título é o nome do produto. " +
  "A descrição começa na seção 'Descrição' e termina antes de 'Avalie este produto' - extraia TODO o conteúdo entre esses dois pontos incluindo características, benefícios, tabela de medidas e informações adicionais. " +
  "O preço à vista vai em price, o preço original sem desconto em original_price. " +
  "Extraia TODAS as URLs de imagem do produto (não ícones ou logos do site). " +
  "SKU se houver, estoque se houver. " +
  "Em 'categories' extraia a hierarquia de categorias/breadcrumb do produto (ex: ['Selaria', 'Mantas']). " +
  "Em 'colors' extraia todas as cores/opções de cor disponíveis para o produto (listadas na página como variações). " +
  "Em 'sizes' extraia todos os tamanhos disponíveis para o produto (ex: ['P', 'M', 'G', 'GG'] ou ['34', '36', '38']). " +
  "Em 'current_color' coloque a cor específica DESTA variação do produto que está sendo exibida nesta página (ex: 'Vermelho', 'Azul').";

const MAX_RUNTIME_MS = 50000;

const KNOWN_COLORS = [
  'preto', 'branco', 'vermelho', 'azul', 'verde', 'amarelo', 'roxo', 'rosa',
  'laranja', 'marrom', 'bege', 'cinza', 'dourado', 'prata', 'caramelo',
  'vinho', 'bordo', 'bordô', 'nude', 'creme', 'areia', 'terracota',
  'coral', 'salmão', 'salmon', 'turquesa', 'lilás', 'lilas', 'violeta',
  'mostarda', 'oliva', 'caqui', 'grafite', 'gelo', 'off white', 'off-white',
  'chocolate', 'mel', 'camel', 'camelo', 'ferrugem', 'ocre', 'petróleo',
  'petroleo', 'esmeralda', 'safira', 'rubi', 'âmbar', 'ambar',
  'black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'pink',
  'orange', 'brown', 'gray', 'grey', 'gold', 'silver',
];

interface ProductLog {
  url: string;
  name: string | null;
  price: number | null;
  status: 'success' | 'error' | 'skipped' | 'merged';
  productId: string | null;
  message: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getBaseName(title: string): string {
  let base = title.trim();
  const normalized = base.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Sort colors by length desc so longer matches first (e.g. "off white" before "white")
  const sorted = [...KNOWN_COLORS].sort((a, b) => b.length - a.length);

  for (const color of sorted) {
    const colorNorm = color.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Match color at end or surrounded by spaces/hyphens
    const regex = new RegExp(`[\\s\\-]+${colorNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$|-|\\d)*$`, 'i');
    if (regex.test(normalized)) {
      // Remove from original string at the same position
      const idx = normalized.search(regex);
      if (idx > 0) {
        base = base.substring(0, idx).trim().replace(/[-\s]+$/, '');
      }
      break;
    }
  }

  return base;
}

function parseBreadcrumbFromHtml(html: string): string[] {
  const categories: string[] = [];
  // Match breadcrumb items: <span itemprop="name">CategoryName</span>
  const regex = /itemprop="name">([^<]+)<\/span>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const name = match[1].trim();
    if (name && name.toLowerCase() !== 'home') {
      categories.push(name);
    }
  }
  // Remove last item (product name itself) if we have more than 1
  if (categories.length > 1) {
    categories.pop();
  }
  return categories;
}

async function scrapeProductJson(url: string, apiKey: string) {
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ['json', 'rawHtml'],
      jsonOptions: { schema: productSchema, prompt: SCRAPE_PROMPT },
      onlyMainContent: false,
      timeout: 30000,
      waitFor: 2000,
    }),
  });

  if (response.status === 402) return { error: 'credits_exhausted' };
  if (response.status === 429) return { error: 'rate_limited' };
  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Scrape HTTP error: ${errorBody}`);
    return { error: `http_${response.status}` };
  }

  const data = await response.json();
  const extracted = data?.data?.extract || data?.extract || data?.data?.json || data?.json || null;
  const rawHtml = data?.data?.rawHtml || data?.rawHtml || '';

  // Parse breadcrumb from HTML for reliable category extraction
  const breadcrumbCategories = parseBreadcrumbFromHtml(rawHtml);
  if (extracted && breadcrumbCategories.length > 0) {
    extracted.categories = breadcrumbCategories;
    console.log(`📂 Breadcrumb categories: ${breadcrumbCategories.join(' > ')}`);
  }

  return { data: extracted };
}

async function findOrCreateCategory(
  supabase: any,
  categoryNames: string[],
  categoriesCache: Map<string, string>
): Promise<string | null> {
  if (!categoryNames || categoryNames.length === 0) return null;

  for (let i = categoryNames.length - 1; i >= 0; i--) {
    const name = categoryNames[i].trim();
    if (!name || name.toLowerCase() === 'home') continue;

    const cacheKey = name.toLowerCase();
    if (categoriesCache.has(cacheKey)) {
      return categoriesCache.get(cacheKey)!;
    }

    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', name)
      .limit(1);

    if (existing && existing.length > 0) {
      categoriesCache.set(cacheKey, existing[0].id);
      return existing[0].id;
    }
  }

  let parentId: string | null = null;
  let lastId: string | null = null;

  for (const name of categoryNames) {
    const trimmed = name.trim();
    if (!trimmed || trimmed.toLowerCase() === 'home') continue;

    const cacheKey = trimmed.toLowerCase();
    if (categoriesCache.has(cacheKey)) {
      parentId = categoriesCache.get(cacheKey)!;
      lastId = parentId;
      continue;
    }

    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', trimmed)
      .limit(1);

    if (existing && existing.length > 0) {
      parentId = existing[0].id;
      lastId = parentId;
      categoriesCache.set(cacheKey, parentId);
      continue;
    }

    const slug = slugify(trimmed);
    const { data: created, error } = await supabase
      .from('categories')
      .insert({ name: trimmed, slug, parent_id: parentId })
      .select('id')
      .single();

    if (error) {
      console.error(`Error creating category "${trimmed}":`, error.message);
      break;
    }

    parentId = created.id;
    lastId = created.id;
    categoriesCache.set(cacheKey, created.id);
    console.log(`📁 Created category: ${trimmed}`);
  }

  return lastId;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlApiKey) {
      return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { jobId } = await req.json();

    if (!jobId) {
      return new Response(JSON.stringify({ error: 'jobId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: job, error: jobError } = await supabase
      .from('import_jobs').select('*').eq('id', jobId).single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (job.status === 'failed' || job.status === 'completed') {
      return new Response(JSON.stringify({ error: 'Job already finished', status: job.status }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const config = job.config as { siteUrl: string; categoryId: string; productUrls?: string[] };
    const forcedCategoryId = config.categoryId;
    let productUrls = config.productUrls || [];

    await supabase.from('import_jobs').update({ status: 'running' }).eq('id', jobId);

    // Step 1: Map site if no URLs stored yet
    if (productUrls.length === 0) {
      console.log('Mapping site:', config.siteUrl);
      const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firecrawlApiKey}`,
        },
        body: JSON.stringify({ url: config.siteUrl, limit: 5000, search: 'produto' }),
      });

      const mapData = await mapResponse.json();
      if (!mapData.success && !mapData.links) {
        await supabase.from('import_jobs').update({
          status: 'failed',
          error_message: 'Failed to map site',
          results: { skipped: 0, merged: 0, logs: [{ url: config.siteUrl, name: null, price: null, status: 'error', productId: null, message: 'Falha ao mapear o site' }] },
        }).eq('id', jobId);
        return new Response(JSON.stringify({ error: 'Failed to map site' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const urlSet = new Set<string>();
      for (const url of (mapData.links || [])) {
        if (url.includes('/produto/') && !url.includes('/marca/')) {
          const normalized = url.endsWith('/') ? url.slice(0, -1) : url;
          urlSet.add(normalized);
        }
      }
      productUrls = Array.from(urlSet);

      console.log(`Mapped ${productUrls.length} unique product URLs`);

      if (productUrls.length === 0) {
        await supabase.from('import_jobs').update({
          status: 'completed', total_items: 0, processed_items: 0,
          results: { skipped: 0, merged: 0, logs: [] },
          completed_at: new Date().toISOString(),
        }).eq('id', jobId);
        return new Response(JSON.stringify({ success: true, processed: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('import_jobs').update({
        total_items: productUrls.length,
        config: { ...config, productUrls },
      }).eq('id', jobId);
    }

    // Step 2: Determine already processed URLs from logs
    const existingLogs: ProductLog[] = ((job.results as any)?.logs) || [];
    const processedUrls = new Set(existingLogs.map((l: ProductLog) => l.url));

    let logs = [...existingLogs];
    let processed = job.processed_items || 0;
    let success = job.success_count || 0;
    let errors = job.error_count || 0;
    let skipped = (job.results as any)?.skipped || 0;
    let merged = (job.results as any)?.merged || 0;

    const startTime = Date.now();
    const categoriesCache = new Map<string, string>();
    // Cache: baseName -> productId for merging variants
    const baseNameCache = new Map<string, string>();

    const updateJob = async () => {
      await supabase.from('import_jobs').update({
        processed_items: processed,
        success_count: success,
        error_count: errors,
        results: { skipped, merged, logs },
      }).eq('id', jobId);
    };

    let shouldContinue = false;

    for (const url of productUrls) {
      const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      if (processedUrls.has(url) || processedUrls.has(normalizedUrl) || processedUrls.has(url + '/')) {
        continue;
      }

      if (processed > 0 && processed % 5 === 0) {
        const { data: freshJob } = await supabase.from('import_jobs').select('status').eq('id', jobId).single();
        if (freshJob?.status === 'failed') {
          console.log('Job was cancelled, stopping');
          return new Response(JSON.stringify({ success: false, cancelled: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      if (Date.now() - startTime > MAX_RUNTIME_MS) {
        console.log(`Approaching timeout after ${processed} items, self-invoking to continue...`);
        await updateJob();
        shouldContinue = true;
        break;
      }

      console.log(`[${processed + 1}/${productUrls.length}] Scraping: ${url}`);

      try {
        const result = await scrapeProductJson(url, firecrawlApiKey);

        if (result.error === 'credits_exhausted') {
          logs.push({ url, name: null, price: null, status: 'error', productId: null, message: 'Créditos Firecrawl esgotados' });
          errors++;
          processed++;
          await supabase.from('import_jobs').update({
            status: 'failed', error_message: 'Créditos Firecrawl esgotados',
            processed_items: processed, success_count: success, error_count: errors,
            results: { skipped, merged, logs },
          }).eq('id', jobId);
          return new Response(JSON.stringify({ error: 'credits_exhausted' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (result.error === 'rate_limited') {
          logs.push({ url, name: null, price: null, status: 'error', productId: null, message: 'Rate limited, aguardando 10s...' });
          await updateJob();
          await new Promise(r => setTimeout(r, 10000));
          continue;
        }

        if (result.error || !result.data) {
          logs.push({ url, name: null, price: null, status: 'error', productId: null, message: `Erro no scrape: ${result.error || 'sem dados'}` });
          errors++;
          processed++;
          await updateJob();
          continue;
        }

        const product = result.data;
        const name = product.title;

        if (!name || name.length < 3 || typeof product.price !== 'number') {
          logs.push({ url, name: name || null, price: product.price || null, status: 'error', productId: null, message: 'Dados inválidos (nome ou preço ausente)' });
          errors++;
          processed++;
          await updateJob();
          continue;
        }

        const images = (product.images || []).filter((img: string) => img?.startsWith('http'));
        const currentColor = product.current_color?.trim() || null;
        const baseName = getBaseName(name);
        const baseNameKey = baseName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // Check if we already have a product with this base name (color variant)
        let existingProductId = baseNameCache.get(baseNameKey) || null;

        if (!existingProductId) {
          // Search DB for existing product with similar base name
          const { data: existing } = await supabase
            .from('products').select('id, name').ilike('name', `${baseName}%`).limit(5);

          if (existing && existing.length > 0) {
            // Find one whose base name matches
            for (const ex of existing) {
              const exBase = getBaseName(ex.name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              if (exBase === baseNameKey) {
                existingProductId = ex.id;
                baseNameCache.set(baseNameKey, ex.id);
                break;
              }
            }
          }
        }

        if (existingProductId) {
          // MERGE: add color variant and images to existing product
          const { data: existingProduct } = await supabase
            .from('products')
            .select('variants, images, image_url')
            .eq('id', existingProductId)
            .single();

          if (existingProduct) {
            const existingVariants: any[] = existingProduct.variants || [];
            const existingImages: string[] = existingProduct.images || [];

            // Add new color variant if we have a color
            if (currentColor) {
              const colorExists = existingVariants.some((v: any) =>
                v.color?.toLowerCase() === currentColor.toLowerCase()
              );
              if (!colorExists) {
                // Add variant with color and its images
                existingVariants.push({
                  color: currentColor,
                  image_url: images[0] || null,
                });
              }
            }

            // Merge images (deduplicate)
            const allImages = [...existingImages];
            for (const img of images) {
              if (!allImages.includes(img)) {
                allImages.push(img);
              }
            }

            // Also extract sizes from this page and merge
            const sizes = (product.sizes || []).filter((s: string) => s && s.trim());
            if (sizes.length > 0) {
              const existingSizes = new Set(existingVariants.filter((v: any) => v.size).map((v: any) => v.size));
              for (const size of sizes) {
                if (!existingSizes.has(size)) {
                  existingVariants.push({ size });
                  existingSizes.add(size);
                }
              }
            }

            await supabase.from('products').update({
              variants: existingVariants,
              images: allImages,
            }).eq('id', existingProductId);

            console.log(`🔗 Merged variant "${currentColor || 'unknown'}" into: ${baseName}`);
            logs.push({ url, name, price: product.price, status: 'merged', productId: existingProductId, message: `Variante "${currentColor || ''}" mesclada ao produto base` });
            merged++;
          }
        } else {
          // Check exact duplicate by name
          const { data: exactDup } = await supabase
            .from('products').select('id').ilike('name', name).limit(1);

          if (exactDup && exactDup.length > 0) {
            logs.push({ url, name, price: product.price, status: 'skipped', productId: exactDup[0].id, message: 'Produto duplicado' });
            skipped++;
            processed++;
            await updateJob();
            continue;
          }

          const originalPrice = product.original_price && product.original_price > product.price
            ? product.original_price : null;

          let categoryId = forcedCategoryId || null;
          if (!categoryId && product.categories && product.categories.length > 0) {
            const filteredCats = product.categories.filter((c: string) => c.toLowerCase() !== 'home');
            if (filteredCats.length > 0) {
              categoryId = await findOrCreateCategory(supabase, filteredCats, categoriesCache);
            }
          }

          // Build initial variants
          const colors = (product.colors || []).filter((c: string) => c && c.trim());
          const sizes = (product.sizes || []).filter((s: string) => s && s.trim());
          const variants: any[] = [];

          // Add current color as variant with image
          if (currentColor) {
            variants.push({ color: currentColor, image_url: images[0] || null });
          }

          // Add sizes
          for (const size of sizes) {
            variants.push({ size });
          }

          // Use base name (without color) as product name
          const productName = baseName.length > 3 ? baseName : name;

          const { data: inserted, error: insertError } = await supabase.from('products').insert({
            name: productName.length > 150 ? productName.substring(0, 147) + '...' : productName,
            description: product.description || null,
            price: product.price,
            original_price: originalPrice,
            image_url: images.length > 0 ? images[0] : null,
            images: images.length > 0 ? images : null,
            category_id: categoryId,
            stock: product.stock ?? 10,
            active: true,
            featured: false,
            variants: variants,
            source_url: url,
          }).select('id').single();

          if (insertError) {
            console.error(`Insert error for ${name}:`, insertError.message);
            logs.push({ url, name, price: product.price, status: 'error', productId: null, message: `Erro ao inserir: ${insertError.message}` });
            errors++;
          } else {
            baseNameCache.set(baseNameKey, inserted.id);
            const variantInfo = variants.length > 0 ? ` | ${variants.filter(v => v.color).length} cores, ${variants.filter(v => v.size).length} tamanhos` : '';
            console.log(`✅ Imported: ${productName} - R$${product.price}${variantInfo}`);
            logs.push({ url, name: productName, price: product.price, status: 'success', productId: inserted?.id || null, message: `Importado com sucesso${variantInfo}` });
            success++;
          }
        }
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
        logs.push({ url, name: null, price: null, status: 'error', productId: null, message: `Erro: ${String(error).substring(0, 200)}` });
        errors++;
      }

      processed++;
      processedUrls.add(url);
      await updateJob();
      await new Promise(r => setTimeout(r, 500));
    }

    if (shouldContinue) {
      console.log('Self-invoking to continue...');
      const selfUrl = `${supabaseUrl}/functions/v1/import-from-site`;
      fetch(selfUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ jobId }),
      }).catch(err => console.error('Self-invoke error:', err));

      return new Response(JSON.stringify({ continuing: true, processed, successCount: success }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase.from('import_jobs').update({
      status: 'completed', processed_items: processed, success_count: success,
      error_count: errors, results: { skipped, merged, logs }, completed_at: new Date().toISOString(),
    }).eq('id', jobId);

    console.log(`Import complete: ${success} imported, ${merged} merged, ${errors} errors, ${skipped} skipped`);

    return new Response(JSON.stringify({ success: true, processed, successCount: success, errorCount: errors, skipped, merged }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
