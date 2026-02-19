import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductData {
  name: string;
  price: number;
  original_price: number;
  source_url: string;
  image_url: string;
  category_id: string;
  variants: { size: string }[];
  description?: string;
  images?: string[];
}

// Extract OG image from HTML
function extractOgImage(html: string): string | null {
  const match = html.match(/property="og:image"\s+content="([^"]+)"/);
  return match ? match[1] : null;
}

// Extract product images from HTML
function extractImages(html: string): string[] {
  const images: string[] = [];
  // Match product images from magazord CDN
  const regex = /https:\/\/texasfarmstore\.cdn\.magazord\.com\.br\/img\/\d{4}\/\d{2}\/produto\/\d+\/\d+\.jpg/g;
  const matches = html.match(regex) || [];
  const unique = [...new Set(matches)];
  // Return high-res versions
  return unique.map(url => url + '?ims=fit-in/800x800').slice(0, 6);
}

// Extract description from markdown
function extractDescription(markdown: string): string {
  // Find "Descrição do produto" section
  const descStart = markdown.indexOf('## Descrição do produto');
  if (descStart === -1) {
    const altStart = markdown.indexOf('Descrição do produto');
    if (altStart === -1) return '';
  }
  
  const start = markdown.indexOf('\n', markdown.indexOf('Descrição do produto')) + 1;
  if (start <= 0) return '';
  
  // Find end markers
  const endMarkers = ['## Características', '## Quem comprou', '## O que vem', '## Produtos Relacionados'];
  let end = markdown.length;
  for (const marker of endMarkers) {
    const idx = markdown.indexOf(marker, start);
    if (idx !== -1 && idx < end) end = idx;
  }
  
  let desc = markdown.substring(start, end).trim();
  // Clean up
  desc = desc.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove links
  desc = desc.replace(/!\[.*?\]\([^)]+\)/g, ''); // Remove images
  desc = desc.replace(/\n{3,}/g, '\n\n').trim();
  
  return desc.substring(0, 2000);
}

// Extract sizes from markdown
function extractSizes(markdown: string): string[] {
  const sizes: string[] = [];
  
  // Calça sizes: 34-54
  const calcaMatch = markdown.match(/Tamanho Calça.*?:([\s\S]*?)(?:\n\n|\*\*Garantia)/);
  if (calcaMatch) {
    const nums = calcaMatch[1].match(/\b(3[4-9]|4[0-9]|5[0-4])\b/g);
    if (nums) sizes.push(...new Set(nums));
  }
  
  // Chapéu sizes: 53-63 or P/M/G/GG
  const chapeuMatch = markdown.match(/Tamanho Chapéu.*?:([\s\S]*?)(?:\n\n|\*\*Garantia)/);
  if (chapeuMatch) {
    const nums = chapeuMatch[1].match(/\b(5[3-9]|6[0-3])\b/g);
    if (nums) sizes.push(...new Set(nums));
  }
  
  const adultMatch = markdown.match(/Tamanho Adulto.*?:([\s\S]*?)(?:\n\n|\*\*Garantia)/);
  if (adultMatch) {
    const letters = adultMatch[1].match(/\b(PP|P|M|G|GG|XG)\b/g);
    if (letters) sizes.push(...new Set(letters));
  }
  
  // Calçado sizes: 34-45
  const calcadoMatch = markdown.match(/Tamanho Calçado.*?:([\s\S]*?)(?:\n\n|\*\*Garantia)/);
  if (calcadoMatch) {
    const nums = calcadoMatch[1].match(/\b(3[4-9]|4[0-5])\b/g);
    if (nums) sizes.push(...new Set(nums));
  }
  
  // Generic size extraction from the product page content
  if (sizes.length === 0) {
    // Look for size buttons pattern
    const sizePattern = /\n\s*(\d{2})\s*\n/g;
    let match;
    const foundSizes: string[] = [];
    while ((match = sizePattern.exec(markdown)) !== null) {
      const num = parseInt(match[1]);
      if (num >= 34 && num <= 63) {
        foundSizes.push(match[1]);
      }
    }
    if (foundSizes.length >= 3) {
      sizes.push(...new Set(foundSizes));
    }
  }
  
  return sizes;
}

async function scrapeProduct(url: string, firecrawlApiKey: string): Promise<{ markdown: string; html: string } | null> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 5000,
        timeout: 60000,
      }),
    });

    if (!response.ok) {
      console.error(`Firecrawl error for ${url}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data.success && data.data) {
      return {
        markdown: data.data.markdown || '',
        html: data.data.rawHtml || data.data.html || '',
      };
    }
    return null;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, products, productIds } = await req.json();

    if (action === 'insert') {
      // Insert new products (chapéus and botas)
      const results: any[] = [];
      for (const product of products) {
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('name', product.name)
          .maybeSingle();

        if (existing) {
          results.push({ name: product.name, status: 'skipped' });
          continue;
        }

        const { data, error } = await supabase
          .from('products')
          .insert({
            name: product.name,
            price: product.price,
            original_price: product.original_price,
            source_url: product.source_url,
            image_url: product.image_url,
            category_id: product.category_id,
            variants: product.variants || [],
            active: true,
            stock: 10,
          })
          .select('id')
          .single();

        if (error) {
          results.push({ name: product.name, status: 'error', error: error.message });
        } else {
          results.push({ name: product.name, status: 'success', id: data.id });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'scrape-descriptions') {
      if (!firecrawlApiKey) {
        return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Scrape product pages for descriptions, images, and sizes
      const { data: productsToScrape } = await supabase
        .from('products')
        .select('id, name, source_url, description, variants, images')
        .in('id', productIds)
        .order('name');

      if (!productsToScrape || productsToScrape.length === 0) {
        return new Response(JSON.stringify({ error: 'No products found' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const results: any[] = [];
      
      for (const product of productsToScrape) {
        if (!product.source_url) {
          results.push({ id: product.id, name: product.name, status: 'no_url' });
          continue;
        }

        console.log(`Scraping: ${product.name}`);
        const scraped = await scrapeProduct(product.source_url, firecrawlApiKey);
        
        if (!scraped) {
          results.push({ id: product.id, name: product.name, status: 'scrape_failed' });
          continue;
        }

        const updates: any = {};

        // Extract description if missing
        if (!product.description || product.description.length < 20) {
          const desc = extractDescription(scraped.markdown);
          if (desc.length > 20) {
            updates.description = desc;
          }
        }

        // Extract sizes/variants if empty
        if (!product.variants || (Array.isArray(product.variants) && product.variants.length === 0)) {
          const sizes = extractSizes(scraped.markdown);
          if (sizes.length > 0) {
            updates.variants = sizes.map(s => ({ size: s }));
          }
        }

        // Extract images if missing
        if (!product.images || (Array.isArray(product.images) && product.images.length === 0)) {
          const images = extractImages(scraped.html || scraped.markdown);
          if (images.length > 0) {
            updates.images = images;
          }
        }

        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', product.id);

          if (error) {
            results.push({ id: product.id, name: product.name, status: 'update_error', error: error.message });
          } else {
            results.push({ 
              id: product.id, 
              name: product.name, 
              status: 'success',
              updated: Object.keys(updates),
              sizesFound: updates.variants?.length || 0,
              descLength: updates.description?.length || 0,
            });
          }
        } else {
          results.push({ id: product.id, name: product.name, status: 'no_updates_needed' });
        }

        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
