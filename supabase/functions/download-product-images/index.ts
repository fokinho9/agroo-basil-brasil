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

    const { mappings } = await req.json();
    // mappings: Array of { productId, imageUrls: string[] }

    if (!mappings || !Array.isArray(mappings)) {
      throw new Error('Missing mappings array');
    }

    const results: any[] = [];

    for (const mapping of mappings) {
      const { productId, imageUrls } = mapping;
      try {
        const newUrls: string[] = [];
        
        for (let i = 0; i < imageUrls.length; i++) {
          const url = imageUrls[i];
          
          const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' },
            redirect: 'follow',
          });
          
          if (!response.ok) {
            console.error(`Failed to fetch ${url}: ${response.status}`);
            continue;
          }

          const contentType = response.headers.get('content-type') || 'image/png';
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const data = new Uint8Array(arrayBuffer);
          
          const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
          const filePath = `chapeus/${productId}/${i}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, data, { contentType, upsert: true });

          if (uploadError) {
            console.error(`Upload error for ${filePath}:`, uploadError);
            continue;
          }

          const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${filePath}`;
          newUrls.push(publicUrl);
        }

        if (newUrls.length > 0) {
          const { error: updateError } = await supabase.from('products').update({
            image_url: newUrls[0],
            images: newUrls,
          }).eq('id', productId);

          if (updateError) {
            results.push({ id: productId, status: 'error', error: updateError.message });
          } else {
            results.push({ id: productId, status: 'success', images: newUrls.length });
          }
        } else {
          results.push({ id: productId, status: 'failed', reason: 'no images downloaded' });
        }
      } catch (err) {
        results.push({ id: productId, status: 'error', error: String(err) });
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
