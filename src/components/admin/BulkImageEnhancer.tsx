import { useState } from 'react';
import { Loader2, Sparkles, Check, X, ImageIcon, ArrowRight, Play, Pause } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  images: string[] | null;
}

interface EnhancedImage {
  productId: string;
  productName: string;
  originalUrl: string;
  enhancedUrl: string;
  imageIndex: number; // 0 = main image, 1+ = additional images
}

interface BulkImageEnhancerProps {
  products: Product[];
  onUpdate: () => void;
}

export function BulkImageEnhancer({ products, onUpdate }: BulkImageEnhancerProps) {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentProduct, setCurrentProduct] = useState<string>('');
  const [enhancedImages, setEnhancedImages] = useState<EnhancedImage[]>([]);
  const [errors, setErrors] = useState<{ productName: string; error: string }[]>([]);

  // Filter products that have images
  const productsWithImages = products.filter(p => p.image_url);

  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const selectAll = () => {
    if (selectedProducts.size === productsWithImages.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(productsWithImages.map(p => p.id)));
    }
  };

  const enhanceImage = async (imageUrl: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('enhance-image', {
        body: { imageUrl },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      return data?.enhancedImageUrl || null;
    } catch (err) {
      console.error('Error enhancing image:', err);
      throw err;
    }
  };

  const handleEnhance = async () => {
    if (selectedProducts.size === 0) {
      toast.error('Selecione pelo menos um produto');
      return;
    }

    setIsEnhancing(true);
    setIsPaused(false);
    setProgress(0);
    setEnhancedImages([]);
    setErrors([]);

    const selectedProductsList = productsWithImages.filter(p => selectedProducts.has(p.id));
    let processed = 0;

    for (const product of selectedProductsList) {
      if (isPaused) {
        // Wait while paused
        await new Promise(resolve => {
          const checkPause = setInterval(() => {
            if (!isPaused) {
              clearInterval(checkPause);
              resolve(true);
            }
          }, 500);
        });
      }

      setCurrentProduct(product.name);

      try {
        // Enhance main image
        if (product.image_url) {
          const enhancedUrl = await enhanceImage(product.image_url);
          
          if (enhancedUrl) {
            setEnhancedImages(prev => [...prev, {
              productId: product.id,
              productName: product.name,
              originalUrl: product.image_url!,
              enhancedUrl,
              imageIndex: 0,
            }]);
          }
        }

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err: any) {
        setErrors(prev => [...prev, {
          productName: product.name,
          error: err.message || 'Erro desconhecido',
        }]);

        // If rate limited, wait longer
        if (err.message?.includes('429') || err.message?.includes('limite')) {
          toast.error('Limite de requisições atingido. Aguardando...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      }

      processed++;
      setProgress(Math.round((processed / selectedProductsList.length) * 100));
    }

    setIsEnhancing(false);
    setCurrentProduct('');
    toast.success(`Melhoria concluída! ${enhancedImages.length} imagens processadas.`);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleApplyEnhanced = async (enhanced: EnhancedImage) => {
    try {
      const product = products.find(p => p.id === enhanced.productId);
      if (!product) return;

      if (enhanced.imageIndex === 0) {
        // Update main image
        const { error } = await supabase
          .from('products')
          .update({ image_url: enhanced.enhancedUrl })
          .eq('id', enhanced.productId);

        if (error) throw error;
      } else {
        // Update additional image
        const newImages = [...(product.images || [])];
        newImages[enhanced.imageIndex - 1] = enhanced.enhancedUrl;
        
        const { error } = await supabase
          .from('products')
          .update({ images: newImages })
          .eq('id', enhanced.productId);

        if (error) throw error;
      }

      // Remove from enhanced list
      setEnhancedImages(prev => prev.filter(e => 
        !(e.productId === enhanced.productId && e.imageIndex === enhanced.imageIndex)
      ));

      toast.success('Imagem atualizada!');
      onUpdate();
    } catch (err: any) {
      toast.error('Erro ao aplicar imagem: ' + err.message);
    }
  };

  const handleApplyAll = async () => {
    for (const enhanced of enhancedImages) {
      await handleApplyEnhanced(enhanced);
    }
  };

  const handleDiscardEnhanced = (enhanced: EnhancedImage) => {
    setEnhancedImages(prev => prev.filter(e => 
      !(e.productId === enhanced.productId && e.imageIndex === enhanced.imageIndex)
    ));
  };

  return (
    <div className="space-y-6">
      {/* Product Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Selecionar Produtos
          </CardTitle>
          <CardDescription>
            Escolha os produtos cujas imagens serão melhoradas com IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
            >
              {selectedProducts.size === productsWithImages.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedProducts.size} de {productsWithImages.length} selecionados
            </span>
          </div>

          <ScrollArea className="h-[300px] border rounded-lg">
            <div className="p-4 space-y-2">
              {productsWithImages.map((product) => (
                <div
                  key={product.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedProducts.has(product.id) && "bg-primary/10"
                  )}
                  onClick={() => toggleProduct(product.id)}
                >
                  <Checkbox
                    checked={selectedProducts.has(product.id)}
                    onCheckedChange={() => toggleProduct(product.id)}
                  />
                  <img
                    src={product.image_url || '/placeholder.svg'}
                    alt={product.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <span className="flex-1 truncate text-sm">{product.name}</span>
                </div>
              ))}
            </div>
          </ScrollArea>

          {!isEnhancing ? (
            <Button
              onClick={handleEnhance}
              disabled={selectedProducts.size === 0}
              className="w-full"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Melhorar {selectedProducts.size} Imagens com IA
            </Button>
          ) : (
            <div className="space-y-4">
              <Progress value={progress} />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate max-w-[200px]">
                  {currentProduct}
                </span>
                <span className="flex items-center gap-2">
                  <span>{progress}%</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePauseResume}
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Continuar
                      </>
                    ) : (
                      <>
                        <Pause className="h-3 w-3 mr-1" />
                        Pausar
                      </>
                    )}
                  </Button>
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Images Results */}
      {enhancedImages.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-success" />
                Imagens Melhoradas
                </CardTitle>
                <CardDescription>
                  Compare o antes e depois e aplique as melhorias desejadas
                </CardDescription>
              </div>
              <Button onClick={handleApplyAll} size="sm">
                <Check className="h-4 w-4 mr-1" />
                Aplicar Todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {enhancedImages.map((enhanced, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium truncate max-w-md">{enhanced.productName}</h4>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApplyEnhanced(enhanced)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Aplicar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDiscardEnhanced(enhanced)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Descartar
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Before */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded">
                          ANTES
                        </span>
                      </div>
                      <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                        <img
                          src={enhanced.originalUrl}
                          alt="Original"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* After */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-success/20 text-success text-xs font-medium rounded">
                          DEPOIS
                        </span>
                      </div>
                      <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                        <img
                          src={enhanced.enhancedUrl}
                          alt="Melhorada"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <X className="h-5 w-5" />
              Erros ({errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-auto">
              {errors.map((err, idx) => (
                <div key={idx} className="text-sm p-2 bg-destructive/10 rounded">
                  <span className="font-medium">{err.productName}:</span>{' '}
                  <span className="text-muted-foreground">{err.error}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
