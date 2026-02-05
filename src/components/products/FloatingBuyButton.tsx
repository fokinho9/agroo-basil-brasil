import { useState, useEffect } from 'react';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, createWhatsAppLink } from '@/lib/utils';
import { useFloatingButton } from '@/contexts/FloatingButtonContext';

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
  const { setIsFloatingBuyVisible } = useFloatingButton();

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 400px
      const visible = window.scrollY > 400;
      setIsVisible(visible);
      setIsFloatingBuyVisible(visible);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      setIsFloatingBuyVisible(false);
    };
  }, [setIsFloatingBuyVisible]);

  const handleWhatsApp = () => {
    const isPriceOnRequest = price === 0;
    const message = isPriceOnRequest
      ? `Olá! Gostaria de saber o preço do produto: ${productName}`
      : `Olá! Tenho interesse no produto: ${productName} - ${formatCurrency(price)}`;
    window.open(createWhatsAppLink(whatsappNumber, message), '_blank');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-primary shadow-2xl p-3 md:p-4 animate-slide-up">
      <div className="container mx-auto flex items-center justify-between gap-3 md:gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm text-muted-foreground truncate">{productName}</p>
          <p className="text-lg md:text-xl font-bold text-primary">
            {price === 0 ? 'Sob consulta' : formatCurrency(price)}
          </p>
        </div>
        {price === 0 ? (
          <Button 
            size="lg" 
            className="gap-2 whitespace-nowrap text-sm md:text-base px-4 md:px-6"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </Button>
        ) : (
          <Button 
            size="lg" 
            className="gap-2 whitespace-nowrap bg-success hover:bg-success/90 text-white text-sm md:text-base px-4 md:px-6"
            onClick={onAddToCart}
          >
            Comprar Agora
          </Button>
        )}
      </div>
    </div>
  );
}

