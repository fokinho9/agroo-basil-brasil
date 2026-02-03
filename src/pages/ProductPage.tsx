import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { ShoppingCart, MessageCircle, Minus, Plus, ChevronLeft, ChevronRight, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useProduct } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useProductReviews } from '@/hooks/useReviews';
import { ProductReviews } from '@/components/products/ProductReviews';
import { formatCurrency, createWhatsAppLink } from '@/lib/utils';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id!);
  const { addToCart } = useCart();
  const { data: settings } = useSiteSettings();
  const { data: reviews } = useProductReviews(id!);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
              {product.category?.name || 'Sem categoria'}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
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

          {product.description && (
            <div>
              <h3 className="font-semibold text-foreground mb-2">Descrição</h3>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          )}

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
                  className="p-3 hover:bg-muted transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-3 hover:bg-muted transition-colors"
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

          <Button
            variant="secondary"
            size="lg"
            className="w-full gap-2"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-5 w-5" />
            Dúvidas? Fale Conosco
          </Button>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-success" />
              Envio para todo Brasil
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-success" />
              Pagamento via PIX
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-success" />
              Garantia de qualidade
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-success" />
              Suporte especializado
            </div>
          </div>
        </div>
      </div>

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
