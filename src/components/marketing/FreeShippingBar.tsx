import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { Truck } from 'lucide-react';

export function FreeShippingBar() {
  const { getTotal } = useCart();
  const total = getTotal();

  const { data: minValue } = useQuery({
    queryKey: ['free-shipping-min'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('value').eq('key', 'free_shipping_min').single();
      return (data?.value as any)?.value || 0;
    },
    staleTime: 60000,
  });

  if (!minValue || minValue <= 0) return null;

  const remaining = Math.max(0, minValue - total);
  const progress = Math.min((total / minValue) * 100, 100);
  const achieved = remaining <= 0;

  return (
    <div className={`w-full py-2 px-4 text-center text-sm ${achieved ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
      <div className="container mx-auto flex items-center justify-center gap-2">
        <Truck className="h-4 w-4 flex-shrink-0" />
        {achieved ? (
          <span className="font-medium">🎉 Parabéns! Você ganhou FRETE GRÁTIS!</span>
        ) : (
          <span>
            Falta <strong>R$ {remaining.toFixed(2)}</strong> para <strong>FRETE GRÁTIS</strong>
          </span>
        )}
      </div>
      {!achieved && (
        <div className="container mx-auto mt-1">
          <div className="h-1.5 rounded-full bg-border overflow-hidden max-w-xs mx-auto">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
