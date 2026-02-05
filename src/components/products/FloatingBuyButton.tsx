import { useState, useEffect } from 'react';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, createWhatsAppLink } from '@/lib/utils';

interface FloatingBuyButtonProps {
  productName: string;
  price: number;
  isHighValue: boolean;
  onAddToCart: () => void;
  whatsappNumber: string;
}

export function FloatingBuyButton({ 
  productName, 
  price, 
  isHighValue, 
  onAddToCart,
  whatsappNumber 
}: FloatingBuyButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 400px
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleWhatsApp = () => {
    const isPriceOnRequest = price === 0;
    const message = isPriceOnRequest
      ? `Olá! Gostaria de saber o preço do produto: ${productName}`
      : `Olá! Tenho interesse no produto: ${productName} - ${formatCurrency(price)}`;
    window.open(createWhatsAppLink(whatsappNumber, message), '_blank');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-primary shadow-2xl p-4 animate-slide-up">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{productName}</p>
          <p className="text-xl font-bold text-primary">
            {price === 0 ? 'Sob consulta' : formatCurrency(price)}
          </p>
        </div>
        {isHighValue ? (
          <Button 
            size="lg" 
            className="gap-2 whitespace-nowrap"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-5 w-5" />
            WhatsApp
          </Button>
        ) : (
          <Button 
            size="lg" 
            className="gap-2 whitespace-nowrap"
            onClick={onAddToCart}
          >
            <ShoppingCart className="h-5 w-5" />
            Comprar
          </Button>
        )}
      </div>
    </div>
  );
}
