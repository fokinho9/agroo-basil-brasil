import { useState, useRef } from 'react';
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
import { firecrawlApi } from '@/lib/api/firecrawl';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Check, AlertCircle, FileUp, X, Globe, Sparkles, Loader2, Link2, FileText, FileX } from 'lucide-react';

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
}

function parseCSV(csvText: string): ProductRow[] {
  const lines = csvText.split('\n');
  const products: ProductRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const imageUrl = values[1]?.replace(/"/g, '') || '';
    const name = values[3]?.replace(/"/g, '') || '';
    const brand = values[4]?.replace(/"/g, '') || '';
    
    const priceStr = values[5]?.replace(/"/g, '') || '';
    let currentPrice = 0;
    
    if (!priceStr.includes('consulta') && priceStr.includes('R$')) {
      currentPrice = parseFloat(priceStr.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
    }
    
    const originalPriceStr = values[10]?.replace(/"/g, '').replace(/[R$\s.]/g, '').replace(',', '.') || '0';
    const originalPrice = parseFloat(originalPriceStr) || 0;

    if (name) {
      products.push({
        name: name.length > 100 ? name.substring(0, 97) + '...' : name,
        image_url: imageUrl,
        original_price: originalPrice > currentPrice ? originalPrice : 0,
        price: currentPrice,
        brand,
      });
    }
  }

  return products;
}

export default function AdminImportPage() {
  const { data: categories } = useCategories();
  const { data: products, refetch: refetchProducts } = useAdminProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  
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

  // Process bulk import
  const handleBulkScrape = async () => {
    if (bulkUrls.length === 0) {
      toast.error('Adicione produtos à lista primeiro');
      return;
    }

    setIsBulkScraping(true);
    setBulkProgress(0);

    let processed = 0;
    let success = 0;

    for (const item of bulkUrls) {
      try {
        const response = await firecrawlApi.scrape(item.url, {
          formats: ['markdown'],
          onlyMainContent: true,
        });

        if (response.success) {
          const description = response.data?.markdown || response.data?.data?.markdown || '';
          
          if (description) {
            const cleanedDescription = cleanProductDescription(description);

            if (cleanedDescription) {
              await updateProduct.mutateAsync({
                id: item.productId,
                description: cleanedDescription,
              });
              success++;
            }
          }
        }
      } catch (error) {
        console.error('Error scraping:', error);
      }

      processed++;
      setBulkProgress(Math.round((processed / bulkUrls.length) * 100));
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    toast.success(`Importação em massa concluída! ${success}/${bulkUrls.length} descrições importadas.`);
    setBulkUrls([]);
    setIsBulkScraping(false);
    refetchProducts();
  };

  // Auto bulk import - scrape site and match products
  const handleAutoBulkImport = async () => {
    if (!autoBulkUrl.trim()) {
      toast.error('Digite a URL do site');
      return;
    }

    if (!products || products.length === 0) {
      toast.error('Nenhum produto cadastrado para importar descrições');
      return;
    }

    setIsAutoBulkScraping(true);
    setAutoBulkProgress(0);
    setAutoBulkResults({ matched: 0, updated: 0 });

    try {
      // First, map the site to find all product URLs
      toast.info('Mapeando o site para encontrar produtos...');
      
      const mapResponse = await firecrawlApi.map ? 
        await firecrawlApi.map(autoBulkUrl, { limit: 500 }) :
        { success: false, error: 'Map not available' };
      
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

      toast.success(`${productUrls.length} páginas de produtos encontradas. Importando descrições...`);

      let matched = 0;
      let updated = 0;

      // Process each product URL
      for (let i = 0; i < Math.min(productUrls.length, 100); i++) {
        const productUrl = productUrls[i];
        
        try {
          const response = await firecrawlApi.scrape(productUrl, {
            formats: ['markdown'],
            onlyMainContent: true,
          });

          if (response.success) {
            const markdown = response.data?.markdown || response.data?.data?.markdown || '';
            
            // Try to extract product name from the page
            const titleMatch = markdown.match(/^#?\s*(.+?)(?:\n|$)/m);
            const scrapedTitle = titleMatch ? titleMatch[1].trim() : '';
            
            if (scrapedTitle) {
              // Find matching product by name similarity
              const matchingProduct = products.find(p => {
                const pName = p.name.toLowerCase().trim();
                const sName = scrapedTitle.toLowerCase().trim();
                
                // Exact match or contains
                return pName === sName || 
                       pName.includes(sName) || 
                       sName.includes(pName) ||
                       // Fuzzy match: at least 80% of words match
                       (() => {
                         const pWords = pName.split(/\s+/);
                         const sWords = sName.split(/\s+/);
                         const matchCount = pWords.filter(w => sWords.some(sw => sw.includes(w) || w.includes(sw))).length;
                         return matchCount >= Math.min(pWords.length, sWords.length) * 0.6;
                       })();
              });

              if (matchingProduct) {
                matched++;
                
                const cleanedDescription = cleanProductDescription(markdown);
                
                if (cleanedDescription && cleanedDescription.length > 20) {
                  await updateProduct.mutateAsync({
                    id: matchingProduct.id,
                    description: cleanedDescription,
                  });
                  updated++;
                }
              }
            }
          }
        } catch (error) {
          console.error('Error processing URL:', productUrl, error);
        }

        setAutoBulkProgress(Math.round(((i + 1) / Math.min(productUrls.length, 100)) * 100));
        setAutoBulkResults({ matched, updated });
        
        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
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

        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="csv">Importar CSV</TabsTrigger>
            <TabsTrigger value="description">Importar Descrição</TabsTrigger>
            <TabsTrigger value="reviews">Gerar Avaliações</TabsTrigger>
          </TabsList>

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

            {/* Bulk Import */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Importação em Massa de Descrições
                </CardTitle>
                <CardDescription>
                  Adicione vários produtos à lista e importe todas as descrições de uma vez
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isBulkScraping ? (
                  <div className="space-y-4">
                    <Progress value={bulkProgress} />
                    <p className="text-sm text-muted-foreground text-center">
                      Importando descrições... {bulkProgress}%
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
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Importar {bulkUrls.length} Descrições
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
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
