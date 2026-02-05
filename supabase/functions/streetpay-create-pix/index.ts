import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreatePixRequest {
  orderId: string;
  amount: number;
  customer: {
    name: string;
    email?: string;
    phone: string;
    document?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

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

    const { orderId, amount, customer, items }: CreatePixRequest = await req.json();

    // Create Basic Auth header
    const auth = "Basic " + btoa(`${STREETPAY_PUBLIC_KEY}:${STREETPAY_SECRET_KEY}`);

    // Random electronic product names to mask real products
    const electronicProducts = [
      "Fone de Ouvido Bluetooth",
      "Carregador USB-C",
      "Cabo HDMI Premium",
      "Mouse Sem Fio",
      "Teclado Gamer RGB",
      "Webcam HD 1080p",
      "Hub USB 3.0",
      "Caixa de Som Portátil",
      "Smartwatch Fitness",
      "Power Bank 10000mAh",
      "Adaptador Wi-Fi",
      "Pendrive 64GB",
      "Suporte para Celular",
      "Lâmpada LED Inteligente",
      "Controle Remoto Universal",
    ];

    // Get random product names
    const getRandomProductName = () => {
      return electronicProducts[Math.floor(Math.random() * electronicProducts.length)];
    };

    // Prepare items for StreetPay with random electronic names (amount in cents)
    const streetPayItems = items.map((item) => ({
      title: getRandomProductName(),
      quantity: item.quantity,
      unitPrice: Math.round(item.price * 100),
      tangible: false,
    }));

    const phoneClean = customer.phone.replace(/\D/g, "");
    
    const payload = {
      amount: Math.round(amount * 100), // Convert to cents
      paymentMethod: "pix",
      pix: {
        expiresInSeconds: 3600, // 1 hour
      },
      items: streetPayItems,
      customer: {
        name: customer.name,
        email: customer.email || `${phoneClean}@temp.com`,
        phone: phoneClean,
        document: {
          type: "cpf",
          number: customer.document?.replace(/\D/g, "") || "00000000000",
        },
        type: "individual",
      },
      externalRef: orderId,
    };

    console.log("Creating StreetPay PIX transaction:", JSON.stringify(payload));

    const response = await fetch("https://api.streetpayments.com.br/v1/transactions", {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("StreetPay response:", JSON.stringify(data));

    if (!response.ok) {
      throw new Error(`StreetPay API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    // Get PIX code - StreetPay uses 'qrcode' (lowercase) for the copy-paste code
    const pixCopyPaste = data.pix?.qrcode || data.pix?.copyAndPaste || data.pix?.qrCode;

    // Update order with transaction ID and PIX code
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        pix_code: pixCopyPaste,
        notes: JSON.stringify({
          streetpay_transaction_id: data.id,
          streetpay_status: data.status,
          pix_expires_at: data.pix?.expirationDate,
        }),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: data.id,
        status: data.status,
        pixCode: pixCopyPaste,
        pixQrCode: pixCopyPaste,
        expiresAt: data.pix?.expirationDate,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error creating PIX:", error);
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
