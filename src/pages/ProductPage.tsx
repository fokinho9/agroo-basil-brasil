import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ShoppingCart, MessageCircle, Minus, Plus, ChevronLeft, ChevronRight, Check, Star, Shield, Truck, CreditCard, Clock, Users, Flame, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useProduct } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useProductReviews, generateFakeReviews } from '@/hooks/useReviews';
import { ProductReviews } from '@/components/products/ProductReviews';
import { RelatedProducts } from '@/components/products/RelatedProducts';
import { FloatingBuyButton } from '@/components/products/FloatingBuyButton';
import { ProductStoreSection } from '@/components/products/ProductStoreSection';
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

// Urgency countdown timer component
function UrgencyTimer() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 47,
    seconds: 33
  });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return {
            ...prev,
            seconds: prev.seconds - 1
          };
        } else if (prev.minutes > 0) {
          return {
            ...prev,
            minutes: prev.minutes - 1,
            seconds: 59
          };
        } else if (prev.hours > 0) {
          return {
            hours: prev.hours - 1,
            minutes: 59,
            seconds: 59
          };
        }
        return {
          hours: 23,
          minutes: 59,
          seconds: 59
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return <div className="flex items-center gap-2 text-sm">
      <Clock className="h-4 w-4 text-destructive" />
      <span className="text-muted-foreground">Oferta expira em:</span>
      <span className="font-bold text-destructive">
        {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>;
}

// Social proof - viewing now component
function ViewingNow() {
  const [viewers, setViewers] = useState(Math.floor(Math.random() * 15) + 5);
  useEffect(() => {
    const timer = setInterval(() => {
      setViewers(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const newVal = prev + change;
        return Math.max(3, Math.min(25, newVal));
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  return <div className="flex items-center gap-2 text-sm bg-secondary/20 px-3 py-2 rounded-lg">
      <div className="flex -space-x-2">
        <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center">
          <Users className="h-3 w-3 text-primary" />
        </div>
      </div>
      <span className="text-secondary-foreground font-medium">
        {viewers} pessoas visualizando agora
      </span>
    </div>;
}
export default function ProductPage() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const {
    data: product,
    isLoading
  } = useProduct(id!);
  const {
    addToCart
  } = useCart();
  const {
    data: settings
  } = useSiteSettings();
  const {
    data: reviews,
    refetch: refetchReviews
  } = useProductReviews(id!);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviewsGenerated, setReviewsGenerated] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Auto-generate reviews if none exist
  useEffect(() => {
    async function generateReviewsIfNeeded() {
      if (!id || reviewsGenerated || !product) return;
      const {
        data: existingReviews
      } = await supabase.from('reviews').select('id').eq('product_id', id).limit(1);
      if (!existingReviews || existingReviews.length === 0) {
        const reviewCount = Math.floor(Math.random() * 29) + 2;
        const fakeReviews = generateFakeReviews(id, reviewCount);
        for (const review of fakeReviews) {
          await supabase.from('reviews').insert(review);
        }
        refetchReviews();
      }
      setReviewsGenerated(true);
    }
    generateReviewsIfNeeded();
  }, [id, product, reviewsGenerated, refetchReviews]);
  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>;
  }
  if (!product) {
    return <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">Produto não encontrado</h1>
      </div>;
  }
  const images = product.images?.length > 0 ? product.images : [product.image_url || '/placeholder.svg'];
  const isPriceOnRequest = product.price === 0;
  const isHighValue = product.price > 500 || isPriceOnRequest;
  const hasDiscount = product.original_price && product.original_price > product.price && !isPriceOnRequest;
  const discountPercent = hasDiscount ? Math.round((product.original_price! - product.price) / product.original_price! * 100) : 0;
  const averageRating = reviews && reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

  // Fake stock for scarcity
  const fakeStock = Math.floor(Math.random() * 8) + 3;
  const handleWhatsApp = () => {
    const whatsappSettings = settings?.whatsapp || {
      number: '5511999999999'
    };
    const message = isPriceOnRequest ? `Olá! Gostaria de saber o preço do produto: ${product.name}` : `Olá! Tenho interesse no produto: ${product.name} - ${formatCurrency(product.price)}`;
    window.open(createWhatsAppLink(whatsappSettings.number, message), '_blank');
  };
  const handleAddToCart = () => {
    setIsAddingToCart(true);
    addToCart(product, quantity);
    setTimeout(() => setIsAddingToCart(false), 1000);
  };
  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % images.length);
  };
  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
  };
  return <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square bg-muted rounded-xl overflow-hidden">
            <img src={images[currentImageIndex]} alt={product.name} className="w-full h-full object-cover" />
            {hasDiscount && <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-base px-3 py-1.5 flex items-center gap-1">
                <Flame className="h-4 w-4" />
                -{discountPercent}% OFF
              </Badge>}
            {images.length > 1 && <>
                <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-card/90 hover:bg-card rounded-full p-2 shadow-lg">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-card/90 hover:bg-card rounded-full p-2 shadow-lg">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>}
          </div>
          {images.length > 1 && <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((image, index) => <button key={index} onClick={() => setCurrentImageIndex(index)} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </button>)}
            </div>}
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          {/* Category & Title */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              {product.category?.name || 'Sem categoria'}
            </p>
            <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Rating with better display */}
          {reviews && reviews.length > 0 && <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(star => <Star key={star} className={`h-5 w-5 ${star <= Math.round(averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />)}
              </div>
              <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">
                ({reviews.length} avaliações verificadas)
              </span>
            </div>}

          {/* Social Proof */}
          <ViewingNow />

          {/* Price Section with urgency */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            {hasDiscount && <UrgencyTimer />}
            
            <div className="flex items-baseline gap-3">
              {isPriceOnRequest ? <span className="text-2xl font-bold text-primary">
                  Preço sob consulta
                </span> : <>
                  <span className="text-3xl md:text-4xl font-bold text-primary">
                    {formatCurrency(product.price)}
                  </span>
                  {hasDiscount && <span className="text-lg text-muted-foreground line-through">
                      {formatCurrency(product.original_price!)}
                    </span>}
                </>}
            </div>
            
            {!isPriceOnRequest && <div className="space-y-1">
                <p className="text-sm text-success font-medium flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  12x de {formatCurrency(product.price / 12)} sem juros
                </p>
                <p className="text-sm text-muted-foreground">
                  ou <span className="font-medium text-foreground">{formatCurrency(product.price * 0.95)}</span> à vista no PIX (5% off)
                </p>
              </div>}
          </div>

          {/* Scarcity - Low Stock Warning */}
          {!isPriceOnRequest && <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-[#61436b]">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  Restam apenas {fakeStock} unidades!
                </p>
                <Progress value={fakeStock / 15 * 100} className="h-1.5 mt-1 [&>div]:bg-[hsl(286,23%,33%)]" />
              </div>
            </div>}

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-success" />
            <span className="text-success font-medium">Disponível - Envio imediato</span>
          </div>

          {/* Quantity and Add to Cart */}
          {!isHighValue && <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center border-2 border-border rounded-xl overflow-hidden">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-3 hover:bg-muted transition-colors">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-lg">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} className="p-3 hover:bg-muted transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button size="lg" className="flex-1 gap-2 h-12 text-sm md:text-base font-bold" onClick={handleAddToCart} disabled={isAddingToCart}>
                  <ShoppingCart className="h-5 w-5" />
                  {isAddingToCart ? 'Adicionado!' : 'COMPRAR AGORA'}
                </Button>
              </div>
            </div>}

          {isHighValue && <Button size="lg" className="w-full gap-2 h-14 text-base font-bold" onClick={handleWhatsApp}>
              <MessageCircle className="h-5 w-5" />
              SOLICITAR ORÇAMENTO VIA WHATSAPP
            </Button>}

          {/* Trust Badges - More prominent */}
          <div className="grid grid-cols-3 gap-2 pt-4">
            <div className="flex flex-col items-center text-center p-3 bg-muted/50 rounded-xl border border-border">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium">Frete Rápido</span>
              <span className="text-[10px] text-muted-foreground">Todo Brasil</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-muted/50 rounded-xl border border-border">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium">Compra Segura</span>
              <span className="text-[10px] text-muted-foreground">100% Protegido</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-muted/50 rounded-xl border border-border">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium">12x Sem Juros</span>
              <span className="text-[10px] text-muted-foreground">Cartão de crédito</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      {product.description && <>
          <Separator className="my-10" />
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Descrição do Produto
            </h2>
            <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
              {formatDescription(product.description)}
            </div>
          </div>
        </>}

      {/* Reviews Section */}
      <Separator className="my-10" />
      <div>
        <h2 className="text-xl font-bold text-foreground mb-6">
          Avaliações dos Clientes ({reviews?.length || 0})
        </h2>
        <ProductReviews productId={id!} />
      </div>

      {/* Related Products */}
      <Separator className="my-10" />
      <RelatedProducts productId={id!} categoryId={product.category_id} />

      {/* Store Section with Instagram */}
      <ProductStoreSection />

      {/* Floating Buy Button */}
      <FloatingBuyButton productName={product.name} price={product.price} isHighValue={isHighValue} onAddToCart={handleAddToCart} whatsappNumber={settings?.whatsapp?.number || '5511999999999'} />
    </div>;
}