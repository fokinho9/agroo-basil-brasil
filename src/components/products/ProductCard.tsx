import { Link } from 'react-router-dom';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { formatCurrency, createWhatsAppLink } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { data: settings } = useSiteSettings();

  const isHighValue = product.price > 500;
  const hasDiscount = product.original_price && product.original_price > product.price;
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

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <Link to={`/produto/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.image_url || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {hasDiscount && (
            <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
              -{discountPercent}%
            </Badge>
          )}
          {product.featured && (
            <Badge className="absolute top-2 right-2 bg-secondary text-secondary-foreground">
              Destaque
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
            {product.category?.name || 'Sem categoria'}
          </p>
          <h3 className="font-medium text-foreground line-clamp-2 min-h-[2.5rem] mb-2">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-bold text-primary">
              {formatCurrency(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.original_price!)}
              </span>
            )}
          </div>
          {isHighValue ? (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={(e) => {
                e.preventDefault();
                handleWhatsApp();
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Solicite via WhatsApp
            </Button>
          ) : (
            <Button className="w-full gap-2" onClick={handleAddToCart}>
              <ShoppingCart className="h-4 w-4" />
              Comprar Agora
            </Button>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
