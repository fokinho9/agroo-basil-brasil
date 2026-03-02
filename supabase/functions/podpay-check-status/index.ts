const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transaction_id } = await req.json();

    if (!transaction_id) {
      throw new Error('transaction_id is required');
    }

    const secretKey = Deno.env.get('PODPAY_SECRET_KEY');
    if (!secretKey) {
      throw new Error('PODPAY_SECRET_KEY not configured');
    }

    const res = await fetch(`https://api.podpay.app/v1/transactions/${transaction_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
      },
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || json.message || `PodPay API error: ${res.status}`);
    }

    const txData = json.data;

    return new Response(
      JSON.stringify({
        success: true,
        status: txData.status, // 'pending', 'paid', 'expired', 'refunded', etc.
        paid: txData.status === 'paid' || txData.status === 'approved',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('PodPay check-status error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
