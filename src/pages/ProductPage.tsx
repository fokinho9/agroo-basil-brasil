import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ShoppingCart, MessageCircle, Minus, Plus, ChevronLeft, ChevronRight, Check, Star, Shield, Truck, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useProduct } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useProductReviews, useCreateReview, generateFakeReviews } from '@/hooks/useReviews';
import { ProductReviews } from '@/components/products/ProductReviews';
import { formatCurrency, createWhatsAppLink } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// Helper to convert **text** to bold
function formatDescription(text: string): JSX.Element[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id!);
  const { addToCart } = useCart();
  const { data: settings } = useSiteSettings();
  const { data: reviews, refetch: refetchReviews } = useProductReviews(id!);
  const createReview = useCreateReview();
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviewsGenerated, setReviewsGenerated] = useState(false);

  // Auto-generate reviews if none exist
  useEffect(() => {
    async function generateReviewsIfNeeded() {
      if (!id || reviewsGenerated || !product) return;
      
      // Check if reviews already exist
      const { data: existingReviews } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', id)
        .limit(1);

      if (!existingReviews || existingReviews.length === 0) {
        // Generate 2-30 random reviews
        const reviewCount = Math.floor(Math.random() * 29) + 2;
        const fakeReviews = generateFakeReviews(id, reviewCount);
        
        // Insert reviews one by one to avoid duplicates
        for (const review of fakeReviews) {
          await supabase.from('reviews').insert(review);
        }
        
        // Refetch reviews after generating
        refetchReviews();
      }
      
      setReviewsGenerated(true);
    }

    generateReviewsIfNeeded();
  }, [id, product, reviewsGenerated, refetchReviews]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">Produto não encontrado</h1>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : [product.image_url || '/placeholder.svg'];
  const isPriceOnRequest = product.price === 0;
  const isHighValue = product.price > 500 || isPriceOnRequest;
  const hasDiscount = product.original_price && product.original_price > product.price && !isPriceOnRequest;
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;
  
  const averageRating = reviews && reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 0;

  const handleWhatsApp = () => {
    const whatsappSettings = settings?.whatsapp || { number: '5511999999999' };
    const message = isPriceOnRequest
      ? `Olá! Gostaria de saber o preço do produto: ${product.name}`
      : `Olá! Tenho interesse no produto: ${product.name} - ${formatCurrency(product.price)}`;
    window.open(createWhatsAppLink(whatsappSettings.number, message), '_blank');
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            <img
              src={images[currentImageIndex]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {hasDiscount && (
              <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground text-lg px-3 py-1">
                -{discountPercent}% OFF
              </Badge>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-card/80 hover:bg-card rounded-full p-2"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-card/80 hover:bg-card rounded-full p-2"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {product.category?.name || 'Sem categoria'}
          </p>
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-3 leading-tight">
            {product.name}
          </h1>
            
            {/* Rating */}
            {reviews && reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(averageRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({reviews.length} avaliações)
                </span>
              </div>
            )}
            
            <div className="flex items-baseline gap-3">
              {isPriceOnRequest ? (
                <span className="text-2xl font-bold text-primary">
                  Preço sob consulta
                </span>
              ) : (
                <>
                  <span className="text-3xl font-bold text-primary">
                    {formatCurrency(product.price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-xl text-muted-foreground line-through">
                      {formatCurrency(product.original_price!)}
                    </span>
                  )}
                </>
              )}
            </div>
            {!isPriceOnRequest && (
              <p className="text-sm text-muted-foreground mt-2">
                ou 12x de {formatCurrency(product.price / 12)} sem juros
              </p>
            )}
          </div>

          {/* Stock Status - Always show as available */}
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-success" />
            <span className="text-success font-medium">Disponível</span>
          </div>

          {/* Quantity and Add to Cart */}
          {!isHighValue && (
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-border rounded-lg">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 hover:bg-muted transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-medium text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-2 hover:bg-muted transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button size="lg" className="flex-1 gap-2" onClick={handleAddToCart}>
                <ShoppingCart className="h-5 w-5" />
                Adicionar ao Carrinho
              </Button>
            </div>
          )}

          {isHighValue && (
            <Button
              size="lg"
              variant="outline"
              className="w-full gap-2"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-5 w-5" />
              Solicite via WhatsApp
            </Button>
          )}

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
            <div className="flex flex-col items-center text-center p-2 bg-muted/50 rounded-lg">
              <Truck className="h-5 w-5 text-primary mb-1" />
              <span className="text-xs text-muted-foreground">Frete Rápido</span>
            </div>
            <div className="flex flex-col items-center text-center p-2 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-primary mb-1" />
              <span className="text-xs text-muted-foreground">Compra Segura</span>
            </div>
            <div className="flex flex-col items-center text-center p-2 bg-muted/50 rounded-lg">
              <CreditCard className="h-5 w-5 text-primary mb-1" />
              <span className="text-xs text-muted-foreground">12x Sem Juros</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section - Above Reviews */}
      {product.description && (
        <>
          <Separator className="my-12" />
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Descrição do Produto
            </h2>
            <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
              {formatDescription(product.description)}
            </div>
          </div>
        </>
      )}

      {/* Reviews Section */}
      <Separator className="my-12" />
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Avaliações dos Clientes
        </h2>
        <ProductReviews productId={id!} />
      </div>
    </div>
  );
}
