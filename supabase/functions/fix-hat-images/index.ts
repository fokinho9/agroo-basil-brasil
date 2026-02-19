import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractTexasFarmImages(html: string): string[] {
  // Find all product images - look for unique product/folder/file patterns
  const allImgRegex = /https?:\/\/texasfarmstore\.cdn\.magazord\.com\.br\/img\/(\d{4}\/\d{2}\/produto\/\d+\/\d+\.jpg)/g;
  const found = new Map<string, string>(); // key=folder/file, value=full path
  let m;
  while ((m = allImgRegex.exec(html)) !== null) {
    const path = m[1];
    if (!found.has(path)) {
      found.set(path, path);
    }
  }
  
  // Also try without https
  const noProtoRegex = /texasfarmstore\.cdn\.magazord\.com\.br\/img\/(\d{4}\/\d{2}\/produto\/\d+\/\d+\.jpg)/g;
  while ((m = noProtoRegex.exec(html)) !== null) {
    const path = m[1];
    if (!found.has(path)) {
      found.set(path, path);
    }
  }

  // Get unique paths, take first 4 (gallery images, not related products)
  const paths = [...found.keys()];
  // The first images in the HTML are the gallery thumbnails
  const galleryImages = paths.slice(0, 4).map(
    p => `https://texasfarmstore.cdn.magazord.com.br/img/${p}?ims=fit-in/800x800`
  );
  
  return galleryImages;
}

function extractOgImage(html: string): string | null {
  const m = html.match(/property=["']og:image["']\s*content=["']([^"']+)/i) 
    || html.match(/content=["']([^"']+)["']\s*property=["']og:image/i);
  return m ? m[1] : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { offset = 0, limit = 5 } = await req.json().catch(() => ({}));

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: hats, error } = await supabase
    .from("products")
    .select("id, name, source_url")
    .eq("category_id", "6c6c18c3-07ae-42f1-a196-c0e81f1f237b")
    .eq("active", true)
    .not("source_url", "is", null)
    .order("name")
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: any[] = [];

  for (const hat of hats || []) {
    if (!hat.source_url) continue;

    try {
      console.log(`Processing: ${hat.name} - ${hat.source_url}`);

      const response = await fetch(hat.source_url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "Referer": new URL(hat.source_url).origin + "/",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        // Try Google search as fallback
        results.push({ id: hat.id, name: hat.name, status: "fetch_failed", code: response.status });
        continue;
      }

      const html = await response.text();
      let images: string[] = [];
      const domain = new URL(hat.source_url).hostname;

      if (domain.includes("texasfarmstore")) {
        images = extractTexasFarmImages(html);
        
        // If we got no images from gallery, try og:image
        if (images.length === 0) {
          const ogImg = extractOgImage(html);
          if (ogImg) images = [ogImg];
        }

      } else if (domain.includes("rodeowest")) {
        // Try og:image first for Rodeo West
        const ogImg = extractOgImage(html);
        if (ogImg) {
          images = [ogImg];
        }
        // Also look for product gallery images
        const imgRegex = /https:\/\/cdn\.rodeowest\.com\.br\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi;
        const found = new Set<string>();
        let match;
        while ((match = imgRegex.exec(html)) !== null) {
          const url = match[0].replace(/\?.*$/, '');
          if (!url.includes('thumb') && !url.includes('logo') && !url.includes('banner') && !url.includes('mini_') && !url.includes('favicon') && !url.includes('blog')) {
            found.add(url);
          }
        }
        if (found.size > 0) images = [...found].slice(0, 5);
        
        if (images.length === 0) {
          const ogImg = extractOgImage(html);
          if (ogImg) images = [ogImg];
        }

      } else if (domain.includes("marcadeinox")) {
        const imgRegex = /https:\/\/images\.tcdn\.com\.br\/img\/img_prod\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi;
        const found = new Set<string>();
        let match;
        while ((match = imgRegex.exec(html)) !== null) {
          found.add(match[0]);
        }
        images = [...found].slice(0, 5);

      } else if (domain.includes("cavalariashop")) {
        const imgRegex = /https?:\/\/[^"'\s]*cavalariashop[^"'\s]*\.(?:jpg|jpeg|png|webp)/gi;
        const found = new Set<string>();
        let match;
        while ((match = imgRegex.exec(html)) !== null) {
          const url = match[0];
          if (!url.includes('thumb') && !url.includes('logo') && !url.includes('banner') && !url.includes('icon')) {
            found.add(url);
          }
        }
        images = [...found].slice(0, 5);

      } else {
        const ogImg = extractOgImage(html);
        if (ogImg) images = [ogImg];
      }

      if (images.length > 0) {
        const { error: updateError } = await supabase
          .from("products")
          .update({
            image_url: images[0],
            images: images,
          })
          .eq("id", hat.id);

        results.push({
          id: hat.id,
          name: hat.name,
          status: updateError ? "update_failed" : "success",
          images_found: images.length,
          images,
          error: updateError?.message,
        });
      } else {
        results.push({ id: hat.id, name: hat.name, status: "no_images_found" });
      }

      await new Promise(r => setTimeout(r, 300));

    } catch (e) {
      results.push({ id: hat.id, name: hat.name, status: "error", error: e.message });
    }
  }

  return new Response(JSON.stringify({ total: hats?.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
