import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract product images from markdown (magazord CDN)
function extractImagesFromMarkdown(markdown: string): string[] {
  const images: string[] = [];
  // Match high-res product images (fit-in/800x800 or fit-in/610x610)
  const highResRegex = /https:\/\/texasfarmstore\.cdn\.magazord\.com\.br\/img\/\d{4}\/\d{2}\/produto\/\d+\/\d+\.jpg\?ims=fit-in\/(?:800x800|610x610)/g;
  const highRes = markdown.match(highResRegex) || [];
  
  // Also match raw product images without size params
  const rawRegex = /https:\/\/texasfarmstore\.cdn\.magazord\.com\.br\/img\/\d{4}\/\d{2}\/produto\/\d+\/\d+\.jpg/g;
  const raw = markdown.match(rawRegex) || [];
  
  // Normalize all to 800x800
  const allUrls = [...highRes, ...raw].map(url => {
    const base = url.split('?')[0];
    return base + '?ims=fit-in/800x800';
  });
  
  const unique = [...new Set(allUrls)];
  return unique.slice(0, 6);
}

// Extract sizes from markdown - improved patterns
function extractSizesFromMarkdown(markdown: string, categoryType: string): string[] {
  const sizes: string[] = [];
  
  if (categoryType === 'botas') {
    // "Tamanho Calçado Masculino (34 ao 45):" or individual size numbers
    const calcadoMatch = markdown.match(/Tamanho\s+Cal[çc]ado.*?:([\s\S]*?)(?:\*\*Garantia|Garantia|Comprar)/i);
    if (calcadoMatch) {
      const nums = calcadoMatch[1].match(/\b(3[4-9]|4[0-5])\b/g);
      if (nums) sizes.push(...new Set(nums));
    }
    if (sizes.length === 0) {
      // Default boot sizes
      for (let i = 34; i <= 45; i++) sizes.push(String(i));
    }
  } else if (categoryType === 'calcas') {
    const calcaMatch = markdown.match(/Tamanho\s+Cal[çc]a.*?:([\s\S]*?)(?:\*\*Garantia|Garantia|Comprar)/i);
    if (calcaMatch) {
      const nums = calcaMatch[1].match(/\b(3[4-9]|4[0-9]|5[0-4])\b/g);
      if (nums) sizes.push(...new Set(nums));
    }
    if (sizes.length === 0) {
      for (let i = 36; i <= 54; i += 2) sizes.push(String(i));
    }
  } else if (categoryType === 'chapeus') {
    // Chapéu sizes: numeric 53-63 or letters
    const chapeuMatch = markdown.match(/Tamanho\s+Chap[ée]u.*?:([\s\S]*?)(?:\*\*Garantia|Garantia|Comprar)/i);
    if (chapeuMatch) {
      const nums = chapeuMatch[1].match(/\b(5[3-9]|6[0-3])\b/g);
      if (nums) sizes.push(...new Set(nums));
    }
    if (sizes.length === 0) {
      for (let i = 53; i <= 61; i++) sizes.push(String(i));
    }
  } else {
    // Generic: try P/M/G/GG
    const adultMatch = markdown.match(/Tamanho\s+Adulto.*?:([\s\S]*?)(?:\*\*Garantia|Garantia|Comprar)/i);
    if (adultMatch) {
      const letters = adultMatch[1].match(/\b(PP|P|M|G|GG|XG)\b/g);
      if (letters) sizes.push(...new Set(letters));
    }
  }
  
  return sizes;
}

// Extract description from markdown - improved
function extractDescriptionFromMarkdown(markdown: string): string {
  // Try multiple section headers
  const headers = [
    'Descrição do produto',
    'Descrição',
    'DETALHES DO PRODUTO',
    'Detalhes do produto',
    'Sobre o produto',
    'SOBRE O PRODUTO',
    'Informações',
  ];
  
  for (const header of headers) {
    const idx = markdown.indexOf(header);
    if (idx === -1) continue;
    
    const start = markdown.indexOf('\n', idx) + 1;
    if (start <= 0) continue;
    
    const endMarkers = ['## Quem comprou', '## O que vem', '## Produtos Relacionados', '## Seja a primeira', '## Características', '### Cuidados'];
    let end = markdown.length;
    for (const marker of endMarkers) {
      const mIdx = markdown.indexOf(marker, start);
      if (mIdx !== -1 && mIdx < end) end = mIdx;
    }
    
    let desc = markdown.substring(start, end).trim();
    desc = desc.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    desc = desc.replace(/!\[.*?\]\([^)]+\)/g, '');
    desc = desc.replace(/R\$\s*[\d.,]+/g, '');
    desc = desc.replace(/\n{3,}/g, '\n\n').trim();
    
    if (desc.length > 30) return desc.substring(0, 2000);
  }
  
  // Fallback: extract content between product title and "Quem comprou" or "Garantia"
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    const titleEnd = markdown.indexOf(titleMatch[0]) + titleMatch[0].length;
    const endMarkers = ['## Quem comprou', '## Produtos Relacionados', '## Seja a primeira'];
    let end = markdown.length;
    for (const marker of endMarkers) {
      const mIdx = markdown.indexOf(marker, titleEnd);
      if (mIdx !== -1 && mIdx < end) end = mIdx;
    }
    
    let content = markdown.substring(titleEnd, end);
    // Extract only meaningful text lines
    const lines = content.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 10)
      .filter(l => !l.startsWith('!['))
      .filter(l => !l.startsWith('R$'))
      .filter(l => !l.match(/^\d{2}$/))
      .filter(l => !l.match(/^(Comprar|OK|Calcule|Adicionar|Aceitar)/i))
      .filter(l => !l.includes('magazord'))
      .filter(l => !l.includes('formas de pagamento'));
    
    const desc = lines.join('\n').trim();
    if (desc.length > 30) return desc.substring(0, 2000);
  }
  
  return '';
}

