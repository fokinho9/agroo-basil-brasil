import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';

export function CartUpsell() {
  const { items, addToCart } = useCart();
  const cartProductIds = items.map(item => item.product.id);

  const { data: products } = useQuery({
    queryKey: ['cart-upsell', cartProductIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('active', true)
        .gt('price', 0)
        .lte('price', 150)
        .limit(10);

      if (error) throw error;
      
      // Filter out products already in cart
      return (data || []).filter(p => !cartProductIds.includes(p.id)).slice(0, 4);
    },
    enabled: items.length > 0,
  });

  if (!products || products.length === 0) return null;

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };

  return (
    <div className="border-t border-border pt-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
        Aproveite e leve também:
      </h3>
      <div className="space-y-2">
        {products.map((product) => (
          <div 
            key={product.id} 
            className="flex items-center gap-2 bg-muted/50 rounded-lg p-2"
          >
            <img
              src={product.image_url || '/placeholder.svg'}
              alt={product.name}
              className="w-12 h-12 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {product.name}
              </p>
              <p className="text-xs text-primary font-semibold">
                {formatCurrency(product.price)}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={() => handleAddToCart(product as Product)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
