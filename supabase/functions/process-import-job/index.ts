import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Clean and extract only the product description
function cleanProductDescription(rawMarkdown: string): string {
  const patternsToRemove = [
    /^-\s*PROTEC HORSE.*$/gim,
    /^-\s*P\/\s*\w+.*$/gim,
    /!\[.*?\].*$/gm,
    /^\s*-\s*!\[.*$/gm,
    /R\$\s*[\d.,]+/g,
    /\d+x\s*de\s*R\$.*$/gim,
    /FRETE\s*GR[ÁA]TIS/gi,
    /ADICIONAR\s*AO\s*CARRINHO/gi,
    /Calcular\s*Prazos.*$/gim,
    /Compartilhe.*$/gim,
    /Mais\s*formas\s*de\s*pagamento.*$/gim,
    /Transfer[êe]ncia\s*Banc[áa]ria.*$/gim,
    /Cart[ãa]o\s*De\s*Cr[ée]dito.*$/gim,
    /Boleto\s*Banc[áa]rio.*$/gim,
    /Pix\s*Condi[çc][õo]es.*$/gim,
    /^\s*\|.*\|.*$/gm,
    /^\s*-\s*\(.*USA\).*$/gm,
    /ESCOLHA\s*A\s*COR.*$/gim,
    /Tamanho\s*de\s*Cal[çc]a.*$/gim,
    /N[ãa]o\s*sei\s*meu\s*CEP/gi,
    /^\s*OK\s*$/gm,
    /com\s*\d+%\s*de\s*desconto/gi,
    /Total:\s*R\$.*$/gim,
    /sem\s*juros/gi,
    /à\s*vista\s*no\s*Pix/gi,
    /Em\s*compras\s*[àa]\s*partir.*$/gim,
    /\\\*/g,
    /^\s*-\s*$/gm,
    /^\s*-\s*\s*$/gm,
  ];

  let cleaned = rawMarkdown;

  for (const pattern of patternsToRemove) {
    cleaned = cleaned.replace(pattern, '');
  }

  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  const descriptionMarkers = [
    /DETALHES\s*DO\s*PRODUTO[:\s]*/gi,
    /DESCRI[ÇC][ÃA]O[:\s]*/gi,
    /SOBRE\s*O\s*PRODUTO[:\s]*/gi,
    /INFORMA[ÇC][ÕO]ES[:\s]*/gi,
  ];

  for (const marker of descriptionMarkers) {
    const match = cleaned.match(marker);
    if (match) {
      const index = cleaned.indexOf(match[0]);
      if (index !== -1) {
        let descriptionPart = cleaned.substring(index + match[0].length);
        const nextSectionMatch = descriptionPart.match(/\n\n(?:AVALIA[ÇC][ÕO]ES|COMENT[ÁA]RIOS|PRODUTOS\s*RELACIONADOS|ESPECIFICA[ÇC][ÕO]ES)/i);
        if (nextSectionMatch) {
          descriptionPart = descriptionPart.substring(0, nextSectionMatch.index);
        }
        cleaned = descriptionPart;
        break;
      }
    }
  }

  cleaned = cleaned
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 2)
    .filter(line => !line.match(/^\s*-\s*$/))
    .filter(line => !line.match(/^\*+$/))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (cleaned.length < 20) {
    return '';
  }

  return cleaned.substring(0, 2000);
}

// Scrape a URL using Firecrawl
async function scrapeUrl(url: string, firecrawlApiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        timeout: 60000,
        waitFor: 5000,
      }),
    });

    if (!response.ok) {
      console.error(`Firecrawl error for ${url}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data.success && data.data?.markdown) {
      return data.data.markdown;
    }
    return null;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlApiKey) {
      return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { jobId } = await req.json();

    if (!jobId) {
      return new Response(JSON.stringify({ error: 'jobId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the job
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (job.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Job is not pending', status: job.status }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update job status to running
    await supabase
      .from('import_jobs')
      .update({ status: 'running' })
      .eq('id', jobId);

    // Process based on job type
    if (job.type === 'descriptions') {
      const config = job.config as { items: { productId: string; url: string }[] };
      const items = config?.items || [];

      let processed = 0;
      let success = 0;
      let errors = 0;
      const results: { productId: string; status: string; description?: string }[] = [];

      for (const item of items) {
        try {
          const markdown = await scrapeUrl(item.url, firecrawlApiKey);
          
          if (markdown) {
            const cleanedDescription = cleanProductDescription(markdown);
            
            if (cleanedDescription && cleanedDescription.length > 20) {
              await supabase
                .from('products')
                .update({ description: cleanedDescription })
                .eq('id', item.productId);
              
              success++;
              results.push({ productId: item.productId, status: 'success', description: cleanedDescription.substring(0, 100) + '...' });
            } else {
              errors++;
              results.push({ productId: item.productId, status: 'no_description' });
            }
          } else {
            errors++;
            results.push({ productId: item.productId, status: 'scrape_failed' });
          }
        } catch (error) {
          errors++;
          results.push({ productId: item.productId, status: 'error', description: String(error) });
        }

        processed++;

        // Update progress every item
        await supabase
          .from('import_jobs')
          .update({ 
            processed_items: processed,
            success_count: success,
            error_count: errors,
            results: results.slice(-50), // Keep last 50 results
          })
          .eq('id', jobId);

        // Delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Mark job as completed
      await supabase
        .from('import_jobs')
        .update({ 
          status: 'completed',
          processed_items: processed,
          success_count: success,
          error_count: errors,
          results,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      return new Response(JSON.stringify({ 
        success: true, 
        processed, 
        successCount: success, 
        errorCount: errors 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown job type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing import job:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
