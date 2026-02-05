import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STREETPAY_PUBLIC_KEY = Deno.env.get("STREETPAY_PUBLIC_KEY");
    const STREETPAY_SECRET_KEY = Deno.env.get("STREETPAY_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!STREETPAY_PUBLIC_KEY) {
      throw new Error("STREETPAY_PUBLIC_KEY is not configured");
    }
    if (!STREETPAY_SECRET_KEY) {
      throw new Error("STREETPAY_SECRET_KEY is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { transactionId, orderId } = await req.json();

    if (!transactionId) {
      throw new Error("Transaction ID is required");
    }

    // Create Basic Auth header
    const auth = "Basic " + btoa(`${STREETPAY_PUBLIC_KEY}:${STREETPAY_SECRET_KEY}`);

    console.log("Checking StreetPay transaction status:", transactionId);

    const response = await fetch(
      `https://api.streetpayments.com.br/v1/transactions/${transactionId}`,
      {
        method: "GET",
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    console.log("StreetPay status response:", JSON.stringify(data));

    if (!response.ok) {
      throw new Error(`StreetPay API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    // Map StreetPay status to order status
    let orderStatus = "pending";
    if (data.status === "paid" || data.status === "authorized") {
      orderStatus = "paid";
    } else if (data.status === "refused" || data.status === "failed") {
      orderStatus = "failed";
    } else if (data.status === "expired") {
      orderStatus = "expired";
    } else if (data.status === "refunded") {
      orderStatus = "refunded";
    }

    // Update order status if orderId provided
    if (orderId && (data.status === "paid" || data.status === "authorized")) {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: orderStatus,
          notes: JSON.stringify({
            streetpay_transaction_id: data.id,
            streetpay_status: data.status,
            paid_at: new Date().toISOString(),
          }),
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("Error updating order:", updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: data.status,
        orderStatus,
        isPaid: data.status === "paid" || data.status === "authorized",
        transactionId: data.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error checking status:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
