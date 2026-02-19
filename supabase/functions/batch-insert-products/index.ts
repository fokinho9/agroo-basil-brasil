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

    const { products } = await req.json();

    const results: any[] = [];

    for (const product of products) {
      // Check if product already exists by name
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('name', product.name)
        .maybeSingle();

      if (existing) {
        results.push({ name: product.name, status: 'skipped', reason: 'already exists' });
        continue;
      }

      const { data, error } = await supabase
        .from('products')
        .insert(product)
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
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
