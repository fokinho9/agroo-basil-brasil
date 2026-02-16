import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, fromCurrency = "brl", toCurrency = "btc" } = await req.json();

    const linkId = Deno.env.get("CHANGENOW_LINK_ID");
    if (!linkId) {
      throw new Error("CHANGENOW_LINK_ID not configured");
    }

    const widgetUrl = `https://changenow.io/embeds/exchange-widget/v2/widget.html?FAQ=false&amount=${amount}&amountFiat=${amount}&backgroundColor=FFFFFF&darkMode=false&from=${fromCurrency}&horizontal=false&isFiat=true&lang=pt&link_id=${linkId}&locales=false&logo=false&primaryColor=009393&to=${toCurrency}&toTheMoon=false`;

    return new Response(JSON.stringify({ widgetUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
