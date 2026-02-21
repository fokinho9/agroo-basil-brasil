import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  images: { src: string }[];
  variants: {
    title: string;
    price: string;
    compare_at_price: string | null;
    option1: string | null;
    option2: string | null;
    option3: string | null;
  }[];
  options: { name: string; values: string[] }[];
}

interface ProductLog {
  url: string;
  name: string | null;
  price: number | null;
  status: 'success' | 'error' | 'skipped';
  productId: string | null;
  message: string;
}

const MAX_RUNTIME_MS = 50000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    let jobId = body.jobId;

    // Allow creating a job directly from the edge function
    if (!jobId && body.createAndRun) {
      const { data: newJob, error: createErr } = await supabase
        .from('import_jobs')
        .insert({
          type: 'shopify-import',
          status: 'pending',
          total_items: 0,
          config: {
            collectionUrl: body.collectionUrl,
            categoryId: body.categoryId,
            totalPages: body.totalPages || 20,
          },
        })
        .select('id')
        .single();

      if (createErr || !newJob) {
        return new Response(JSON.stringify({ error: 'Failed to create job: ' + createErr?.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      jobId = newJob.id;
      console.log(`Created job ${jobId}`);
    }

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

    if (job.status === 'completed') {
      return new Response(JSON.stringify({ message: 'Already completed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (job.status === 'failed') {
      const isCancelled = job.error_message?.includes('Cancelado') || job.error_message?.includes('Cancelled');
      if (isCancelled && !body.forceResume) {
        return new Response(JSON.stringify({ error: 'Job cancelled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await supabase.from('import_jobs').update({ status: 'running', error_message: null }).eq('id', jobId);
    }

    const config = job.config as {
      collectionUrl: string;
      categoryId: string;
      totalPages: number;
      shopifyProducts?: ShopifyProduct[];
    };

    await supabase.from('import_jobs').update({ status: 'running' }).eq('id', jobId);

    let allProducts: ShopifyProduct[] = config.shopifyProducts || [];

    // Step 1: Fetch all products from Shopify JSON API if not cached
    if (allProducts.length === 0) {
      console.log(`Fetching products from Shopify collection: ${config.collectionUrl}`);
      
      // Extract base collection URL
      let baseUrl = config.collectionUrl.replace(/\/$/, '');
      
      for (let page = 1; page <= config.totalPages; page++) {
        try {
          const jsonUrl = `${baseUrl}/products.json?page=${page}&limit=30`;
          console.log(`📄 Fetching page ${page}/${config.totalPages}: ${jsonUrl}`);
          
          const resp = await fetch(jsonUrl, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          });
          
          if (!resp.ok) {
            console.error(`Page ${page} failed: HTTP ${resp.status}`);
            continue;
          }
          
          const data = await resp.json();
          const products = data.products || [];
          
          if (products.length === 0) {
            console.log(`Page ${page}: no products, stopping pagination`);
            break;
          }
          
          allProducts.push(...products);
          console.log(`Page ${page}: ${products.length} products (total: ${allProducts.length})`);
          
          // Small delay to avoid rate limiting
          await new Promise(r => setTimeout(r, 300));
        } catch (err) {
          console.error(`Error fetching page ${page}:`, err);
        }
      }

      console.log(`Total Shopify products fetched: ${allProducts.length}`);

      // Save products to job config and set total
      await supabase.from('import_jobs').update({
        total_items: allProducts.length,
        config: { ...config, shopifyProducts: allProducts },
      }).eq('id', jobId);
    }

    // Step 2: Process each product
    const existingLogs: ProductLog[] = ((job.results as any)?.logs) || [];
    const processedHandles = new Set(existingLogs.map((l: ProductLog) => {
      // Extract handle from URL
      const parts = l.url.split('/products/');
      return parts[1] || l.url;
    }));

    let logs = [...existingLogs];
    let processed = job.processed_items || 0;
    let success = job.success_count || 0;
    let errors = job.error_count || 0;
    let skipped = (job.results as any)?.skipped || 0;

    const startTime = Date.now();
    const baseOrigin = new URL(config.collectionUrl).origin;

    const updateJob = async () => {
      await supabase.from('import_jobs').update({
        processed_items: processed, success_count: success, error_count: errors,
        results: { skipped, logs },
        updated_at: new Date().toISOString(),
      }).eq('id', jobId);
    };

    let shouldContinue = false;

    for (const shopProduct of allProducts) {
      if (processedHandles.has(shopProduct.handle)) continue;

      // Check cancellation
      if (processed > 0 && processed % 20 === 0) {
        const { data: freshJob } = await supabase.from('import_jobs').select('status, error_message').eq('id', jobId).single();
        if (freshJob?.status === 'failed' && (freshJob.error_message?.includes('Cancelado') || freshJob.error_message?.includes('Cancelled'))) {
          console.log('Job cancelled by user');
          return new Response(JSON.stringify({ cancelled: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Check timeout
      if (Date.now() - startTime > MAX_RUNTIME_MS) {
        console.log(`Timeout after ${processed} items, continuing...`);
        await updateJob();
        shouldContinue = true;
        break;
      }

      const productUrl = `${baseOrigin}/products/${shopProduct.handle}`;
      const name = shopProduct.title?.trim();

      if (!name || name.length < 2) {
        logs.push({ url: productUrl, name: null, price: null, status: 'error', productId: null, message: 'Sem nome' });
        errors++; processed++; processedHandles.add(shopProduct.handle);
        continue;
      }

      // Get price from first variant
      const firstVariant = shopProduct.variants?.[0];
      const price = firstVariant ? parseFloat(firstVariant.price) : 0;
      const comparePrice = firstVariant?.compare_at_price ? parseFloat(firstVariant.compare_at_price) : null;
      const originalPrice = comparePrice && comparePrice > price ? comparePrice : null;

      if (price <= 0) {
        logs.push({ url: productUrl, name, price: 0, status: 'error', productId: null, message: 'Preço inválido' });
        errors++; processed++; processedHandles.add(shopProduct.handle);
        continue;
      }

      // Check for duplicates
      const { data: existing } = await supabase
        .from('products').select('id').ilike('name', name).limit(1);

      if (existing && existing.length > 0) {
        logs.push({ url: productUrl, name, price, status: 'skipped', productId: existing[0].id, message: 'Produto duplicado' });
        skipped++; processed++; processedHandles.add(shopProduct.handle);
        continue;
      }

      // Collect images
      const images = (shopProduct.images || []).map(img => img.src).filter(Boolean);

      // Build variants (sizes, colors from Shopify options)
      const variants: any[] = [];
      for (const option of (shopProduct.options || [])) {
        const optName = option.name?.toLowerCase();
        if (optName === 'tamanho' || optName === 'size') {
          for (const val of option.values) variants.push({ size: val });
        } else if (optName === 'cor' || optName === 'color' || optName === 'colour') {
          for (const val of option.values) variants.push({ color: val });
        } else {
          // Generic option
          for (const val of option.values) variants.push({ [option.name]: val });
        }
      }

      // Clean up HTML description
      let description = shopProduct.body_html || '';
      description = description.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      if (description.length > 2000) description = description.substring(0, 2000) + '...';

      // Insert product
      const { data: inserted, error: insertError } = await supabase.from('products').insert({
        name: name.length > 150 ? name.substring(0, 147) + '...' : name,
        description: description || null,
        price,
        original_price: originalPrice,
        image_url: images[0] || null,
        images: images.length > 0 ? images : null,
        category_id: config.categoryId,
        stock: 10,
        active: true,
        featured: false,
        variants: variants.length > 0 ? variants : [],
        source_url: productUrl,
      }).select('id').single();

      if (insertError) {
        console.error(`Insert error for "${name}":`, insertError.message);
        logs.push({ url: productUrl, name, price, status: 'error', productId: null, message: `Erro: ${insertError.message}` });
        errors++;
      } else {
        const info = `${images.length} imgs, ${variants.length} variantes`;
        console.log(`✅ ${name} - R$${price} | ${info}`);
        logs.push({ url: productUrl, name, price, status: 'success', productId: inserted.id, message: `Importado | ${info}` });
        success++;
      }

      processed++;
      processedHandles.add(shopProduct.handle);

      // Update job every 10 items
      if (processed % 10 === 0) await updateJob();
    }

    if (shouldContinue) {
      console.log('Self-invoking for next batch...');
      await updateJob();
      try {
        await fetch(`${supabaseUrl}/functions/v1/import-shopify-collection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
          body: JSON.stringify({ jobId }),
        });
      } catch (err) {
        console.error('Self-invoke error:', err);
      }

      return new Response(JSON.stringify({ continuing: true, processed, success }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Job completed
    await supabase.from('import_jobs').update({
      status: 'completed', processed_items: processed, success_count: success,
      error_count: errors, results: { skipped, logs }, completed_at: new Date().toISOString(),
    }).eq('id', jobId);

    console.log(`Done: ${success} imported, ${errors} errors, ${skipped} skipped`);

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
