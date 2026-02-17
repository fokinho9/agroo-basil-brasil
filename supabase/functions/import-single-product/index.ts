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
  "Em 'sizes' extraia todos os tamanhos disponíveis.";

function parseBreadcrumbFromHtml(html: string): string[] {
  const categories: string[] = [];
  const regex = /itemprop="name">([^<]+)<\/span>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const name = match[1].trim();
    if (name && name.toLowerCase() !== 'home') categories.push(name);
  }
  if (categories.length > 1) categories.pop();
  return categories;
}

function parseColorVariants(html: string, baseUrl: string) {
  const variants: { color: string; image_url: string; url: string }[] = [];
  const colorsMatch = html.match(/class="product-colors"[\s\S]*?<div[^>]*id="colors-variations"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
  if (!colorsMatch) return variants;
  const colorsHtml = colorsMatch[1];
  const linkRegex = /<a\s+href="([^"]+)"[^>]*class="product__colors-item[^"]*"[^>]*>[\s\S]*?<img\s+src="([^"]+)"[^>]*alt="([^"]+)"[^>]*>[\s\S]*?<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(colorsHtml)) !== null) {
    let fullUrl = match[1];
    if (fullUrl.startsWith('/')) {
      try { fullUrl = `${new URL(baseUrl).origin}${fullUrl}`; } catch {}
    }
    variants.push({ color: match[3].trim(), image_url: match[2], url: fullUrl.replace(/\/$/, '') });
  }
  return variants;
}

function parseAddonsFromHtml(html: string) {
  const addons: any[] = [];
  const complementsMatch = html.match(/id="js-product_addons[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i);
  if (!complementsMatch) return addons;
  const section = complementsMatch[1];
  const blockRegex = /<div\s+class="complements-content">([\s\S]*?)<\/div>/gi;
  let block;
  while ((block = blockRegex.exec(section)) !== null) {
    const content = block[1];
    const labelMatch = content.match(/addon-id="(\d+)"[^>]*addon-price="([^"]*)"[^>]*data-addon-is-optional="([^"]*)"[^>]*class="[^"]*">\s*([\s\S]*?)\s*<\/label>/i);
    if (!labelMatch) continue;
    const addonId = labelMatch[1];
    const isOptional = labelMatch[3].toLowerCase() === 'true';
    const label = labelMatch[4].replace(/\*$/, '').trim();
    const selectMatch = content.match(/<select[^>]*id="addon-select-(\d+)"[^>]*>([\s\S]*?)<\/select>/i);
    if (selectMatch) {
      const options: string[] = [];
      const optRegex = /<option\s+value="([^"]*)"[^>]*>[^<]*<\/option>/gi;
      let opt;
      while ((opt = optRegex.exec(selectMatch[2])) !== null) options.push(opt[1].trim());
      addons.push({ id: addonId, label, type: 'select', required: !isOptional, options });
    } else {
      addons.push({ id: addonId, label, type: 'text', required: !isOptional });
    }
  }
  return addons;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) return new Response(JSON.stringify({ error: 'url is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Scrape
    const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${firecrawlKey}` },
      body: JSON.stringify({
        url,
        formats: ['json', 'rawHtml'],
        jsonOptions: { schema: productSchema, prompt: SCRAPE_PROMPT },
        onlyMainContent: false,
        waitFor: 2000,
      }),
    });

    if (!scrapeRes.ok) {
      const err = await scrapeRes.text();
      return new Response(JSON.stringify({ error: `Scrape failed: ${err}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const scrapeData = await scrapeRes.json();
    const extracted = scrapeData?.data?.extract || scrapeData?.data?.json || null;
    const rawHtml = scrapeData?.data?.rawHtml || '';

    if (!extracted?.title || !extracted?.price) {
      return new Response(JSON.stringify({ error: 'Could not extract product data' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Categories
    const breadcrumb = parseBreadcrumbFromHtml(rawHtml);
    let categoryId: string | null = null;
    for (let i = breadcrumb.length - 1; i >= 0; i--) {
      const { data } = await supabase.from('categories').select('id').ilike('name', breadcrumb[i]).limit(1);
      if (data?.length) { categoryId = data[0].id; break; }
    }

    // Variants
    const colorVariants = parseColorVariants(rawHtml, url);
    const sizes = extracted.sizes || [];
    const variants: any[] = [];
    for (const cv of colorVariants) {
      if (sizes.length > 0) {
        for (const s of sizes) variants.push({ color: cv.color, size: s, image_url: cv.image_url });
      } else {
        variants.push({ color: cv.color, image_url: cv.image_url });
      }
    }
    if (colorVariants.length === 0 && sizes.length > 0) {
      for (const s of sizes) variants.push({ size: s });
    }

    // Addons
    const addons = parseAddonsFromHtml(rawHtml);

    // Combine variants + addons
    const allVariants = [...variants, ...addons.map(a => ({ addon: true, ...a }))];

    const images = (extracted.images || []).filter((img: string) => img.startsWith('http'));
    const productData: any = {
      name: extracted.title,
      description: extracted.description || null,
      price: extracted.price,
      original_price: extracted.original_price || null,
      image_url: images[0] || null,
      images,
      category_id: categoryId,
      stock: 10,
      active: true,
      variants: allVariants.length > 0 ? allVariants : [],
      source_url: url,
    };

    // Check duplicate - update if exists
    const { data: existing } = await supabase.from('products').select('id').ilike('name', extracted.title).limit(1);
    if (existing?.length) {
      const { error: updateError } = await supabase.from('products')
        .update({ variants: productData.variants, description: productData.description, category_id: productData.category_id })
        .eq('id', existing[0].id);
      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      console.log(`🔄 Updated: ${extracted.title} -> ${existing[0].id}`);
      return new Response(JSON.stringify({ success: true, productId: existing[0].id, message: 'Product updated', url: `/produto/${existing[0].id}`, addons: addons.length, variants: variants.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: product, error: insertError } = await supabase.from('products').insert(productData).select('id').single();
    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`✅ Imported: ${extracted.title} -> ${product.id}`);

    return new Response(JSON.stringify({
      success: true,
      productId: product.id,
      name: extracted.title,
      price: extracted.price,
      category: breadcrumb.join(' > '),
      variants: variants.length,
      addons: addons.length,
      url: `/produto/${product.id}`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
