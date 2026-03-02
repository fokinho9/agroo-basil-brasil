const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, tracking_code, customer_cep, customer_city, customer_state } = await req.json();

    if (!order_id || !tracking_code) {
      throw new Error('order_id and tracking_code are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const cep = customer_cep || '';
    const city = customer_city || 'São Paulo';
    const state = customer_state || 'SP';
    const t0 = new Date();

    // Simulated timeline - 14 days
    const events = [
      { day: 0, hour: 10, min: 12, code: 'POSTED', label: 'Shipment posted (simulated)', lCity: 'Cuiabá', lState: 'MT', lCep: null },
      { day: 0, hour: 16, min: 40, code: 'PICKUP', label: 'Collected by carrier (simulated)', lCity: 'Cuiabá', lState: 'MT', lCep: null },
      { day: 1, hour: 8, min: 5, code: 'IN_TRANSIT', label: 'In transit to sorting facility (simulated)', lCity: 'Várzea Grande', lState: 'MT', lCep: null },
      { day: 2, hour: 22, min: 18, code: 'ARRIVED_HUB', label: 'Arrived at sorting facility (simulated)', lCity: 'São Paulo', lState: 'SP', lCep: null },
      { day: 3, hour: 9, min: 11, code: 'SORTING', label: 'Sorted at facility (simulated)', lCity: 'São Paulo', lState: 'SP', lCep: null },
      { day: 4, hour: 14, min: 33, code: 'DISPATCHED', label: 'Dispatched to local delivery unit (simulated)', lCity: 'São Paulo', lState: 'SP', lCep: null },
      { day: 5, hour: 8, min: 2, code: 'ARRIVED_LOCAL', label: 'Arrived at local delivery unit (simulated)', lCity: city, lState: state, lCep: cep },
      { day: 6, hour: 8, min: 20, code: 'OUT_FOR_DELIVERY', label: 'Out for delivery (simulated)', lCity: city, lState: state, lCep: cep },
      { day: 6, hour: 18, min: 5, code: 'DELIVERY_FAILED_1', label: 'Delivery attempt 1 failed: recipient unavailable (simulated)', lCity: city, lState: state, lCep: cep },
      { day: 7, hour: 9, min: 10, code: 'RE_SCHEDULED', label: 'Delivery rescheduled (simulated)', lCity: city, lState: state, lCep: cep },
      { day: 8, hour: 8, min: 12, code: 'OUT_FOR_DELIVERY', label: 'Out for delivery (simulated)', lCity: city, lState: state, lCep: cep },
      { day: 8, hour: 17, min: 41, code: 'DELIVERY_FAILED_2', label: 'Delivery attempt 2 failed: address not located (simulated)', lCity: city, lState: state, lCep: cep },
      { day: 9, hour: 8, min: 17, code: 'OUT_FOR_DELIVERY', label: 'Out for delivery (simulated)', lCity: city, lState: state, lCep: cep },
      { day: 9, hour: 18, min: 9, code: 'DELIVERY_FAILED_3', label: 'Delivery attempt 3 failed: access restricted (simulated)', lCity: city, lState: state, lCep: cep },
      { day: 10, hour: 10, min: 20, code: 'RETURN_INIT', label: 'Return to sender initiated (simulated)', lCity: city, lState: state, lCep: null },
      { day: 11, hour: 15, min: 44, code: 'RETURN_TRANSIT', label: 'Returning in transit (simulated)', lCity: 'Campinas', lState: 'SP', lCep: null },
      { day: 12, hour: 20, min: 13, code: 'RETURN_ARRIVED', label: 'Return arrived at origin facility (simulated)', lCity: 'Cuiabá', lState: 'MT', lCep: null },
      { day: 13, hour: 11, min: 5, code: 'RETURNED', label: 'Returned to sender (simulated)', lCity: 'Cuiabá', lState: 'MT', lCep: null },
    ];

    const rows = events.map(e => {
      const occurred = new Date(t0);
      occurred.setDate(occurred.getDate() + e.day);
      occurred.setHours(e.hour, e.min, 0, 0);
      return {
        order_id,
        tracking_code: tracking_code.toUpperCase(),
        simulated: true,
        status_code: e.code,
        status_label: e.label,
        location_city: e.lCity,
        location_state: e.lState,
        location_postcode: e.lCep,
        occurred_at: occurred.toISOString(),
      };
    });

    const { error } = await supabase.from('tracking_events').insert(rows);
    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, events_created: rows.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating tracking events:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
