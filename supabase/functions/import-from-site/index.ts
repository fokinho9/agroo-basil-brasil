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
    sizes: { type: "array", items: { type: "string" } },
  },
  required: ["title", "price", "images"],
};

const SCRAPE_PROMPT =
  "Extraia os dados do produto desta página. " +
  "O título é o nome do produto. " +
  "A descrição começa na seção 'Descrição' e termina antes de 'Avalie este produto' - extraia TODO o conteúdo. " +
  "O preço à vista vai em price, o preço original sem desconto em original_price. " +
  "Extraia TODAS as URLs de imagem do produto (não ícones ou logos do site). " +
  "SKU se houver, estoque se houver. " +
  "Em 'sizes' extraia todos os tamanhos disponíveis (ex: ['P', 'M', 'G', 'GG'] ou ['34', '36', '38']).";

const MAX_RUNTIME_MS = 50000;

interface ColorVariant {
  color: string;
  image_url: string;
  url: string;
}

interface ProductLog {
  url: string;
  name: string | null;
  price: number | null;
  status: 'success' | 'error' | 'skipped' | 'merged';
  productId: string | null;
  message: string;
}

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Parse color variants from the product-colors HTML section
function parseColorVariants(html: string, baseUrl: string): ColorVariant[] {
  const variants: ColorVariant[] = [];
  // Find the product-colors section
  const colorsMatch = html.match(/class="product-colors"[\s\S]*?<div[^>]*id="colors-variations"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
  if (!colorsMatch) return variants;

  const colorsHtml = colorsMatch[1];
  // Match each color link: href, img src, alt text (color name)
  const linkRegex = /<a\s+href="([^"]+)"[^>]*class="product__colors-item[^"]*"[^>]*>[\s\S]*?<img\s+src="([^"]+)"[^>]*alt="([^"]+)"[^>]*>[\s\S]*?<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(colorsHtml)) !== null) {
    const href = match[1];
    const imgSrc = match[2];
    const altText = match[3].trim();

    // Build full URL
    let fullUrl = href;
    if (href.startsWith('/')) {
      try {
        const base = new URL(baseUrl);
        fullUrl = `${base.origin}${href}`;
      } catch { /* keep as-is */ }
    }
    // Normalize
    fullUrl = fullUrl.endsWith('/') ? fullUrl.slice(0, -1) : fullUrl;

    variants.push({
      color: altText,
      image_url: imgSrc,
      url: fullUrl,
    });
  }

  return variants;
}

// Parse radio variations by their data-variation-name attribute
function parseRadioVariations(html: string): { sizes: string[]; radioColors: string[] } {
  const sizes: string[] = [];
  const radioColors: string[] = [];

  // Find all radio variation sections with their variation name
  const sectionRegex = /data-variation-name="([^"]+)"[\s\S]*?<label[^>]*class="[^"]*label_radio[^"]*"[^>]*>\s*<span>\s*([^<]+?)\s*<\/span>\s*<\/label>/gi;
  
  // First, identify all variation groups and their items
  // Split by variation containers
  const variationBlocks = html.match(/<div[^>]*class="[^"]*product-radio-variation[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi) || [];
  
  for (const block of variationBlocks) {
    // Get variation name from data attribute
    const nameMatch = block.match(/data-variation-name="([^"]+)"/i);
    if (!nameMatch) continue;
    const variationName = nameMatch[1].trim().toLowerCase();
    
    // Extract all label values in this block
    const labelRegex = /<label[^>]*class="[^"]*label_radio[^"]*"[^>]*>\s*<span>\s*([^<]+?)\s*<\/span>\s*<\/label>/gi;
    let match;
    while ((match = labelRegex.exec(block)) !== null) {
      const value = match[1].trim();
      if (!value) continue;
      
      if (variationName === 'tamanho') {
        sizes.push(value);
      } else if (variationName === 'cor') {
        radioColors.push(value);
      }
    }
  }
  
  // Fallback: if no blocks matched, try individual inputs
  if (sizes.length === 0 && radioColors.length === 0) {
    const inputRegex = /<input[^>]*data-variation-name="([^"]+)"[^>]*>[\s\S]*?<label[^>]*>\s*<span>\s*([^<]+?)\s*<\/span>\s*<\/label>/gi;
    let match;
    while ((match = inputRegex.exec(html)) !== null) {
      const variationName = match[1].trim().toLowerCase();
      const value = match[2].trim();
      if (!value) continue;
      if (variationName === 'tamanho') sizes.push(value);
      else if (variationName === 'cor') radioColors.push(value);
    }
  }

  return { sizes: [...new Set(sizes)], radioColors: [...new Set(radioColors)] };
}

