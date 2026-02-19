const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function downloadImage(url: string): Promise<{ data: Uint8Array; contentType: string } | null> {
  // Try multiple strategies
  const strategies = [
    // Strategy 1: Full browser-like headers with Referer
    {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.rodeowest.com.br/',
      'Origin': 'https://www.rodeowest.com.br',
      'Sec-Fetch-Dest': 'image',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Site': 'cross-site',
      'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
    },
    // Strategy 2: Simple with different UA
    {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
      'Accept': 'image/*,*/*',
      'Referer': 'https://www.google.com/',
    },
    // Strategy 3: Bare minimum
    {
      'User-Agent': 'Mozilla/5.0',
      'Accept': '*/*',
    },
  ];

  for (const headers of strategies) {
    try {
      const response = await fetch(url, { headers, redirect: 'follow' });
      if (response.ok) {
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        return { data: new Uint8Array(arrayBuffer), contentType };
      }
      console.log(`Strategy failed for ${url}: ${response.status}`);
    } catch (e) {
      console.log(`Strategy error for ${url}: ${e}`);
    }
  }

  // Strategy 4: Try Google cache / alternative URL patterns
  // For cdn.iset.io URLs, try without path modifications
  if (url.includes('cdn.iset.io')) {
    // Try with images.iset.io subdomain
    const altUrl = url.replace('cdn.iset.io', 'images.iset.io');
    try {
      const response = await fetch(altUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' },
        redirect: 'follow',
      });
      if (response.ok) {
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        return { data: new Uint8Array(arrayBuffer), contentType };
      }
    } catch (e) {}
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { productIds } = await req.json();

    let query = supabase.from('products').select('id, name, image_url, images');
    if (productIds && productIds.length > 0) {
      query = query.in('id', productIds);
    } else {
      query = query.eq('active', true).ilike('name', '%chapéu%');
    }
    
    const { data: products, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    const results: any[] = [];
    const storagePrefix = `${supabaseUrl}/storage/v1/object/public/product-images/`;

    for (const product of products || []) {
      try {
        const allUrls: string[] = [];
        if (product.image_url) allUrls.push(product.image_url);
        if (product.images) {
          for (const img of product.images) {
            if (img && !allUrls.includes(img)) allUrls.push(img);
          }
        }

        // Skip if already in storage
        if (allUrls.length > 0 && allUrls.every(u => u.startsWith(storagePrefix))) {
          results.push({ id: product.id, name: product.name, status: 'skipped', reason: 'already in storage' });
          continue;
        }

        const newUrls: string[] = [];
        let newMainUrl = product.image_url;
        let anyDownloaded = false;

        for (let i = 0; i < allUrls.length; i++) {
          const url = allUrls[i];
          if (url.startsWith(storagePrefix)) {
            newUrls.push(url);
            continue;
          }

          const result = await downloadImage(url);
          if (!result) {
            console.error(`All strategies failed for ${url}`);
            newUrls.push(url);
            continue;
          }

          const ext = result.contentType.includes('png') ? 'png' : result.contentType.includes('webp') ? 'webp' : 'jpg';
          const filePath = `chapeus/${product.id}/${i}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, result.data, { contentType: result.contentType, upsert: true });

          if (uploadError) {
            console.error(`Upload error for ${filePath}:`, uploadError);
            newUrls.push(url);
            continue;
          }

          const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${filePath}`;
          newUrls.push(publicUrl);
          anyDownloaded = true;

          if (url === product.image_url) {
            newMainUrl = publicUrl;
          }
        }

        if (anyDownloaded) {
          const { error: updateError } = await supabase.from('products').update({
            image_url: newMainUrl,
            images: newUrls.length > 0 ? newUrls : null,
          }).eq('id', product.id);

          if (updateError) {
            results.push({ id: product.id, name: product.name, status: 'error', error: updateError.message });
          } else {
            results.push({ id: product.id, name: product.name, status: 'success', images: newUrls.length });
          }
        } else {
          results.push({ id: product.id, name: product.name, status: 'failed', reason: 'all downloads blocked' });
        }
      } catch (prodErr) {
        results.push({ id: product.id, name: product.name, status: 'error', error: String(prodErr) });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
