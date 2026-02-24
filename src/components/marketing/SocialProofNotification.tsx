import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag, X } from 'lucide-react';

export function SocialProofNotification() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<{ name: string; city: string; product: string } | null>(null);

  const { data: enabled } = useQuery({
    queryKey: ['social-proof-setting'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('value').eq('key', 'social_proof_enabled').single();
      return (data?.value as any)?.value ?? false;
    },
    staleTime: 60000,
  });

  const { data: orders } = useQuery({
    queryKey: ['recent-orders-social'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('customer_name, customer_city, customer_state, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!enabled,
    staleTime: 120000,
  });

  const { data: orderItems } = useQuery({
    queryKey: ['recent-order-items-social'],
    queryFn: async () => {
      if (!orders?.length) return [];
      const ids = orders.map((o: any) => o.id).filter(Boolean);
      if (ids.length === 0) return [];
      const { data } = await supabase.from('order_items').select('order_id, product_name').limit(50);
      return data || [];
    },
    enabled: !!orders?.length,
    staleTime: 120000,
  });

  useEffect(() => {
    if (!enabled || !orders?.length) return;

    const show = () => {
      const order = orders[Math.floor(Math.random() * orders.length)] as any;
      const firstName = order.customer_name?.split(' ')[0] || 'Alguém';
      const city = order.customer_city || order.customer_state || 'Brasil';
      setCurrent({ name: firstName, city, product: 'um produto' });
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    };

    const initialDelay = setTimeout(show, 15000);
    const interval = setInterval(show, 45000);

    return () => { clearTimeout(initialDelay); clearInterval(interval); };
  }, [enabled, orders]);

  if (!visible || !current) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50 animate-in slide-in-from-left duration-500 max-w-[280px]">
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <ShoppingBag className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {current.name} de {current.city}
          </p>
          <p className="text-xs text-muted-foreground">acabou de comprar</p>
        </div>
        <button onClick={() => setVisible(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