// Backward compat wrapper
function parseSizesFromHtml(html: string): string[] {
  return parseRadioVariations(html).sizes;
}

// Parse product addons/complementos from HTML
interface ProductAddon {
  id: string;
  label: string;
  type: 'text' | 'select';
  required: boolean;
  options?: string[];
}

function parseAddonsFromHtml(html: string): ProductAddon[] {
  const addons: ProductAddon[] = [];
  const complementsMatch = html.match(/id="js-product_addons[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i);
  if (!complementsMatch) return addons;

  const section = complementsMatch[1];
  // Match each complements-content block
  const blockRegex = /<div\s+class="complements-content">([\s\S]*?)<\/div>/gi;
  let block;

  while ((block = blockRegex.exec(section)) !== null) {
    const content = block[1];
    // Extract label
    const labelMatch = content.match(/addon-id="(\d+)"[^>]*addon-price="([^"]*)"[^>]*data-addon-is-optional="([^"]*)"[^>]*class="[^"]*">\s*([\s\S]*?)\s*<\/label>/i);
    if (!labelMatch) continue;

    const addonId = labelMatch[1];
    const isOptional = labelMatch[3].toLowerCase() === 'true';
    const label = labelMatch[4].replace(/\*$/, '').trim();

    // Check if it's a select or text input
    const selectMatch = content.match(/<select[^>]*id="addon-select-(\d+)"[^>]*>([\s\S]*?)<\/select>/i);
    if (selectMatch) {
      const optionsHtml = selectMatch[2];
      const options: string[] = [];
      const optRegex = /<option\s+value="([^"]*)"[^>]*>[^<]*<\/option>/gi;
      let opt;
      while ((opt = optRegex.exec(optionsHtml)) !== null) {
        options.push(opt[1].trim());
      }
      addons.push({ id: addonId, label, type: 'select', required: !isOptional, options });
    } else {
      addons.push({ id: addonId, label, type: 'text', required: !isOptional });
    }
  }

  return addons;
}

// Parse breadcrumb categories from HTML
function parseBreadcrumbFromHtml(html: string): string[] {
  const categories: string[] = [];
  const regex = /itemprop="name">([^<]+)<\/span>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const name = match[1].trim();
    if (name && name.toLowerCase() !== 'home') {
      categories.push(name);
    }
  }
  // Remove last item (product name)
  if (categories.length > 1) categories.pop();
  return categories;
}

// Extract a clean base product name from the color variant alt texts
function getBaseProductName(variants: ColorVariant[]): string | null {
  if (variants.length < 2) return null;
  const names = variants.map(v => v.color);
  // Find common prefix among all variant names
  let prefix = names[0];
  for (let i = 1; i < names.length; i++) {
    while (!names[i].toLowerCase().startsWith(prefix.toLowerCase()) && prefix.length > 0) {
      prefix = prefix.substring(0, prefix.lastIndexOf(' '));
    }
  }
  return prefix.trim() || null;
}

