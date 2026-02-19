const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { productIds } = await req.json();

    // Fetch products
    let query = supabase.from('products').select('id, name, image_url, images');
    if (productIds && productIds.length > 0) {
      query = query.in('id', productIds);
    } else {
      // Default: get all products with external image URLs
      query = query.eq('active', true).ilike('name', '%chapéu%');
    }
    
    const { data: products, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    const results: any[] = [];

    for (const product of products || []) {
      try {
        const allUrls: string[] = [];
        if (product.image_url) allUrls.push(product.image_url);
        if (product.images) {
          for (const img of product.images) {
            if (img && !allUrls.includes(img)) allUrls.push(img);
          }
        }

        // Skip if already using our storage
        const storagePrefix = `${supabaseUrl}/storage/v1/object/public/product-images/`;
        if (allUrls.length > 0 && allUrls.every(u => u.startsWith(storagePrefix))) {
          results.push({ id: product.id, name: product.name, status: 'skipped', reason: 'already in storage' });
          continue;
        }

        const newUrls: string[] = [];
        let newMainUrl = product.image_url;

        for (let i = 0; i < allUrls.length; i++) {
          const url = allUrls[i];
          if (url.startsWith(storagePrefix)) {
            newUrls.push(url);
            continue;
          }

          try {
            const response = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*,*/*',
                'Referer': new URL(url).origin,
              },
            });

            if (!response.ok) {
              console.error(`Failed to download ${url}: ${response.status}`);
              newUrls.push(url); // keep original
              continue;
            }

            const contentType = response.headers.get('content-type') || 'image/jpeg';
            const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const uint8 = new Uint8Array(arrayBuffer);

            const filePath = `chapeus/${product.id}/${i}.${ext}`;

            const { error: uploadError } = await supabase.storage
              .from('product-images')
              .upload(filePath, uint8, {
                contentType,
                upsert: true,
              });

            if (uploadError) {
              console.error(`Upload error for ${filePath}:`, uploadError);
              newUrls.push(url);
              continue;
            }

            const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${filePath}`;
            newUrls.push(publicUrl);

            if (url === product.image_url) {
              newMainUrl = publicUrl;
            }
          } catch (dlErr) {
            console.error(`Error processing ${url}:`, dlErr);
            newUrls.push(url);
          }
        }

        // Update product
        const { error: updateError } = await supabase.from('products').update({
          image_url: newMainUrl,
          images: newUrls.length > 0 ? newUrls : null,
        }).eq('id', product.id);

        if (updateError) {
          results.push({ id: product.id, name: product.name, status: 'error', error: updateError.message });
        } else {
          results.push({ id: product.id, name: product.name, status: 'success', images: newUrls.length });
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
