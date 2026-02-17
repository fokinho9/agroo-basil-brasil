import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractPrice(markdown: string): number {
  // Match "R$ 244,70" pattern (the first occurrence is usually the main price)
  const priceMatch = markdown.match(/R\$\s*([\d.,]+)/);
  if (priceMatch) {
    const cleaned = priceMatch[1].replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }
  return 0;
}

function extractOriginalPrice(markdown: string): number | null {
  // Match "de R$ 1.900,00" pattern
  const match = markdown.match(/de\s+R\$\s*([\d.,]+)/i);
  if (match) {
    const cleaned = match[1].replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || null;
  }
  return null;
}

function extractDescription(markdown: string): string {
  // Try to get description section
  const descMatch = markdown.match(/###\s*Descrição\s*\n+([\s\S]*?)(?=\n###|\n#|\n\[|\n!\[|$)/i);
  if (descMatch && descMatch[1].trim().length > 20) {
    return descMatch[1].trim().substring(0, 2000);
  }
  return '';
}

function extractImages(markdown: string): string[] {
  const images: string[] = [];
  // Extract CDN image URLs from markdown
  const imgRegex = /https:\/\/cdn\.shoppub\.io\/cdn-cgi\/image\/[^)\s"]+/g;
  const matches = markdown.match(imgRegex) || [];
  
  const seen = new Set<string>();
  for (const url of matches) {
    // Normalize to w=1000 version
    const normalized = url.replace(/w=\d+/, 'w=1000').replace(/h=\d+/, 'h=1000');
    if (!seen.has(normalized)) {
      seen.add(normalized);
      images.push(normalized);
    }
    if (images.length >= 5) break;
  }
  return images;
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
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { jobId } = await req.json();

    if (!jobId) {
      return new Response(JSON.stringify({ error: 'jobId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the job
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const config = job.config as { siteUrl: string; categoryId: string; productUrls?: string[] };
    const categoryId = config.categoryId;
    let productUrls = config.productUrls || [];

    // Update job status to running
    await supabase
      .from('import_jobs')
      .update({ status: 'running' })
      .eq('id', jobId);

    // Step 1: If no product URLs provided, map the site first
    if (productUrls.length === 0) {
      console.log('Mapping site:', config.siteUrl);
      
      const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firecrawlApiKey}`,
        },
        body: JSON.stringify({
          url: config.siteUrl,
          limit: 5000,
          search: 'produto',
        }),
      });

      const mapData = await mapResponse.json();
      
      if (!mapData.success && !mapData.links) {
        await supabase.from('import_jobs').update({ 
          status: 'failed', 
          error_message: 'Failed to map site' 
        }).eq('id', jobId);
        
        return new Response(JSON.stringify({ error: 'Failed to map site' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Filter only product URLs
      productUrls = (mapData.links || []).filter((url: string) => 
        url.includes('/produto/') && !url.includes('/marca/')
      );

      console.log(`Found ${productUrls.length} product URLs`);

      // Update job with total items
      await supabase.from('import_jobs').update({ 
        total_items: productUrls.length,
        config: { ...config, productUrls },
      }).eq('id', jobId);
    }

    // Step 2: Scrape each product URL
    let processed = 0;
    let success = 0;
    let errors = 0;
    let skipped = 0;

    for (const url of productUrls) {
      try {
        // Check if product already exists by checking name similarity
        const slug = url.split('/produto/')[1]?.replace(/\/$/, '') || '';
        
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${firecrawlApiKey}`,
          },
          body: JSON.stringify({
            url,
            formats: ['markdown'],
            onlyMainContent: true,
            timeout: 30000,
            waitFor: 3000,
          }),
        });

        if (scrapeResponse.status === 402) {
          console.error('Firecrawl credits exhausted');
          await supabase.from('import_jobs').update({ 
            status: 'failed',
            error_message: 'Créditos Firecrawl esgotados',
            processed_items: processed,
            success_count: success,
            error_count: errors,
          }).eq('id', jobId);
          break;
        }

        if (scrapeResponse.status === 429) {
          console.log('Rate limited, waiting 10s...');
          await new Promise(r => setTimeout(r, 10000));
          continue;
        }

        if (!scrapeResponse.ok) {
          errors++;
          processed++;
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const data = scrapeData.data || scrapeData;
        const markdown = data.markdown || '';
        const metadata = data.metadata || {};

        // Extract product data
        const name = metadata.ogTitle || metadata.title || slug.replace(/-/g, ' ');
        const imageUrl = metadata.ogImage || '';
        const description = metadata.ogDescription || extractDescription(markdown) || '';
        const price = extractPrice(markdown);
        const originalPrice = extractOriginalPrice(markdown);
        const images = extractImages(markdown);

        if (!name || name.length < 3) {
          errors++;
          processed++;
          continue;
        }

        // Check for duplicate by name
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .ilike('name', name)
          .limit(1);

        if (existing && existing.length > 0) {
          skipped++;
          processed++;
          // Update progress
          await supabase.from('import_jobs').update({
            processed_items: processed,
            success_count: success,
            error_count: errors,
          }).eq('id', jobId);
          continue;
        }

        // Insert product
        const { error: insertError } = await supabase.from('products').insert({
          name: name.length > 150 ? name.substring(0, 147) + '...' : name,
          description: description || null,
          price: price,
          original_price: originalPrice && originalPrice > price ? originalPrice : null,
          image_url: imageUrl || (images.length > 0 ? images[0] : null),
          images: images.length > 0 ? images : null,
          category_id: categoryId || null,
          stock: 10,
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

      // Update progress every 5 items
      if (processed % 5 === 0 || processed === productUrls.length) {
        await supabase.from('import_jobs').update({
          processed_items: processed,
          success_count: success,
          error_count: errors,
          results: { skipped },
        }).eq('id', jobId);
      }

      // Delay between requests
      await new Promise(r => setTimeout(r, 1500));
    }

    // Mark job as completed
    await supabase.from('import_jobs').update({
      status: 'completed',
      processed_items: processed,
      success_count: success,
      error_count: errors,
      results: { skipped },
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);

    return new Response(JSON.stringify({ 
      success: true, processed, successCount: success, errorCount: errors, skipped 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
