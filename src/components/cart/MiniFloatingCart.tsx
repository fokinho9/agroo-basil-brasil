import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useFloatingButton } from '@/contexts/FloatingButtonContext';
import { formatCurrency } from '@/lib/utils';

export function MiniFloatingCart() {
  const { items, getItemCount, getTotal, setIsOpen, shouldAnimate, setShouldAnimate } = useCart();
  const { isFloatingBuyVisible } = useFloatingButton();
  const [isAnimating, setIsAnimating] = useState(false);
  const location = useLocation();
  const itemCount = getItemCount();

  // Hide on checkout page
  const isCheckoutPage = location.pathname === '/checkout';

  useEffect(() => {
    if (shouldAnimate) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setShouldAnimate(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [shouldAnimate, setShouldAnimate]);

  if (items.length === 0 || isCheckoutPage) return null;

  return (
    <div 
      className={`fixed right-4 md:right-6 z-40 transition-all duration-300 ${
        isFloatingBuyVisible ? 'bottom-28 md:bottom-32' : 'bottom-6 md:bottom-8'
      }`}
    >
      <Button
        size="lg"
        onClick={() => setIsOpen(true)}
        className={`
          relative flex items-center gap-3 md:gap-4 px-5 md:px-6 py-7 md:py-8 shadow-xl rounded-full
          bg-primary hover:bg-primary/90 text-primary-foreground
          transition-all duration-300
          ${isAnimating ? 'animate-bounce scale-110' : ''}
        `}
      >
        <div className="relative">
          <ShoppingBag className="h-7 w-7 md:h-8 md:w-8" />
          <span className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {itemCount}
          </span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs md:text-sm opacity-80">Ver carrinho</span>
          <span className="font-bold text-base md:text-lg">{formatCurrency(getTotal())}</span>
        </div>
      </Button>
    </div>
  );
}