function getCategoryType(categoryId: string): string {
  const map: Record<string, string> = {
    'a0000001-0000-0000-0000-000000000004': 'botas',
    '7aea98f5-75dd-491b-a994-0fc14dd2ed32': 'calcas',
    '6c6c18c3-07ae-42f1-a196-c0e81f1f237b': 'chapeus',
  };
  return map[categoryId] || 'generic';
}

async function scrapeProduct(url: string, firecrawlApiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
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
    if (data.success && data.data?.markdown) {
      return data.data.markdown;
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

    if (action === 'set-variants-by-category') {
      // Bulk set variants based on category
      const categoryVariants: Record<string, any[]> = {
        'a0000001-0000-0000-0000-000000000004': Array.from({length: 12}, (_, i) => ({size: String(34 + i)})), // Botas 34-45
        '7aea98f5-75dd-491b-a994-0fc14dd2ed32': Array.from({length: 10}, (_, i) => ({size: String(36 + i * 2)})), // Calças 36-54
        '6c6c18c3-07ae-42f1-a196-c0e81f1f237b': Array.from({length: 9}, (_, i) => ({size: String(53 + i)})), // Chapéus 53-61
      };
      
      const results: any[] = [];
      for (const [catId, variants] of Object.entries(categoryVariants)) {
        // First get products that need variants
        const { data: prods } = await supabase
          .from('products')
          .select('id, name, variants')
          .eq('category_id', catId);
        
        const needsUpdate = (prods || []).filter(p => !p.variants || (Array.isArray(p.variants) && p.variants.length === 0) || p.variants === '[]');
        
        let updated = 0;
        for (const p of needsUpdate) {
          const { error: uErr } = await supabase
            .from('products')
            .update({ variants })
            .eq('id', p.id);
          if (!uErr) updated++;
        }
        
        const error = null;
        const data = needsUpdate;
        
        if (false) {
          results.push({ category: catId, status: 'error' });
        } else {
          results.push({ category: catId, status: 'success', updated });
        }
      }
      
      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'insert') {
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

    if (action === 'fix-images') {
      // Force re-scrape images for all products in a category
      if (!firecrawlApiKey) {
        return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { categoryId } = await req.json().catch(() => ({ categoryId: 'a0000001-0000-0000-0000-000000000004' }));
      const targetCategoryId = categoryId || 'a0000001-0000-0000-0000-000000000004';

      const { data: productsToFix } = await supabase
        .from('products')
        .select('id, name, source_url, category_id')
        .eq('category_id', targetCategoryId)
        .eq('active', true)
        .not('source_url', 'is', null)
        .order('name');

      if (!productsToFix || productsToFix.length === 0) {
        return new Response(JSON.stringify({ error: 'No products found in category' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Fixing images for ${productsToFix.length} products`);
      const results: any[] = [];

      for (const product of productsToFix) {
        if (!product.source_url) {
          results.push({ id: product.id, name: product.name, status: 'no_url' });
          continue;
        }

        console.log(`Scraping images for: ${product.name}`);
        const markdown = await scrapeProduct(product.source_url, firecrawlApiKey);

        if (!markdown) {
          results.push({ id: product.id, name: product.name, status: 'scrape_failed' });
          continue;
        }

        const images = extractImagesFromMarkdown(markdown);
        if (images.length > 0) {
          const { error } = await supabase
            .from('products')
            .update({
              image_url: images[0],
              images: images,
            })
            .eq('id', product.id);

          if (error) {
            results.push({ id: product.id, name: product.name, status: 'update_error', error: error.message });
          } else {
            results.push({ id: product.id, name: product.name, status: 'success', imagesFound: images.length });
          }
        } else {
          results.push({ id: product.id, name: product.name, status: 'no_images_found' });
        }

        // Delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'scrape-details') {
      if (!firecrawlApiKey) {
        return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: productsToScrape } = await supabase
        .from('products')
        .select('id, name, source_url, description, variants, images, category_id')
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
        const markdown = await scrapeProduct(product.source_url, firecrawlApiKey);
        
        if (!markdown) {
          results.push({ id: product.id, name: product.name, status: 'scrape_failed' });
          continue;
        }

        const updates: any = {};
        const categoryType = getCategoryType(product.category_id || '');

        // Extract description if missing
        if (!product.description || product.description.length < 20) {
          const desc = extractDescriptionFromMarkdown(markdown);
          if (desc.length > 20) {
            updates.description = desc;
          }
        }

        // Extract sizes/variants if empty
        if (!product.variants || (Array.isArray(product.variants) && product.variants.length === 0)) {
          const sizes = extractSizesFromMarkdown(markdown, categoryType);
          if (sizes.length > 0) {
            updates.variants = sizes.map(s => ({ size: s }));
          }
        }

        // Extract images if missing
        if (!product.images || (Array.isArray(product.images) && product.images.length === 0)) {
          const images = extractImagesFromMarkdown(markdown);
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
