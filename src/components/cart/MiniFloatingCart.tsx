import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useFloatingButton } from '@/contexts/FloatingButtonContext';
import { formatCurrency } from '@/lib/utils';

export function MiniFloatingCart() {
  const { items, getItemCount, getTotal, setIsOpen, shouldAnimate, setShouldAnimate } = useCart();
  const { isFloatingBuyVisible } = useFloatingButton();
  const [isAnimating, setIsAnimating] = useState(false);
  const itemCount = getItemCount();

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

  if (items.length === 0) return null;

  return (
    <div 
      className={`fixed right-4 z-40 transition-all duration-300 ${
        isFloatingBuyVisible ? 'bottom-24' : 'bottom-6'
      }`}
    >
      <Button
        size="lg"
        onClick={() => setIsOpen(true)}
        className={`
          relative flex items-center gap-3 md:gap-4 px-4 md:px-5 py-6 md:py-7 shadow-xl rounded-full
          bg-primary hover:bg-primary/90 text-primary-foreground
          transition-all duration-300
          ${isAnimating ? 'animate-bounce scale-110' : ''}
        `}
      >
        <div className="relative">
          <ShoppingBag className="h-6 w-6 md:h-7 md:w-7" />
          <span className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {itemCount}
          </span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs md:text-sm opacity-80">Ver carrinho</span>
          <span className="font-bold text-sm md:text-base">{formatCurrency(getTotal())}</span>
        </div>
      </Button>
    </div>
  );
}

