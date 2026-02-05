import { Link } from 'react-router-dom';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { formatCurrency, createWhatsAppLink } from '@/lib/utils';
import { ProductImageCarousel } from './ProductImageCarousel';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { data: settings } = useSiteSettings();

  const isPriceOnRequest = product.price === 0;
  const isHighValue = product.price > 500 || isPriceOnRequest;
  const hasDiscount = product.original_price && product.original_price > product.price && !isPriceOnRequest;
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  const handleWhatsApp = () => {
    const whatsappSettings = settings?.whatsapp || {
      number: '5511999999999',
    };
    const message = `Olá! Tenho interesse no produto: ${product.name} - ${formatCurrency(product.price)}`;
    window.open(createWhatsAppLink(whatsappSettings.number, message), '_blank');
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  // Combine main image with additional images for carousel
  const allImages = [
    product.image_url,
    ...(product.images || [])
  ].filter((img): img is string => !!img && img.trim() !== '');

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 bg-transparent border-0 shadow-none">
      <Link to={`/produto/${product.id}`}>
        <div className="relative">
          <ProductImageCarousel 
            images={allImages.length > 0 ? allImages : ['/placeholder.svg']} 
            productName={product.name}
            className="group-hover:scale-[1.02] transition-transform duration-300"
          />
          {hasDiscount && (
            <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground z-10">
              -{discountPercent}%
            </Badge>
          )}
          {product.featured && (
            <Badge className="absolute top-2 right-2 bg-secondary text-secondary-foreground z-10">
              Destaque
            </Badge>
          )}
        </div>
        <CardContent className="p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-muted-foreground mb-1 uppercase tracking-wide truncate">
            {product.category?.name || 'Sem categoria'}
          </p>
          <h3 className="font-medium text-foreground line-clamp-2 min-h-[2.25rem] md:min-h-[2.5rem] mb-2 text-sm md:text-base">
            {product.name}
          </h3>
          <div className="flex flex-col gap-1 mb-3">
            {isPriceOnRequest ? (
              <span className="text-sm md:text-lg font-bold text-primary">
                Sob consulta
              </span>
            ) : (
              <div className="flex flex-wrap items-baseline gap-1 md:gap-2">
                <span className="text-sm md:text-lg font-bold text-primary">
                  {formatCurrency(product.price)}
                </span>
                {hasDiscount && (
                  <span className="text-xs md:text-sm text-muted-foreground line-through">
                    {formatCurrency(product.original_price!)}
                  </span>
                )}
              </div>
            )}
          </div>
          {isHighValue ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-10"
              onClick={(e) => {
                e.preventDefault();
                handleWhatsApp();
              }}
            >
              <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Solicite via</span> WhatsApp
            </Button>
          ) : (
            <Button size="sm" className="w-full gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-10 bg-success hover:bg-success/90 text-white" onClick={handleAddToCart}>
              <ShoppingCart className="h-3 w-3 md:h-4 md:w-4" />
              Comprar
            </Button>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
