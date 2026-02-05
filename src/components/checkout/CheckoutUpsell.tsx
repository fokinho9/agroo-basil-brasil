import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Product } from '@/types';

export function CheckoutUpsell() {
  const { items, addToCart } = useCart();
  const cartProductIds = items.map(item => item.product.id);

  const { data: product } = useQuery({
    queryKey: ['checkout-upsell', cartProductIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('active', true)
        .gt('price', 0)
        .lte('price', 100)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Filter out products already in cart and return just one random product
      const available = (data || []).filter(p => !cartProductIds.includes(p.id));
      if (available.length === 0) return null;
      
      // Pick a random product from available
      const randomIndex = Math.floor(Math.random() * available.length);
      return available[randomIndex];
    },
    enabled: items.length > 0,
  });

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart(product as Product, 1);
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">
          ✨ Aproveite e leve também
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <img
            src={product.image_url || '/placeholder.svg'}
            alt={product.name}
            className="w-16 h-16 object-cover rounded-lg"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground line-clamp-2">
              {product.name}
            </p>
            <p className="text-sm text-primary font-bold mt-1">
              {formatCurrency(product.price)}
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            className="shrink-0 gap-1"
            onClick={handleAddToCart}
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
