import { useState, useRef, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateProduct, useAdminProducts, useUpdateProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { generateFakeReviews } from '@/hooks/useReviews';
import { useActiveImportJob, useCreateImportJob, useCancelImportJob } from '@/hooks/useImportJobs';
import { firecrawlApi } from '@/lib/api/firecrawl';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Check, AlertCircle, FileUp, X, Globe, Sparkles, Loader2, Link2, FileText, FileX, ImageIcon, RefreshCw } from 'lucide-react';
import { BulkImageEnhancer } from '@/components/admin/BulkImageEnhancer';
import { SiteImportCard } from '@/components/admin/SiteImportCard';
import { FailedImportsCard } from '@/components/admin/FailedImportsCard';

// Function to clean and extract only the product description
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

interface ProductRow {
  name: string;
  image_url: string;
  original_price: number;
  price: number;
  brand: string;
  source_url?: string;
}

// Detect CSV format based on headers
type CSVFormat = 'protechorse' | 'simplescraper-extended' | 'simplescraper-full' | 'simplescraper-simple' | 'unknown';

function detectCSVFormat(headerLine: string): CSVFormat {
  const lowerHeader = headerLine.toLowerCase();
  
  // Check for SimpleScraper formats
  if (lowerHeader.includes('product-image-area') && lowerHeader.includes('product-title')) {
    // Extended format has label-custom, product-price-old, btn-primary columns (18+ columns)
    if (lowerHeader.includes('label-custom') && lowerHeader.includes('product-price-old')) {
      return 'simplescraper-extended';
    }
    // Full format has product-title_link and product-price-new columns (6 columns)
    if (lowerHeader.includes('product-title_link') && lowerHeader.includes('product-price-new')) {
      return 'simplescraper-full';
    }
    // Simple format only has: product-image-area, product-title, text-dark, price-discount (4 columns)
    return 'simplescraper-simple';
  }
  
  if (lowerHeader.includes('sku') || lowerHeader.includes('imagem')) {
    return 'protechorse';
  }
  return 'unknown';
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim().replace(/^"|"$/g, ''));
  return values;
}

function parseBrazilianPrice(priceStr: string): number {
  if (!priceStr || priceStr.toLowerCase().includes('consulta')) return 0;
  // Remove R$, spaces, dots (thousand separator), and replace comma with dot
  const cleaned = priceStr.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function parseCSV(csvText: string): ProductRow[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const format = detectCSVFormat(headerLine);
  const products: ProductRow[] = [];

  console.log('Detected CSV format:', format);

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    let product: ProductRow | null = null;

    if (format === 'simplescraper-extended') {
      // Extended SimpleScraper format with 18 columns:
      // 0: product-image-area (image URL)
      // 1: label-custom (e.g., "Frete grátis")
      // 2: product-title (name)
      // 3: product-title_link (source URL)
      // 4: text-dark (brand)
      // 5: price-discount (à vista/Pix price - current price)
      // 13: product-price-old (original price)
      // 15: product-price-new (installment total price)
      const imageUrl = values[0] || '';
      const name = values[2] || '';
      const sourceUrl = values[3] || '';
      const brand = values[4] || '';
      const pixPrice = parseBrazilianPrice(values[5] || '');
      const oldPrice = parseBrazilianPrice(values[13] || '');
      const newPrice = parseBrazilianPrice(values[15] || '');
      
      // Use Pix price as current (best price), old price as original
      const currentPrice = pixPrice || newPrice;
      const originalPrice = oldPrice > currentPrice ? oldPrice : 0;

      if (name) {
        product = {
          name: name.length > 100 ? name.substring(0, 97) + '...' : name,
          image_url: imageUrl,
          original_price: originalPrice,
          price: currentPrice,
          brand,
          source_url: sourceUrl,
        };
      }
    } else if (format === 'simplescraper-full') {
      // Full SimpleScraper format with 6 columns:
      // 0: product-image-area (image URL)
      // 1: product-title (name)
      // 2: product-title_link (source URL)
      // 3: text-dark (brand)
      // 4: price-discount (discounted price - original)
      // 5: product-price-new (current price)
      const imageUrl = values[0] || '';
      const name = values[1] || '';
      const sourceUrl = values[2] || '';
      const brand = values[3] || '';
      const discountPrice = parseBrazilianPrice(values[4] || '');
      const newPrice = parseBrazilianPrice(values[5] || '');
      
      // Use newPrice as current, discountPrice as original (if higher)
      const currentPrice = newPrice || discountPrice;
      const originalPrice = discountPrice > currentPrice ? discountPrice : 0;

      if (name) {
        product = {
          name: name.length > 100 ? name.substring(0, 97) + '...' : name,
          image_url: imageUrl,
          original_price: originalPrice,
          price: currentPrice,
          brand,
          source_url: sourceUrl,
        };
      }
    } else if (format === 'simplescraper-simple') {
      // Simple SimpleScraper format with 4 columns:
      // 0: product-image-area (image URL)
      // 1: product-title (name)
      // 2: text-dark (brand)
      // 3: price-discount (price)
      const imageUrl = values[0] || '';
      const name = values[1] || '';
      const brand = values[2] || '';
      const price = parseBrazilianPrice(values[3] || '');

      if (name) {
        product = {
          name: name.length > 100 ? name.substring(0, 97) + '...' : name,
          image_url: imageUrl,
          original_price: 0,
          price: price,
          brand,
        };
      }
    } else {
      // Original protechorse format
      const imageUrl = values[1] || '';
      const name = values[3] || '';
      const brand = values[4] || '';
      const priceStr = values[5] || '';
      const currentPrice = parseBrazilianPrice(priceStr);
      const originalPriceStr = values[10] || '';
      const originalPrice = parseBrazilianPrice(originalPriceStr);

      if (name) {
        product = {
          name: name.length > 100 ? name.substring(0, 97) + '...' : name,
          image_url: imageUrl,
          original_price: originalPrice > currentPrice ? originalPrice : 0,
          price: currentPrice,
          brand,
        };
      }
    }

    if (product) {
      products.push(product);
    }
  }

  return products;
}

