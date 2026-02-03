import { useEffect } from 'react';
import { Check } from 'lucide-react';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface CartNotificationProps {
  product: Product | null;
  isVisible: boolean;
  onClose: () => void;
}

export function CartNotification({ product, isVisible, onClose }: CartNotificationProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible || !product) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className="flex items-center gap-3 bg-card border border-border shadow-lg rounded-lg px-4 py-3 max-w-md">
        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Check className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            Produto adicionado ao carrinho!
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {product.name} - {formatCurrency(product.price)}
          </p>
        </div>
        <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.name}
          className="w-12 h-12 object-cover rounded"
        />
      </div>
    </div>
  );
}
