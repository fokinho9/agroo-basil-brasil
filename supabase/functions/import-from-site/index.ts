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
      formats: [
        { type: 'json', schema: productSchema, prompt: SCRAPE_PROMPT },
      ],
      onlyMainContent: true,
      timeout: 60000,
      waitFor: 8000,
    }),
  });

  if (response.status === 402) return { error: 'credits_exhausted' };
  if (response.status === 429) return { error: 'rate_limited' };
  if (!response.ok) return { error: `http_${response.status}` };

  const data = await response.json();
  const extracted = data?.data?.json || data?.json || null;
  return { data: extracted };
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
        await supabase.from('import_jobs').update({ status: 'failed', error_message: 'Failed to map site' }).eq('id', jobId);
        return new Response(JSON.stringify({ error: 'Failed to map site' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      productUrls = (mapData.links || []).filter((url: string) =>
        url.includes('/produto/') && !url.includes('/marca/')
      ).slice(0, 10); // Limit to 10 products per batch
      console.log(`Found ${productUrls.length} product URLs (limited to 10)`);

      await supabase.from('import_jobs').update({
        total_items: productUrls.length,
        config: { ...config, productUrls },
      }).eq('id', jobId);
    }

    // Step 2: Scrape each product using JSON extraction
    let processed = 0, success = 0, errors = 0, skipped = 0;

    for (const url of productUrls) {
      try {
        const result = await scrapeProductJson(url, firecrawlApiKey);

        if (result.error === 'credits_exhausted') {
          console.error('Firecrawl credits exhausted');
          await supabase.from('import_jobs').update({
            status: 'failed', error_message: 'Créditos Firecrawl esgotados',
            processed_items: processed, success_count: success, error_count: errors,
          }).eq('id', jobId);
          break;
        }

        if (result.error === 'rate_limited') {
          console.log('Rate limited, waiting 10s...');
          await new Promise(r => setTimeout(r, 10000));
          continue;
        }

        if (result.error || !result.data) {
          errors++; processed++; continue;
        }

        const product = result.data;
        const name = product.title;

        if (!name || name.length < 3 || typeof product.price !== 'number') {
          errors++; processed++; continue;
        }

        // Check duplicate
        const { data: existing } = await supabase
          .from('products').select('id').ilike('name', name).limit(1);

        if (existing && existing.length > 0) {
          skipped++; processed++;
          if (processed % 5 === 0) {
            await supabase.from('import_jobs').update({
              processed_items: processed, success_count: success, error_count: errors, results: { skipped },
            }).eq('id', jobId);
          }
          continue;
        }

        const images = (product.images || []).filter((img: string) => img?.startsWith('http'));
        const originalPrice = product.original_price && product.original_price > product.price
          ? product.original_price : null;

        const { error: insertError } = await supabase.from('products').insert({
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
        });

        if (insertError) {
          console.error(`Insert error for ${name}:`, insertError.message);
          errors++;
        } else {
          success++;
        }
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
        errors++;
      }

      processed++;

      if (processed % 5 === 0 || processed === productUrls.length) {
        await supabase.from('import_jobs').update({
          processed_items: processed, success_count: success, error_count: errors, results: { skipped },
        }).eq('id', jobId);
      }

      await new Promise(r => setTimeout(r, 1500));
    }

    await supabase.from('import_jobs').update({
      status: 'completed', processed_items: processed, success_count: success,
      error_count: errors, results: { skipped }, completed_at: new Date().toISOString(),
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
