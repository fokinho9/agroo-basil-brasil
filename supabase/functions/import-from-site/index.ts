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
  "Em 'colors' extraia todas as cores/opções de cor disponíveis para o produto. " +
  "Em 'sizes' extraia todos os tamanhos disponíveis para o produto (ex: ['P', 'M', 'G', 'GG'] ou ['34', '36', '38']).";

const MAX_RUNTIME_MS = 50000;

interface ProductLog {
  url: string;
  name: string | null;
  price: number | null;
  status: 'success' | 'error' | 'skipped';
  productId: string | null;
  message: string;
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
      formats: ['json'],
      jsonOptions: { schema: productSchema, prompt: SCRAPE_PROMPT },
      onlyMainContent: true,
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
  return { data: extracted };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function findOrCreateCategory(
  supabase: any,
  categoryNames: string[],
  categoriesCache: Map<string, string>
): Promise<string | null> {
  if (!categoryNames || categoryNames.length === 0) return null;

  // Try to find the most specific (last) category first
  for (let i = categoryNames.length - 1; i >= 0; i--) {
    const name = categoryNames[i].trim();
    if (!name) continue;

    const cacheKey = name.toLowerCase();
    if (categoriesCache.has(cacheKey)) {
      return categoriesCache.get(cacheKey)!;
    }

    // Search by name (case insensitive)
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

  // If no category found, create the hierarchy
  let parentId: string | null = null;
  let lastId: string | null = null;

  for (const name of categoryNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;

    const cacheKey = trimmed.toLowerCase();
    if (categoriesCache.has(cacheKey)) {
      parentId = categoriesCache.get(cacheKey)!;
      lastId = parentId;
      continue;
    }

    // Check if exists
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

    // Create it
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
    console.log(`📁 Created category: ${trimmed} (parent: ${parentId})`);
  }

  return lastId;
}

function buildVariants(colors: string[], sizes: string[]): any[] {
  const variants: any[] = [];

  if (colors.length > 0 && sizes.length > 0) {
    for (const color of colors) {
      for (const size of sizes) {
        variants.push({ color, size });
      }
    }
  } else if (colors.length > 0) {
    for (const color of colors) {
      variants.push({ color });
    }
  } else if (sizes.length > 0) {
    for (const size of sizes) {
      variants.push({ size });
    }
  }

  return variants;
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
          results: { skipped: 0, logs: [{ url: config.siteUrl, name: null, price: null, status: 'error', productId: null, message: 'Falha ao mapear o site' }] },
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
          results: { skipped: 0, logs: [] },
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

    const startTime = Date.now();
    const categoriesCache = new Map<string, string>();

    const updateJob = async () => {
      await supabase.from('import_jobs').update({
        processed_items: processed,
        success_count: success,
        error_count: errors,
        results: { skipped, logs },
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
            results: { skipped, logs },
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

        // Check duplicate by name
        const { data: existing } = await supabase
          .from('products').select('id').ilike('name', name).limit(1);

        if (existing && existing.length > 0) {
          logs.push({ url, name, price: product.price, status: 'skipped', productId: existing[0].id, message: 'Produto duplicado' });
          skipped++;
          processed++;
          await updateJob();
          continue;
        }

        const images = (product.images || []).filter((img: string) => img?.startsWith('http'));
        const originalPrice = product.original_price && product.original_price > product.price
          ? product.original_price : null;

        // Auto-detect category from scraped data
        let categoryId = forcedCategoryId || null;
        if (!categoryId && product.categories && product.categories.length > 0) {
          categoryId = await findOrCreateCategory(supabase, product.categories, categoriesCache);
        }

        // Build variants from colors and sizes
        const colors = (product.colors || []).filter((c: string) => c && c.trim());
        const sizes = (product.sizes || []).filter((s: string) => s && s.trim());
        const variants = buildVariants(colors, sizes);

        const { data: inserted, error: insertError } = await supabase.from('products').insert({
          name: name.length > 150 ? name.substring(0, 147) + '...' : name,
          description: product.description || null,
          price: product.price,
          original_price: originalPrice,
          image_url: images.length > 0 ? images[0] : null,
          images: images.length > 0 ? images : null,
          category_id: categoryId,
          stock: product.stock ?? 10,
          active: true,
          featured: false,
          variants: variants.length > 0 ? variants : [],
          source_url: url,
        }).select('id').single();

        if (insertError) {
          console.error(`Insert error for ${name}:`, insertError.message);
          logs.push({ url, name, price: product.price, status: 'error', productId: null, message: `Erro ao inserir: ${insertError.message}` });
          errors++;
        } else {
          const variantInfo = variants.length > 0 ? ` | ${colors.length} cores, ${sizes.length} tamanhos` : '';
          console.log(`✅ Imported: ${name} - R$${product.price}${variantInfo}`);
          logs.push({ url, name, price: product.price, status: 'success', productId: inserted?.id || null, message: `Importado com sucesso${variantInfo}` });
          success++;
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

    // All done!
    await supabase.from('import_jobs').update({
      status: 'completed', processed_items: processed, success_count: success,
      error_count: errors, results: { skipped, logs }, completed_at: new Date().toISOString(),
    }).eq('id', jobId);

    console.log(`Import complete: ${success} imported, ${errors} errors, ${skipped} skipped`);

    return new Response(JSON.stringify({ success: true, processed, successCount: success, errorCount: errors, skipped }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
