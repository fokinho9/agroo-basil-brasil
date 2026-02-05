import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AbandonedCart, CartItem } from '@/types';

export function useAbandonedCarts() {
  return useQuery({
    queryKey: ['abandoned_carts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('abandoned_carts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(cart => ({
        ...cart,
        cart_items: cart.cart_items as unknown as CartItem[],
      })) as AbandonedCart[];
    },
  });
}

export function useCreateAbandonedCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cart: {
      customer_name?: string;
      customer_email?: string;
      customer_phone?: string;
      customer_cep?: string;
      customer_address?: string;
      customer_city?: string;
      customer_state?: string;
      cart_items: CartItem[];
      cart_total: number;
    }) => {
      const { data, error } = await supabase
        .from('abandoned_carts')
        .insert({
          customer_name: cart.customer_name || null,
          customer_email: cart.customer_email || null,
          customer_phone: cart.customer_phone || null,
          customer_cep: cart.customer_cep || null,
          customer_address: cart.customer_address || null,
          customer_city: cart.customer_city || null,
          customer_state: cart.customer_state || null,
          cart_items: cart.cart_items as any,
          cart_total: cart.cart_total,
          status: 'abandoned',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abandoned_carts'] });
    },
  });
}

export function useUpdateAbandonedCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; contacted_at?: string }) => {
      const { data, error } = await supabase
        .from('abandoned_carts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abandoned_carts'] });
    },
  });
}

export function useDeleteAbandonedCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('abandoned_carts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abandoned_carts'] });
    },
  });
}
