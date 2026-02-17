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
  },
  required: ["title", "price", "images"],
};

const SCRAPE_PROMPT =
  "Extraia os dados do produto desta página. " +
  "O título é o nome do produto. " +
  "A descrição começa na seção 'Descrição' e termina antes de 'Avalie este produto' - extraia TODO o conteúdo entre esses dois pontos incluindo características, benefícios, tabela de medidas e informações adicionais. " +
  "O preço à vista vai em price, o preço original sem desconto em original_price. " +
  "Extraia TODAS as URLs de imagem do produto (não ícones ou logos do site). " +
  "SKU se houver, estoque se houver, e categorias.";

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
      jsonOptions: {
        schema: productSchema,
        prompt: SCRAPE_PROMPT,
      },
      onlyMainContent: true,
      timeout: 30000,
      waitFor: 2000,
    }),
  });

  console.log(`Scrape response for ${url}: status=${response.status}`);

  if (response.status === 402) return { error: 'credits_exhausted' };
  if (response.status === 429) return { error: 'rate_limited' };
  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Scrape HTTP error: ${errorBody}`);
    return { error: `http_${response.status}` };
  }

  const data = await response.json();
  console.log(`Scrape data keys: ${JSON.stringify(Object.keys(data?.data || data || {}))}`);
  const extracted = data?.data?.extract || data?.extract || data?.data?.json || data?.json || null;
  return { data: extracted };
}

interface ProductLog {
  url: string;
  name: string | null;
  price: number | null;
  status: 'success' | 'error' | 'skipped';
  productId: string | null;
  message: string;
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

    const config = job.config as { siteUrl: string; categoryId: string; productUrls?: string[] };
    const categoryId = config.categoryId;
    let productUrls = config.productUrls || [];

    await supabase.from('import_jobs').update({ status: 'running' }).eq('id', jobId);

    // Step 1: Map site if no URLs provided
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
          results: { logs: [{ url: config.siteUrl, name: null, price: null, status: 'error', productId: null, message: 'Falha ao mapear o site' }] },
        }).eq('id', jobId);
        return new Response(JSON.stringify({ error: 'Failed to map site' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const allProductUrls = (mapData.links || []).filter((url: string) =>
        url.includes('/produto/') && !url.includes('/marca/')
      );

      // Check previously imported URLs from past jobs - use results logs (actual processed URLs)
      const { data: pastJobs } = await supabase
        .from('import_jobs')
        .select('results')
        .eq('type', 'site-import')
        .neq('id', jobId)
        .not('results', 'is', null);
      const pastUrls = new Set<string>();
      for (const j of pastJobs || []) {
        const logs = (j.results as any)?.logs || [];
        for (const log of logs) {
          if (log.url) pastUrls.add(log.url);
        }
      }

      // Also check products already in DB by checking existing product names
      // Filter out already-processed URLs and take next batch
      const newUrls = allProductUrls.filter((url: string) => !pastUrls.has(url));
      productUrls = newUrls.slice(0, 10);
      console.log(`Found ${allProductUrls.length} total, ${pastUrls.size} past URLs, ${newUrls.length} new, processing ${productUrls.length}`);

      if (productUrls.length === 0) {
        await supabase.from('import_jobs').update({
          status: 'completed',
          total_items: 0,
          processed_items: 0,
          results: { skipped: 0, logs: [{ url: config.siteUrl, name: null, price: null, status: 'error', productId: null, message: `Todos os ${allProductUrls.length} produtos já foram processados em importações anteriores` }] },
          completed_at: new Date().toISOString(),
        }).eq('id', jobId);
        return new Response(JSON.stringify({ success: true, processed: 0, message: 'All URLs already processed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('import_jobs').update({
        total_items: productUrls.length,
        config: { ...config, productUrls },
      }).eq('id', jobId);
    }

    // Step 2: Scrape each product
    let processed = 0, success = 0, errors = 0, skipped = 0;
    const logs: ProductLog[] = [];

    const updateJob = async () => {
      await supabase.from('import_jobs').update({
        processed_items: processed,
        success_count: success,
        error_count: errors,
        results: { skipped, logs },
      }).eq('id', jobId);
    };

    for (const url of productUrls) {
      console.log(`[${processed + 1}/${productUrls.length}] Scraping: ${url}`);
      try {
        const result = await scrapeProductJson(url, firecrawlApiKey);

        if (result.error === 'credits_exhausted') {
          logs.push({ url, name: null, price: null, status: 'error', productId: null, message: 'Créditos Firecrawl esgotados' });
          await supabase.from('import_jobs').update({
            status: 'failed', error_message: 'Créditos Firecrawl esgotados',
            processed_items: processed, success_count: success, error_count: errors,
            results: { skipped, logs },
          }).eq('id', jobId);
          break;
        }

        if (result.error === 'rate_limited') {
          logs.push({ url, name: null, price: null, status: 'error', productId: null, message: 'Rate limited, aguardando...' });
          await updateJob();
          await new Promise(r => setTimeout(r, 10000));
          continue;
        }

        if (result.error || !result.data) {
          logs.push({ url, name: null, price: null, status: 'error', productId: null, message: `Erro no scrape: ${result.error || 'sem dados'}` });
          errors++; processed++;
          await updateJob();
          continue;
        }

        const product = result.data;
        const name = product.title;

        if (!name || name.length < 3 || typeof product.price !== 'number') {
          logs.push({ url, name: name || null, price: product.price || null, status: 'error', productId: null, message: 'Dados inválidos (nome ou preço ausente)' });
          errors++; processed++;
          await updateJob();
          continue;
        }

        // Check duplicate
        const { data: existing } = await supabase
          .from('products').select('id').ilike('name', name).limit(1);

        if (existing && existing.length > 0) {
          logs.push({ url, name, price: product.price, status: 'skipped', productId: existing[0].id, message: 'Produto duplicado' });
          skipped++; processed++;
          await updateJob();
          continue;
        }

        const images = (product.images || []).filter((img: string) => img?.startsWith('http'));
        const originalPrice = product.original_price && product.original_price > product.price
          ? product.original_price : null;

        const { data: inserted, error: insertError } = await supabase.from('products').insert({
          name: name.length > 150 ? name.substring(0, 147) + '...' : name,
          description: product.description || null,
          price: product.price,
          original_price: originalPrice,
          image_url: images.length > 0 ? images[0] : null,
          images: images.length > 0 ? images : null,
          category_id: categoryId || null,
          stock: product.stock ?? 10,
          active: true,
          featured: false,
        }).select('id').single();

        if (insertError) {
          console.error(`Insert error for ${name}:`, insertError.message);
          logs.push({ url, name, price: product.price, status: 'error', productId: null, message: `Erro ao inserir: ${insertError.message}` });
          errors++;
        } else {
          console.log(`✅ Imported: ${name} - R$${product.price}`);
          logs.push({ url, name, price: product.price, status: 'success', productId: inserted?.id || null, message: 'Importado com sucesso' });
          success++;
        }
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
        logs.push({ url, name: null, price: null, status: 'error', productId: null, message: `Erro: ${String(error)}` });
        errors++;
      }

      processed++;
      await updateJob();
      await new Promise(r => setTimeout(r, 500));
    }

    await supabase.from('import_jobs').update({
      status: 'completed', processed_items: processed, success_count: success,
      error_count: errors, results: { skipped, logs }, completed_at: new Date().toISOString(),
    }).eq('id', jobId);

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