async function scrapeProductJson(url: string, apiKey: string, retries = 2): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
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
      
      // Retry on timeout (408) or server errors (5xx)
      if (response.status === 408 || response.status >= 500) {
        const errorBody = await response.text();
        if (attempt < retries) {
          console.log(`⏳ Retry ${attempt + 1}/${retries} for ${url} (HTTP ${response.status})`);
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        console.error(`Scrape HTTP error after ${retries + 1} attempts: ${errorBody}`);
        return { error: `http_${response.status}` };
      }
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Scrape HTTP error: ${errorBody}`);
        return { error: `http_${response.status}` };
      }

      const data = await response.json();
      const extracted = data?.data?.extract || data?.extract || data?.data?.json || data?.json || null;
      const rawHtml = data?.data?.rawHtml || data?.rawHtml || '';

      // Check for SCRAPE_TIMEOUT in response body
      if (data?.success === false && data?.code === 'SCRAPE_TIMEOUT') {
        if (attempt < retries) {
          console.log(`⏳ Retry ${attempt + 1}/${retries} for ${url} (SCRAPE_TIMEOUT)`);
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        return { error: 'scrape_timeout' };
      }

      // Parse breadcrumb for categories
      const breadcrumbCategories = parseBreadcrumbFromHtml(rawHtml);
      if (extracted && breadcrumbCategories.length > 0) {
        extracted.categories = breadcrumbCategories;
        console.log(`📂 Breadcrumb: ${breadcrumbCategories.join(' > ')}`);
      }

      // Parse color variants from HTML
      const colorVariants = parseColorVariants(rawHtml, url);
      if (extracted && colorVariants.length > 0) {
        extracted._colorVariants = colorVariants;
        console.log(`🎨 Found ${colorVariants.length} color variants from HTML`);
      }

      // Parse radio variations (sizes AND colors) from HTML
      const radioVariations = parseRadioVariations(rawHtml);
      if (extracted && radioVariations.sizes.length > 0) {
        extracted.sizes = radioVariations.sizes;
        console.log(`📏 Sizes from HTML: ${radioVariations.sizes.join(', ')}`);
      }
      if (extracted && radioVariations.radioColors.length > 0) {
        if (!extracted._colorVariants || extracted._colorVariants.length === 0) {
          extracted._radioColors = radioVariations.radioColors;
          console.log(`🎨 Found ${radioVariations.radioColors.length} radio color variants: ${radioVariations.radioColors.join(', ')}`);
        }
      }
      if (extracted && radioVariations.radioColors.length > 0 && radioVariations.sizes.length === 0) {
        if (extracted.sizes?.length > 0) {
          const looksLikeColors = extracted.sizes.some((s: string) => 
            !(/^\d{1,3}$|^[XSMLGP]{1,3}$|^GG$|^PP$/i.test(s))
          );
          if (looksLikeColors) {
            console.log(`⚠️ Clearing LLM sizes that look like colors: ${extracted.sizes.join(', ')}`);
            extracted.sizes = [];
          }
        }
      }

      // Parse addons/complementos from HTML
      const addons = parseAddonsFromHtml(rawHtml);
      if (extracted && addons.length > 0) {
        extracted._addons = addons;
        console.log(`🎁 Found ${addons.length} addons: ${addons.map(a => a.label).join(', ')}`);
      }

      return { data: extracted };
    } catch (fetchError) {
      if (attempt < retries) {
        console.log(`⏳ Retry ${attempt + 1}/${retries} for ${url} (network error: ${String(fetchError).substring(0, 100)})`);
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      return { error: String(fetchError).substring(0, 200) };
    }
  }
  return { error: 'max_retries_exceeded' };
}

async function findOrCreateCategory(
  supabase: any, categoryNames: string[], cache: Map<string, string>
): Promise<string | null> {
  if (!categoryNames || categoryNames.length === 0) return null;

  for (let i = categoryNames.length - 1; i >= 0; i--) {
    const name = categoryNames[i].trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (cache.has(key)) return cache.get(key)!;
    const { data } = await supabase.from('categories').select('id').ilike('name', name).limit(1);
    if (data?.length) { cache.set(key, data[0].id); return data[0].id; }
  }

  let parentId: string | null = null;
  let lastId: string | null = null;

  for (const name of categoryNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (cache.has(key)) { parentId = cache.get(key)!; lastId = parentId; continue; }

    const { data } = await supabase.from('categories').select('id').ilike('name', trimmed).limit(1);
    if (data?.length) { parentId = data[0].id as string; lastId = parentId; cache.set(key, parentId); continue; }

    const { data: created, error }: { data: any; error: any } = await supabase.from('categories')
      .insert({ name: trimmed, slug: slugify(trimmed), parent_id: parentId }).select('id').single();
    if (error) { console.error(`Error creating category "${trimmed}":`, error.message); break; }
    parentId = created.id; lastId = created.id; cache.set(key, created.id);
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
    const body = await req.json();

    // Cron health-check: find stuck jobs and resume them
    if (body.checkStuck) {
      // Check for ANY active jobs (running or pending)
      const { data: activeJobs } = await supabase
        .from('import_jobs')
        .select('id, status, updated_at, processed_items, total_items')
        .in('status', ['running', 'pending'])
        .order('updated_at', { ascending: false })
        .limit(5);

      if (!activeJobs || activeJobs.length === 0) {
        // No active jobs at all - unschedule cron to save resources
        console.log('🛑 Cron: No active import jobs, unscheduling monitor...');
        await supabase.rpc('unschedule_import_monitor');
        return new Response(JSON.stringify({ message: 'No active jobs, cron unscheduled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check for stuck jobs (not updated in 3 minutes)
      const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
      const stuckJobs = activeJobs.filter(j => j.updated_at < threeMinAgo);

      if (stuckJobs.length === 0) {
        console.log(`✅ Cron: ${activeJobs.length} active jobs, none stuck`);
        return new Response(JSON.stringify({ message: 'No stuck jobs found', active: activeJobs.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Resume the first stuck job - DON'T mark as failed, just re-invoke directly
      const stuckJob = stuckJobs[0];
      console.log(`🔄 Cron: Found stuck job ${stuckJob.id} (${stuckJob.processed_items}/${stuckJob.total_items}), resuming...`);
      
      // Touch updated_at so the cron doesn't immediately re-trigger
      await supabase.from('import_jobs').update({ 
        updated_at: new Date().toISOString() 
      }).eq('id', stuckJob.id);

      // Self-invoke with the jobId to resume processing
      const supabaseUrl2 = Deno.env.get('SUPABASE_URL')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      fetch(`${supabaseUrl2}/functions/v1/import-from-site`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
        body: JSON.stringify({ jobId: stuckJob.id }),
      }).catch(err => console.error('Cron self-invoke error:', err));

      return new Response(JSON.stringify({ resumed: stuckJob.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const jobId = body.jobId;
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
      return new Response(JSON.stringify({ error: 'Job already finished', status: job.status }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Allow resuming failed/cancelled jobs - but only user-cancelled ones stop
    if (job.status === 'failed') {
      const isCancelled = job.error_message?.includes('Cancelado') || job.error_message?.includes('Cancelled');
      if (isCancelled && !body.forceResume) {
        return new Response(JSON.stringify({ error: 'Job was cancelled by user', status: job.status }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log(`Resuming failed job ${jobId} from ${job.processed_items || 0} processed items`);
      await supabase.from('import_jobs').update({ 
        status: 'running', 
        error_message: null 
      }).eq('id', jobId);
    }

    const config = job.config as { siteUrl: string; categoryId: string; productUrls?: string[]; retryUrls?: string[] };
    const forcedCategoryId = config.categoryId;
    let productUrls = config.productUrls || [];

    await supabase.from('import_jobs').update({ status: 'running' }).eq('id', jobId);

    // Handle retry mode: use retryUrls directly
    if (config.retryUrls && config.retryUrls.length > 0 && productUrls.length === 0) {
      productUrls = config.retryUrls;
      console.log(`Retry mode: ${productUrls.length} URLs to reimport`);
      await supabase.from('import_jobs').update({
        total_items: productUrls.length, config: { ...config, productUrls },
      }).eq('id', jobId);
    }

    // Step 1: Map site if no URLs stored yet
    if (productUrls.length === 0) {
      console.log('Mapping site:', config.siteUrl);
      const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${firecrawlApiKey}` },
        body: JSON.stringify({ url: config.siteUrl, limit: 5000, search: 'produto' }),
      });

      const mapData = await mapResponse.json();
      if (!mapData.success && !mapData.links) {
        await supabase.from('import_jobs').update({
          status: 'failed', error_message: 'Failed to map site',
          results: { skipped: 0, merged: 0, logs: [] },
        }).eq('id', jobId);
        return new Response(JSON.stringify({ error: 'Failed to map site' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const urlSet = new Set<string>();
      for (const url of (mapData.links || [])) {
        if (url.includes('/produto/') && !url.includes('/marca/')) {
          urlSet.add(url.endsWith('/') ? url.slice(0, -1) : url);
        }
      }
      productUrls = Array.from(urlSet);
      console.log(`Mapped ${productUrls.length} unique product URLs`);

      if (productUrls.length === 0) {
        await supabase.from('import_jobs').update({
          status: 'completed', total_items: 0, processed_items: 0,
          results: { skipped: 0, merged: 0, logs: [] }, completed_at: new Date().toISOString(),
        }).eq('id', jobId);
        return new Response(JSON.stringify({ success: true, processed: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('import_jobs').update({
        total_items: productUrls.length, config: { ...config, productUrls },
      }).eq('id', jobId);
    }

    // Step 2: Already processed URLs
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

    const updateJob = async () => {
      await supabase.from('import_jobs').update({
        processed_items: processed, success_count: success, error_count: errors,
        results: { skipped, merged, logs },
      }).eq('id', jobId);
    };

    let shouldContinue = false;
    const PARALLEL_BATCH_SIZE = 20;

    // Filter URLs not yet processed
    const pendingUrls = productUrls.filter((url: string) => {
      const norm = url.endsWith('/') ? url.slice(0, -1) : url;
      return !processedUrls.has(url) && !processedUrls.has(norm) && !processedUrls.has(url + '/');
    });

    // Process in parallel batches of PARALLEL_BATCH_SIZE
    for (let batchStart = 0; batchStart < pendingUrls.length; batchStart += PARALLEL_BATCH_SIZE) {
      // Check cancellation - only stop if explicitly cancelled by user
      if (processed > 0) {
        const { data: freshJob } = await supabase.from('import_jobs').select('status, error_message').eq('id', jobId).single();
        if (freshJob?.status === 'failed') {
          const isCancelled = freshJob.error_message?.includes('Cancelado') || freshJob.error_message?.includes('Cancelled');
          if (isCancelled) {
            console.log('Job cancelled by user'); return new Response(JSON.stringify({ cancelled: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          // Not user-cancelled - restore to running (cron or transient issue)
          console.log('⚠️ Job marked failed but not by user, restoring to running...');
          await supabase.from('import_jobs').update({ status: 'running', error_message: null }).eq('id', jobId);
        }
      }

      if (Date.now() - startTime > MAX_RUNTIME_MS) {
        console.log(`Timeout after ${processed} items, continuing...`);
        await updateJob(); shouldContinue = true; break;
      }

      const batch = pendingUrls.slice(batchStart, batchStart + PARALLEL_BATCH_SIZE);
      console.log(`⚡ Processing batch of ${batch.length} (${processed + 1}-${processed + batch.length}/${productUrls.length})`);

      // Scrape all URLs in parallel
      const scrapeResults = await Promise.allSettled(
        batch.map(url => scrapeProductJson(url, firecrawlApiKey).then(r => ({ url, result: r })))
      );

      let creditsExhausted = false;

      for (const settled of scrapeResults) {
        if (settled.status === 'rejected') {
          const url = 'unknown';
          console.error(`Error in batch:`, settled.reason);
          logs.push({ url, name: null, price: null, status: 'error', productId: null, message: `Erro: ${String(settled.reason).substring(0, 200)}` });
          errors++; processed++;
          continue;
        }

        const { url, result } = settled.value;
        const norm = url.endsWith('/') ? url.slice(0, -1) : url;

        // Skip if already processed by a variant merge in this batch
        if (processedUrls.has(url) || processedUrls.has(norm)) {
          continue;
        }

        if (result.error === 'credits_exhausted') {
          logs.push({ url, name: null, price: null, status: 'error', productId: null, message: 'Créditos esgotados' });
          errors++; processed++; creditsExhausted = true;
          continue;
        }

        if (result.error === 'rate_limited') {
          logs.push({ url, name: null, price: null, status: 'error', productId: null, message: 'Rate limited - será retentado' });
          // Don't mark as processed so it retries on next invocation
          continue;
        }

        if (result.error || !result.data) {
          logs.push({ url, name: null, price: null, status: 'error', productId: null, message: `Erro: ${result.error || 'sem dados'}` });
          errors++; processed++; processedUrls.add(url); continue;
        }

        const product = result.data;
        const name = product.title;

        if (!name || name.length < 3 || typeof product.price !== 'number') {
          logs.push({ url, name: name || null, price: product.price || null, status: 'error', productId: null, message: 'Dados inválidos' });
          errors++; processed++; processedUrls.add(url); continue;
        }

        const colorVariants: ColorVariant[] = product._colorVariants || [];
        const radioColors: string[] = product._radioColors || [];
        const productAddons: ProductAddon[] = product._addons || [];
        const images = (product.images || []).filter((img: string) => img?.startsWith('http'));
        const sizes = (product.sizes || []).filter((s: string) => s?.trim());
        const originalPrice = product.original_price && product.original_price > product.price ? product.original_price : null;

        let productName = name;
        if (colorVariants.length >= 2) {
          const baseName = getBaseProductName(colorVariants);
          if (baseName && baseName.length > 5) productName = baseName;
        }

        const { data: existing } = await supabase
          .from('products').select('id').ilike('name', productName).limit(1);

        if (existing && existing.length > 0) {
          for (const cv of colorVariants) {
            processedUrls.add(cv.url.endsWith('/') ? cv.url.slice(0, -1) : cv.url);
          }
          logs.push({ url, name: productName, price: product.price, status: 'skipped', productId: existing[0].id, message: 'Produto duplicado' });
          skipped++; processed++; processedUrls.add(url); continue;
        }

        let categoryId = forcedCategoryId || null;
        if (!categoryId && product.categories?.length > 0) {
          categoryId = await findOrCreateCategory(supabase, product.categories, categoriesCache);
        }

        const variants: any[] = [];
        if (colorVariants.length > 0) {
          for (const cv of colorVariants) variants.push({ color: cv.color, image_url: cv.image_url });
        } else if (radioColors.length > 0) {
          for (const color of radioColors) variants.push({ color });
        }
        for (const size of sizes) variants.push({ size });

        const allImages = [...images];
        for (const cv of colorVariants) {
          if (cv.image_url && !allImages.includes(cv.image_url)) allImages.push(cv.image_url);
        }

        const { data: inserted, error: insertError } = await supabase.from('products').insert({
          name: productName.length > 150 ? productName.substring(0, 147) + '...' : productName,
          description: product.description || null,
          price: product.price,
          original_price: originalPrice,
          image_url: allImages[0] || null,
          images: allImages.length > 0 ? allImages : null,
          category_id: categoryId,
          stock: product.stock ?? 10,
          active: true,
          featured: false,
          variants: [...variants, ...productAddons.map(a => ({ addon: true, ...a }))],
          source_url: url,
        }).select('id').single();

        if (insertError) {
          console.error(`Insert error:`, insertError.message);
          logs.push({ url, name: productName, price: product.price, status: 'error', productId: null, message: `Erro: ${insertError.message}` });
          errors++;
        } else {
          for (const cv of colorVariants) {
            const cvNorm = cv.url.endsWith('/') ? cv.url.slice(0, -1) : cv.url;
            processedUrls.add(cvNorm);
            if (cvNorm !== norm) {
              logs.push({ url: cvNorm, name: cv.color, price: product.price, status: 'merged', productId: inserted.id, message: `Variante de cor mesclada` });
              merged++;
            }
          }
          const info = `${colorVariants.length} cores, ${sizes.length} tamanhos`;
          console.log(`✅ ${productName} - R$${product.price} | ${info}`);
          logs.push({ url, name: productName, price: product.price, status: 'success', productId: inserted.id, message: `Importado | ${info}` });
          success++;
        }

        processed++;
        processedUrls.add(url);
      }

      // Handle credits exhausted - stop entirely
      if (creditsExhausted) {
        await supabase.from('import_jobs').update({
          status: 'failed', error_message: 'Créditos Firecrawl esgotados',
          processed_items: processed, success_count: success, error_count: errors,
          results: { skipped, merged, logs },
        }).eq('id', jobId);
        return new Response(JSON.stringify({ error: 'credits_exhausted' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await updateJob();
    }

    if (shouldContinue) {
      console.log('Self-invoking...');
      // Use service role key for reliable self-invocation
      try {
        const resp = await fetch(`${supabaseUrl}/functions/v1/import-from-site`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
          body: JSON.stringify({ jobId }),
        });
        if (!resp.ok) {
          console.error(`Self-invoke failed with status ${resp.status}, cron will recover`);
        }
      } catch (err) {
        console.error('Self-invoke error, cron will recover:', err);
      }

      return new Response(JSON.stringify({ continuing: true, processed, successCount: success }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Job completed - unschedule cron
    await supabase.from('import_jobs').update({
      status: 'completed', processed_items: processed, success_count: success,
      error_count: errors, results: { skipped, merged, logs }, completed_at: new Date().toISOString(),
    }).eq('id', jobId);

    // Unschedule cron if no other active jobs
    try { await supabase.rpc('unschedule_import_monitor'); } catch {}

    console.log(`Done: ${success} imported, ${merged} merged, ${errors} errors, ${skipped} skipped`);

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