export default function AdminImportPage() {
  const { data: categories } = useCategories();
  const { data: products, refetch: refetchProducts } = useAdminProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  
  // Background import job hooks
  const { data: activeDescriptionJob, refetch: refetchJob } = useActiveImportJob('descriptions');
  const createImportJob = useCreateImportJob();
  const cancelImportJob = useCancelImportJob();
  
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; errors: number }>({ success: 0, errors: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [parsedProducts, setParsedProducts] = useState<ProductRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single product description import
  const [singleProductId, setSingleProductId] = useState('');
  const [singleProductUrl, setSingleProductUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [previewDescription, setPreviewDescription] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Bulk description import
  const [bulkUrls, setBulkUrls] = useState<{ productId: string; url: string }[]>([]);
  const [isBulkScraping, setIsBulkScraping] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  // Auto bulk import by URL
  const [autoBulkUrl, setAutoBulkUrl] = useState('');
  const [isAutoBulkScraping, setIsAutoBulkScraping] = useState(false);
  const [autoBulkProgress, setAutoBulkProgress] = useState(0);
  const [autoBulkResults, setAutoBulkResults] = useState<{ matched: number; updated: number }>({ matched: 0, updated: 0 });

  // Review generation state
  const [isGeneratingReviews, setIsGeneratingReviews] = useState(false);
  const [reviewProgress, setReviewProgress] = useState(0);

  // Product description filter
  const [descriptionFilter, setDescriptionFilter] = useState<'all' | 'with' | 'without'>('all');

  // Price correction from CSV
  const [priceFixFile, setPriceFixFile] = useState<File | null>(null);
  const [priceFixProducts, setPriceFixProducts] = useState<ProductRow[]>([]);
  const [isFixingPrices, setIsFixingPrices] = useState(false);
  const [priceFixProgress, setPriceFixProgress] = useState(0);
  const [priceFixResults, setPriceFixResults] = useState<{ matched: number; updated: number; notFound: number }>({ matched: 0, updated: 0, notFound: 0 });
  const priceFixInputRef = useRef<HTMLInputElement>(null);

  // Price correction from URL scraping
  const [priceScrapingUrl, setPriceScrapingUrl] = useState('');
  const [isScrapingPrices, setIsScrapingPrices] = useState(false);
  const [priceScrapingProgress, setPriceScrapingProgress] = useState(0);
  const [priceScrapingResults, setPriceScrapingResults] = useState<{ found: number; matched: number; updated: number }>({ found: 0, matched: 0, updated: 0 });

  // Refetch products when job completes
  useEffect(() => {
    if (activeDescriptionJob?.status === 'completed') {
      refetchProducts();
    }
  }, [activeDescriptionJob?.status, refetchProducts]);

  // Computed product lists
  const productsWithDescription = products?.filter(p => p.description && p.description.trim().length > 20) || [];
  const productsWithoutDescription = products?.filter(p => !p.description || p.description.trim().length <= 20) || [];
  
  const filteredProducts = descriptionFilter === 'with' 
    ? productsWithDescription 
    : descriptionFilter === 'without' 
      ? productsWithoutDescription 
      : products || [];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo CSV');
      return;
    }

    setSelectedFile(file);
    
    const text = await file.text();
    const products = parseCSV(text);
    setParsedProducts(products);
    
    if (products.length === 0) {
      toast.error('Nenhum produto válido encontrado no arquivo');
    } else {
      toast.success(`${products.length} produtos encontrados no arquivo`);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setParsedProducts([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!selectedCategoryId) {
      toast.error('Selecione uma categoria');
      return;
    }

    if (parsedProducts.length === 0) {
      toast.error('Nenhum produto para importar');
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setResults({ success: 0, errors: 0 });

    let success = 0;
    let errors = 0;

    for (let i = 0; i < parsedProducts.length; i++) {
      const product = parsedProducts[i];
      
      try {
        await createProduct.mutateAsync({
          name: product.name,
          description: product.brand ? `Marca: ${product.brand}` : null,
          price: product.price,
          original_price: product.original_price > product.price ? product.original_price : null,
          image_url: product.image_url,
          category_id: selectedCategoryId,
          stock: 10,
          active: true,
          featured: false,
        });
        success++;
      } catch (error) {
        console.error(`Error importing product: ${product.name}`, error);
        errors++;
      }

      setProgress(Math.round(((i + 1) / parsedProducts.length) * 100));
      setResults({ success, errors });

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    toast.success(`Importação concluída! ${success} produtos importados.`);
    setIsImporting(false);
    handleClearFile();
  };

  // Scrape description from single URL
  const handleScrapeSingleDescription = async () => {
    if (!singleProductId) {
      toast.error('Selecione um produto');
      return;
    }

    if (!singleProductUrl.trim()) {
      toast.error('Digite a URL do produto');
      return;
    }

    setIsScraping(true);
    setShowPreview(false);
    setPreviewDescription('');

    try {
      const response = await firecrawlApi.scrape(singleProductUrl, {
        formats: ['markdown'],
        onlyMainContent: true,
      });

      if (!response.success) {
        throw new Error(response.error || 'Falha ao extrair descrição');
      }

      const description = response.data?.markdown || response.data?.data?.markdown || '';
      
      if (!description) {
        throw new Error('Nenhuma descrição encontrada na página');
      }

      const cleanedDescription = cleanProductDescription(description);

      if (!cleanedDescription) {
        toast.error('Não foi possível extrair a descrição do produto. Tente editar manualmente.');
        setPreviewDescription(description.substring(0, 2000));
        setShowPreview(true);
      } else {
        setPreviewDescription(cleanedDescription);
        setShowPreview(true);
        toast.success('Descrição extraída! Revise e confirme abaixo.');
      }
    } catch (error: any) {
      console.error('Error scraping:', error);
      toast.error(error.message || 'Erro ao importar descrição');
    } finally {
      setIsScraping(false);
    }
  };

  // Save the previewed description
  const handleSaveDescription = async () => {
    if (!singleProductId || !previewDescription.trim()) {
      toast.error('Selecione um produto e verifique a descrição');
      return;
    }

    try {
      await updateProduct.mutateAsync({
        id: singleProductId,
        description: previewDescription.trim(),
      });

      toast.success('Descrição salva com sucesso!');
      setSingleProductUrl('');
      setSingleProductId('');
      setPreviewDescription('');
      setShowPreview(false);
    } catch (error: any) {
      toast.error('Erro ao salvar descrição');
    }
  };

  // Add product to bulk import list
  const handleAddToBulk = () => {
    if (!singleProductId || !singleProductUrl.trim()) {
      toast.error('Selecione um produto e digite a URL');
      return;
    }

    if (bulkUrls.find(item => item.productId === singleProductId)) {
      toast.error('Este produto já está na lista');
      return;
    }

    setBulkUrls(prev => [...prev, { productId: singleProductId, url: singleProductUrl }]);
    setSingleProductUrl('');
    setSingleProductId('');
    toast.success('Produto adicionado à lista de importação em massa');
  };

  // Remove from bulk list
  const handleRemoveFromBulk = (productId: string) => {
    setBulkUrls(prev => prev.filter(item => item.productId !== productId));
  };

  // Process bulk import using background job
  const handleBulkScrape = async () => {
    if (bulkUrls.length === 0) {
      toast.error('Adicione produtos à lista primeiro');
      return;
    }

    try {
      await createImportJob.mutateAsync({
        type: 'descriptions',
        total_items: bulkUrls.length,
        config: {
          items: bulkUrls.map(item => ({
            productId: item.productId,
            url: item.url,
          })),
        },
      });

      toast.success(`Importação iniciada em background! Você pode fechar esta página. ${bulkUrls.length} descrições serão importadas.`);
      setBulkUrls([]);
    } catch (error: any) {
      console.error('Error starting import job:', error);
      toast.error(error.message || 'Erro ao iniciar importação');
    }
  };

  // Cancel active job
  const handleCancelJob = async () => {
    if (activeDescriptionJob?.id) {
      try {
        await cancelImportJob.mutateAsync(activeDescriptionJob.id);
        toast.success('Importação cancelada');
      } catch (error) {
        toast.error('Erro ao cancelar importação');
      }
    }
  };

  // Normalize text for matching
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Extract slug from URL
  const extractSlugFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1] || '';
      // Remove numeric ID suffix (e.g., "produto-nome-123" -> "produto nome")
      return normalizeText(lastPart.replace(/-\d+$/, '').replace(/-/g, ' '));
    } catch {
      return '';
    }
  };

  // Match product by slug similarity
  const findMatchingProduct = (url: string, productsList: typeof products) => {
    if (!productsList) return null;
    
    const urlSlug = extractSlugFromUrl(url);
    if (!urlSlug) return null;

    let bestMatch: typeof productsList[0] | null = null;
    let bestScore = 0;

    for (const product of productsList) {
      // Skip products that already have descriptions
      if (product.description && product.description.trim().length > 20) {
        continue;
      }

      const productName = normalizeText(product.name);
      const productWords = productName.split(' ').filter(w => w.length > 2);
      const urlWords = urlSlug.split(' ').filter(w => w.length > 2);

      // Count matching words
      let matchCount = 0;
      for (const pWord of productWords) {
        for (const uWord of urlWords) {
          if (pWord.includes(uWord) || uWord.includes(pWord)) {
            matchCount++;
            break;
          }
        }
      }

      // Calculate score (percentage of product words matched)
      const score = productWords.length > 0 ? matchCount / productWords.length : 0;
      
      // Need at least 50% match and at least 2 words matching
      if (score > bestScore && score >= 0.5 && matchCount >= 2) {
        bestScore = score;
        bestMatch = product;
      }
    }

    return bestMatch;
  };

  // Auto bulk import - scrape site and match products
  const handleAutoBulkImport = async () => {
    if (!autoBulkUrl.trim()) {
      toast.error('Digite a URL do site');
      return;
    }

    // Get only products without description
    const productsToUpdate = products?.filter(p => !p.description || p.description.trim().length <= 20) || [];
    
    if (productsToUpdate.length === 0) {
      toast.error('Todos os produtos já possuem descrição!');
      return;
    }

    setIsAutoBulkScraping(true);
    setAutoBulkProgress(0);
    setAutoBulkResults({ matched: 0, updated: 0 });

    try {
      // First, map the site to find all product URLs
      toast.info('Mapeando o site para encontrar produtos...');
      
      const mapResponse = await firecrawlApi.map(autoBulkUrl, { limit: 1000 });
      
      let productUrls: string[] = [];
      
      if (mapResponse.success && mapResponse.links) {
        // Filter URLs that look like product pages
        productUrls = mapResponse.links.filter((url: string) => 
          url.includes('/produto') || 
          url.includes('/product') || 
          url.includes('/p/') ||
          url.match(/\/[\w-]+-\d+$/) // URL ending with slug-id pattern
        );
      }

      if (productUrls.length === 0) {
        // Fallback: try to scrape the main page for product links
        const scrapeResponse = await firecrawlApi.scrape(autoBulkUrl, {
          formats: ['links' as any],
        });
        
        if (scrapeResponse.success && scrapeResponse.data?.links) {
          productUrls = scrapeResponse.data.links.filter((url: string) =>
            url.includes('/produto') || 
            url.includes('/product') || 
            url.includes('/p/')
          );
        }
      }

      if (productUrls.length === 0) {
        toast.error('Nenhuma página de produto encontrada no site');
        setIsAutoBulkScraping(false);
        return;
      }

      toast.success(`${productUrls.length} páginas encontradas. Buscando correspondências para ${productsToUpdate.length} produtos sem descrição...`);

      let matched = 0;
      let updated = 0;
      let processed = 0;

      // Pre-match URLs to products before scraping
      const urlToProductMap: { url: string; product: typeof productsToUpdate[0] }[] = [];
      
      for (const url of productUrls) {
        const match = findMatchingProduct(url, productsToUpdate);
        if (match) {
          urlToProductMap.push({ url, product: match });
        }
      }

      if (urlToProductMap.length === 0) {
        toast.error('Nenhum produto correspondente encontrado. Verifique se os nomes dos produtos correspondem às URLs do site.');
        setIsAutoBulkScraping(false);
        return;
      }

      toast.info(`${urlToProductMap.length} correspondências encontradas. Importando descrições...`);

      // Process matched URLs
      for (const { url, product } of urlToProductMap) {
        try {
          const response = await firecrawlApi.scrape(url, {
            formats: ['markdown'],
            onlyMainContent: true,
          });

          if (response.success) {
            const markdown = response.data?.markdown || response.data?.data?.markdown || '';
            
            if (markdown) {
              matched++;
              const cleanedDescription = cleanProductDescription(markdown);
              
              if (cleanedDescription && cleanedDescription.length > 20) {
                await updateProduct.mutateAsync({
                  id: product.id,
                  description: cleanedDescription,
                });
                updated++;
                
                // Remove from products list to avoid duplicate updates
                const idx = productsToUpdate.findIndex(p => p.id === product.id);
                if (idx !== -1) {
                  productsToUpdate.splice(idx, 1);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error processing URL:', url, error);
        }

        processed++;
        setAutoBulkProgress(Math.round((processed / urlToProductMap.length) * 100));
        setAutoBulkResults({ matched, updated });
        
        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      toast.success(`Importação automática concluída! ${updated} descrições atualizadas de ${matched} produtos encontrados.`);
      refetchProducts();
    } catch (error: any) {
      console.error('Auto bulk import error:', error);
      toast.error(error.message || 'Erro na importação automática');
    } finally {
      setIsAutoBulkScraping(false);
    }
  };

  const handleGenerateReviews = async () => {
    if (!products || products.length === 0) {
      toast.error('Nenhum produto encontrado');
      return;
    }

    setIsGeneratingReviews(true);
    setReviewProgress(0);

    let processed = 0;

    for (const product of products) {
      const reviewCount = Math.floor(Math.random() * 29) + 2;
      const reviews = generateFakeReviews(product.id, reviewCount);

      for (const review of reviews) {
        try {
          await supabase.from('reviews').insert(review);
        } catch (error) {
          console.error('Error creating review:', error);
        }
      }

      processed++;
      setReviewProgress(Math.round((processed / products.length) * 100));
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    toast.success(`Avaliações geradas para ${processed} produtos!`);
    setIsGeneratingReviews(false);
  };

  const getProductNameById = (id: string) => {
    return products?.find(p => p.id === id)?.name || 'Produto não encontrado';
  };

  // Handle price fix CSV file selection
  const handlePriceFixFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo CSV');
      return;
    }

    setPriceFixFile(file);
    
    const text = await file.text();
    const csvProducts = parseCSV(text);
    setPriceFixProducts(csvProducts);
    
    if (csvProducts.length === 0) {
      toast.error('Nenhum produto válido encontrado no arquivo');
    } else {
      toast.success(`${csvProducts.length} produtos encontrados no CSV`);
    }
  };

  const handleClearPriceFixFile = () => {
    setPriceFixFile(null);
    setPriceFixProducts([]);
    setPriceFixResults({ matched: 0, updated: 0, notFound: 0 });
    if (priceFixInputRef.current) {
      priceFixInputRef.current.value = '';
    }
  };

  // Fix prices by matching image URLs
  const handleFixPrices = async () => {
    if (priceFixProducts.length === 0) {
      toast.error('Carregue um arquivo CSV primeiro');
      return;
    }

    // Get products with zero price
    const zeroPriceProducts = products?.filter(p => p.price === 0) || [];
    
    if (zeroPriceProducts.length === 0) {
      toast.error('Não há produtos com preço zerado');
      return;
    }

    setIsFixingPrices(true);
    setPriceFixProgress(0);
    setPriceFixResults({ matched: 0, updated: 0, notFound: 0 });

    let matched = 0;
    let updated = 0;
    let notFound = 0;
    let processed = 0;

    // Create a map of image URLs to CSV products for faster lookup
    const csvImageMap = new Map<string, ProductRow>();
    for (const csvProduct of priceFixProducts) {
      if (csvProduct.image_url && csvProduct.price > 0) {
        // Normalize URL for comparison
        const normalizedUrl = csvProduct.image_url.trim().toLowerCase();
        csvImageMap.set(normalizedUrl, csvProduct);
      }
    }

    for (const product of zeroPriceProducts) {
      processed++;
      setPriceFixProgress(Math.round((processed / zeroPriceProducts.length) * 100));

      if (!product.image_url) {
        notFound++;
        continue;
      }

      const normalizedProductUrl = product.image_url.trim().toLowerCase();
      const csvMatch = csvImageMap.get(normalizedProductUrl);

      if (csvMatch && csvMatch.price > 0) {
        matched++;
        try {
          await updateProduct.mutateAsync({
            id: product.id,
            price: csvMatch.price,
            original_price: csvMatch.original_price > csvMatch.price ? csvMatch.original_price : null,
          });
          updated++;
        } catch (error) {
          console.error('Error updating price for:', product.name, error);
        }
      } else {
        notFound++;
      }

      setPriceFixResults({ matched, updated, notFound });
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    toast.success(`Correção concluída! ${updated} preços atualizados de ${matched} correspondências encontradas.`);
    setIsFixingPrices(false);
    refetchProducts();
  };

  // Scrape prices from URL
  const handleScrapePrices = async () => {
    if (!priceScrapingUrl.trim()) {
      toast.error('Digite a URL do site');
      return;
    }

    const zeroPriceProducts = products?.filter(p => p.price === 0) || [];
    
    if (zeroPriceProducts.length === 0) {
      toast.error('Não há produtos com preço zerado');
      return;
    }

    setIsScrapingPrices(true);
    setPriceScrapingProgress(0);
    setPriceScrapingResults({ found: 0, matched: 0, updated: 0 });

    try {
      // First, map the site to find all product URLs
      toast.info('Mapeando o site para encontrar produtos...');
      
      const mapResponse = await firecrawlApi.map(priceScrapingUrl, { limit: 2000 });
      
      let productUrls: string[] = [];
      
      if (mapResponse.success && mapResponse.links) {
        productUrls = mapResponse.links.filter((url: string) => 
          url.includes('/produto') || 
          url.includes('/product') || 
          url.includes('/p/') ||
          url.match(/\/[\w-]+-\d+$/)
        );
      }

      if (productUrls.length === 0) {
        toast.error('Nenhuma página de produto encontrada no site');
        setIsScrapingPrices(false);
        return;
      }

      toast.success(`${productUrls.length} páginas encontradas. Buscando preços...`);
      setPriceScrapingResults({ found: productUrls.length, matched: 0, updated: 0 });

      let matched = 0;
      let updated = 0;
      let processed = 0;

      // Create name lookup map for zero price products
      const productNameMap = new Map<string, typeof zeroPriceProducts[0]>();
      for (const product of zeroPriceProducts) {
        const normalizedName = normalizeText(product.name);
        productNameMap.set(normalizedName, product);
      }

      for (const url of productUrls) {
        try {
          const urlSlug = extractSlugFromUrl(url);
          
          // Check if URL matches any zero price product
          let matchedProduct: typeof zeroPriceProducts[0] | undefined;
          
          for (const product of zeroPriceProducts) {
            const productName = normalizeText(product.name);
            const productWords = productName.split(' ').filter(w => w.length > 2);
            const urlWords = urlSlug.split(' ').filter(w => w.length > 2);

            let matchCount = 0;
            for (const pWord of productWords) {
              for (const uWord of urlWords) {
                if (pWord.includes(uWord) || uWord.includes(pWord)) {
                  matchCount++;
                  break;
                }
              }
            }

            const score = productWords.length > 0 ? matchCount / productWords.length : 0;
            
            if (score >= 0.5 && matchCount >= 2) {
              matchedProduct = product;
              break;
            }
          }

          if (matchedProduct) {
            // Scrape the page to get the price
            const scrapeResponse = await firecrawlApi.scrape(url, {
              formats: ['markdown'],
              onlyMainContent: true,
            });

            if (scrapeResponse.success) {
              const markdown = scrapeResponse.data?.markdown || scrapeResponse.data?.data?.markdown || '';
              
              // Extract price from markdown
              const priceMatches = markdown.match(/R\$\s*([\d.,]+)/g);
              if (priceMatches && priceMatches.length > 0) {
                // Get the first reasonable price
                let foundPrice = 0;
                for (const priceMatch of priceMatches) {
                  const price = parseBrazilianPrice(priceMatch);
                  if (price > 0 && price < 100000) { // Reasonable price range
                    foundPrice = price;
                    break;
                  }
                }

                if (foundPrice > 0) {
                  matched++;
                  await updateProduct.mutateAsync({
                    id: matchedProduct.id,
                    price: foundPrice,
                  });
                  updated++;
                  
                  // Remove from list to avoid duplicates
                  const idx = zeroPriceProducts.findIndex(p => p.id === matchedProduct!.id);
                  if (idx !== -1) {
                    zeroPriceProducts.splice(idx, 1);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error processing URL:', url, error);
        }

        processed++;
        setPriceScrapingProgress(Math.round((processed / productUrls.length) * 100));
        setPriceScrapingResults({ found: productUrls.length, matched, updated });
        
        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      toast.success(`Busca concluída! ${updated} preços atualizados.`);
      refetchProducts();
    } catch (error: any) {
      console.error('Price scraping error:', error);
      toast.error(error.message || 'Erro ao buscar preços');
    } finally {
      setIsScrapingPrices(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Importar</h1>
          <p className="text-muted-foreground">Importe produtos, descrições e gere avaliações</p>
        </div>

        {/* Product Description Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className={`cursor-pointer transition-all ${descriptionFilter === 'all' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
            onClick={() => setDescriptionFilter('all')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Produtos</p>
                  <p className="text-2xl font-bold">{products?.length || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <FileUp className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${descriptionFilter === 'with' ? 'ring-2 ring-green-500' : 'hover:bg-muted/50'}`}
            onClick={() => setDescriptionFilter('with')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Com Descrição</p>
                  <p className="text-2xl font-bold text-green-600">{productsWithDescription.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${descriptionFilter === 'without' ? 'ring-2 ring-orange-500' : 'hover:bg-muted/50'}`}
            onClick={() => setDescriptionFilter('without')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sem Descrição</p>
                  <p className="text-2xl font-bold text-orange-600">{productsWithoutDescription.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <FileX className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtered Product List */}
        {descriptionFilter !== 'all' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {descriptionFilter === 'with' ? 'Produtos com Descrição' : 'Produtos sem Descrição'}
              </CardTitle>
              <CardDescription>
                {filteredProducts.length} produtos encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg max-h-64 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-3">Produto</th>
                      <th className="text-left p-3">Descrição</th>
                      <th className="text-right p-3">Preço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.slice(0, 50).map((product) => (
                      <tr key={product.id} className="border-t hover:bg-muted/50">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {product.image_url && (
                              <img 
                                src={product.image_url} 
                                alt="" 
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <span className="truncate max-w-xs">{product.name}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            product.description && product.description.length > 20
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {product.description && product.description.length > 20
                              ? `${product.description.substring(0, 50)}...`
                              : 'Sem descrição'
                            }
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium">
                          R$ {product.price.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length > 50 && (
                      <tr className="border-t">
                        <td colSpan={3} className="p-3 text-center text-muted-foreground">
                          ... e mais {filteredProducts.length - 50} produtos
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="prices" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="prices">Corrigir Preços</TabsTrigger>
            <TabsTrigger value="csv">Importar CSV</TabsTrigger>
            <TabsTrigger value="site-import" className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              Importar Site
            </TabsTrigger>
            <TabsTrigger value="failed-imports" className="flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Com Erro
            </TabsTrigger>
            <TabsTrigger value="description">Descrição</TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5" />
              Imagens
            </TabsTrigger>
            <TabsTrigger value="reviews">Avaliações</TabsTrigger>
          </TabsList>

          {/* Price Fix Tab */}
          <TabsContent value="prices" className="space-y-6">
            {/* Price Scraping from URL */}
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Buscar Preços por URL
                </CardTitle>
                <CardDescription>
                  Cole a URL do site e o sistema irá buscar automaticamente os preços dos produtos zerados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isScrapingPrices ? (
                  <div className="space-y-4">
                    <Progress value={priceScrapingProgress} />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso: {priceScrapingProgress}%</span>
                      <div className="flex gap-4">
                        <span className="text-muted-foreground">
                          {priceScrapingResults.found} páginas encontradas
                        </span>
                        <span className="text-muted-foreground">
                          {priceScrapingResults.matched} correspondências
                        </span>
                        <span className="flex items-center gap-1 text-green-600">
                          <Check className="h-4 w-4" /> {priceScrapingResults.updated} atualizados
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>URL do Site</Label>
                      <Input 
                        placeholder="https://loja.com.br" 
                        value={priceScrapingUrl}
                        onChange={(e) => setPriceScrapingUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        O sistema irá mapear o site, encontrar páginas de produtos e extrair os preços automaticamente
                      </p>
                    </div>

                    <Button 
                      onClick={handleScrapePrices}
                      disabled={!priceScrapingUrl.trim() || (products?.filter(p => p.price === 0).length || 0) === 0}
                      size="lg"
                      className="w-full"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Buscar Preços ({products?.filter(p => p.price === 0).length || 0} produtos zerados)
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Price Fix from CSV */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileUp className="h-5 w-5" />
                  Corrigir via CSV
                </CardTitle>
                <CardDescription>
                  Carregue o CSV com os preços corretos para atualizar produtos com preço zerado.
                  A correspondência é feita pela URL da imagem.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-600">Preço Zerado</p>
                    <p className="text-2xl font-bold text-orange-700">
                      {products?.filter(p => p.price === 0).length || 0}
                    </p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">No CSV</p>
                    <p className="text-2xl font-bold">{priceFixProducts.length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-600">Correspondências</p>
                    <p className="text-2xl font-bold text-green-700">{priceFixResults.matched}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600">Atualizados</p>
                    <p className="text-2xl font-bold text-blue-700">{priceFixResults.updated}</p>
                  </div>
                </div>

                {isFixingPrices ? (
                  <div className="space-y-4">
                    <Progress value={priceFixProgress} />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso: {priceFixProgress}%</span>
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1 text-green-600">
                          <Check className="h-4 w-4" /> {priceFixResults.updated} atualizados
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          {priceFixResults.notFound} sem correspondência
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Arquivo CSV com Preços</Label>
                      {priceFixFile ? (
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <FileUp className="h-8 w-8 text-primary" />
                            <div>
                              <p className="font-medium">{priceFixFile.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {priceFixProducts.length} produtos com preço no CSV
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={handleClearPriceFixFile}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Clique para selecionar</span> o arquivo CSV
                            </p>
                          </div>
                          <input
                            ref={priceFixInputRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handlePriceFixFileSelect}
                          />
                        </label>
                      )}
                    </div>

                    <Button 
                      onClick={handleFixPrices}
                      disabled={priceFixProducts.length === 0 || (products?.filter(p => p.price === 0).length || 0) === 0}
                      className="w-full"
                      size="lg"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Corrigir Preços via CSV ({products?.filter(p => p.price === 0).length || 0} produtos)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CSV Import Tab */}
          <TabsContent value="csv">
            <Card>
              <CardHeader>
                <CardTitle>Importação em Massa de Produtos</CardTitle>
                <CardDescription>
                  Faça upload de um arquivo CSV com os produtos para importar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isImporting ? (
                  <div className="space-y-4">
                    <Progress value={progress} />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso: {progress}%</span>
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1 text-green-600">
                          <Check className="h-4 w-4" /> {results.success} sucesso
                        </span>
                        {results.errors > 0 && (
                          <span className="flex items-center gap-1 text-destructive">
                            <AlertCircle className="h-4 w-4" /> {results.errors} erros
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Arquivo CSV</Label>
                      {selectedFile ? (
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <FileUp className="h-8 w-8 text-primary" />
                            <div>
                              <p className="font-medium">{selectedFile.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {parsedProducts.length} produtos encontrados
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={handleClearFile}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Clique para selecionar</span> ou arraste um arquivo CSV
                            </p>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".csv"
                            onChange={handleFileSelect}
                          />
                        </label>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Categoria de Destino</Label>
                      <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {parsedProducts.length > 0 && (
                      <div className="space-y-2">
                        <Label>Prévia dos Produtos</Label>
                        <div className="border rounded-lg max-h-48 overflow-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-muted sticky top-0">
                              <tr>
                                <th className="text-left p-2">Nome</th>
                                <th className="text-right p-2">Preço</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsedProducts.slice(0, 10).map((product, index) => (
                                <tr key={index} className="border-t">
                                  <td className="p-2 truncate max-w-xs">{product.name}</td>
                                  <td className="p-2 text-right">
                                    {product.price === 0 ? 'Sob consulta' : `R$ ${product.price.toFixed(2)}`}
                                  </td>
                                </tr>
                              ))}
                              {parsedProducts.length > 10 && (
                                <tr className="border-t">
                                  <td colSpan={2} className="p-2 text-center text-muted-foreground">
                                    ... e mais {parsedProducts.length - 10} produtos
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={handleImport} 
                      disabled={!selectedFile || !selectedCategoryId || parsedProducts.length === 0}
                      size="lg"
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Importar {parsedProducts.length} Produtos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Site Import Tab */}
          <TabsContent value="site-import" className="space-y-6">
            <SiteImportCard 
              categories={categories || []}
              onComplete={refetchProducts}
            />
          </TabsContent>

          {/* Failed Imports Tab */}
          <TabsContent value="failed-imports">
            <FailedImportsCard
              categories={categories || []}
              onComplete={refetchProducts}
            />
          </TabsContent>

          {/* Description Import Tab */}
          <TabsContent value="description" className="space-y-6">
            {/* Auto Bulk Import by URL */}
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  Importação Automática por URL
                </CardTitle>
                <CardDescription>
                  Cole a URL do site e o sistema irá buscar automaticamente as descrições de todos os produtos encontrados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAutoBulkScraping ? (
                  <div className="space-y-4">
                    <Progress value={autoBulkProgress} />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso: {autoBulkProgress}%</span>
                      <div className="flex gap-4">
                        <span className="text-muted-foreground">
                          {autoBulkResults.matched} produtos encontrados
                        </span>
                        <span className="flex items-center gap-1 text-green-600">
                          <Check className="h-4 w-4" /> {autoBulkResults.updated} atualizados
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>URL do Site</Label>
                      <Input 
                        placeholder="https://loja.com.br" 
                        value={autoBulkUrl}
                        onChange={(e) => setAutoBulkUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        O sistema irá mapear o site, encontrar páginas de produtos e importar as descrições automaticamente
                      </p>
                    </div>

                    <Button 
                      onClick={handleAutoBulkImport}
                      disabled={!autoBulkUrl.trim()}
                      size="lg"
                      className="w-full"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Importar Descrições Automaticamente
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Single Product Import */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Importar Descrição de URL
                </CardTitle>
                <CardDescription>
                  Selecione um produto e cole a URL para extrair a descrição automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Selecione o Produto</Label>
                    <Select value={singleProductId} onValueChange={setSingleProductId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>URL do Produto</Label>
                    <Input 
                      placeholder="https://loja.com/produto" 
                      value={singleProductUrl}
                      onChange={(e) => setSingleProductUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleScrapeSingleDescription}
                    disabled={!singleProductId || !singleProductUrl.trim() || isScraping}
                    className="flex-1"
                  >
                    {isScraping ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 mr-2" />
                        Importar Descrição
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleAddToBulk}
                    disabled={!singleProductId || !singleProductUrl.trim()}
                  >
                    Adicionar à Lista
                  </Button>
                </div>

                {/* Preview and Edit Description */}
                {showPreview && (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    <Label>Prévia da Descrição (edite se necessário)</Label>
                    <Textarea
                      value={previewDescription}
                      onChange={(e) => setPreviewDescription(e.target.value)}
                      rows={8}
                      placeholder="Descrição do produto..."
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSaveDescription} className="flex-1">
                        <Check className="h-4 w-4 mr-2" />
                        Salvar Descrição
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowPreview(false);
                          setPreviewDescription('');
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Background Job Status */}
            {activeDescriptionJob && (activeDescriptionJob.status === 'pending' || activeDescriptionJob.status === 'running') && (
              <Card className="border-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Importação em Andamento (Background)
                  </CardTitle>
                  <CardDescription>
                    Esta importação continua mesmo se você fechar a página
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress 
                    value={activeDescriptionJob.total_items > 0 
                      ? (activeDescriptionJob.processed_items / activeDescriptionJob.total_items) * 100 
                      : 0
                    } 
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Progresso: {activeDescriptionJob.processed_items}/{activeDescriptionJob.total_items}
                    </span>
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1 text-green-600">
                        <Check className="h-4 w-4" /> {activeDescriptionJob.success_count} sucesso
                      </span>
                      {activeDescriptionJob.error_count > 0 && (
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertCircle className="h-4 w-4" /> {activeDescriptionJob.error_count} erros
                        </span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelJob}
                    className="w-full"
                  >
                    Cancelar Importação
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Bulk Import */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Importação em Massa de Descrições
                </CardTitle>
                <CardDescription>
                  Adicione vários produtos à lista e importe todas as descrições de uma vez.
                  <strong className="block mt-1 text-primary">A importação continua mesmo se você fechar a página!</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {createImportJob.isPending ? (
                  <div className="space-y-4">
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground text-center">
                      Iniciando importação em background...
                    </p>
                  </div>
                ) : (
                  <>
                    {bulkUrls.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum produto na lista.</p>
                        <p className="text-sm">Adicione produtos usando o formulário acima.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="border rounded-lg max-h-60 overflow-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-muted sticky top-0">
                              <tr>
                                <th className="text-left p-2">Produto</th>
                                <th className="text-left p-2">URL</th>
                                <th className="p-2 w-10"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {bulkUrls.map((item) => (
                                <tr key={item.productId} className="border-t">
                                  <td className="p-2 truncate max-w-[200px]">
                                    {getProductNameById(item.productId)}
                                  </td>
                                  <td className="p-2 truncate max-w-[200px] text-muted-foreground">
                                    {item.url}
                                  </td>
                                  <td className="p-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8"
                                      onClick={() => handleRemoveFromBulk(item.productId)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <Button 
                          onClick={handleBulkScrape}
                          className="w-full"
                          size="lg"
                          disabled={activeDescriptionJob?.status === 'running' || activeDescriptionJob?.status === 'pending'}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Importar {bulkUrls.length} Descrições em Background
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Enhancement Tab */}
          <TabsContent value="images">
            <BulkImageEnhancer 
              products={products || []} 
              onUpdate={refetchProducts} 
            />
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Gerar Avaliações
                </CardTitle>
                <CardDescription>
                  Gere avaliações automáticas para todos os produtos (2-30 por produto)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isGeneratingReviews ? (
                  <div className="space-y-4">
                    <Progress value={reviewProgress} />
                    <p className="text-sm text-muted-foreground text-center">
                      Gerando avaliações... {reviewProgress}%
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>{products?.length || 0}</strong> produtos serão processados.
                        Cada produto receberá entre 2 e 30 avaliações aleatórias com nomes e comentários variados.
                      </p>
                    </div>

                    <Button 
                      onClick={handleGenerateReviews}
                      disabled={!products || products.length === 0}
                      size="lg"
                      className="w-full"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar Avaliações para Todos os Produtos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
