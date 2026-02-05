import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';

// Helper to filter products that can be purchased directly (price > 0 and <= 500)
const filterDirectPurchase = (products: Product[]) => 
  products.filter(p => p.price > 0 && p.price <= 500);

export function useProducts(categorySlug?: string, searchTerm?: string) {
  return useQuery({
    queryKey: ['products', categorySlug, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (categorySlug) {
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .single();
        
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('active', true)
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(16);

      if (error) throw error;
      // Filter to only show products with direct purchase (price > 0 and <= 500)
      return filterDirectPurchase(data as Product[]).slice(0, 8);
    },
  });
}

export function useLatestProducts(limit: number = 12) {
  return useQuery({
    queryKey: ['products', 'latest', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(limit * 2);

      if (error) throw error;
      // Filter to only show products with direct purchase (price > 0 and <= 500)
      return filterDirectPurchase(data as Product[]).slice(0, limit);
    },
  });
}

export function useDirectPurchaseProducts(limit: number = 20) {
  return useQuery({
    queryKey: ['products', 'direct-purchase', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('active', true)
        .gt('price', 0)
        .lte('price', 500)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useDiscountedProducts(limit: number = 8) {
  return useQuery({
    queryKey: ['products', 'discounted', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('active', true)
        .not('original_price', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit * 2);

      if (error) throw error;
      // Filter to only products where original_price > price AND can be purchased directly
      return (data as Product[])
        .filter(p => p.original_price && p.original_price > p.price && p.price > 0 && p.price <= 500)
        .slice(0, limit);
    },
  });
}

export function useSearchProducts(searchTerm: string) {
  return useQuery({
    queryKey: ['products', 'search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('active', true)
        .ilike('name', `%${searchTerm}%`)
        .limit(5);

      if (error) throw error;
      return data as Product[];
    },
    enabled: searchTerm.length >= 2,
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      // Fetch all products using pagination to bypass 1000 row limit
      const allProducts: Product[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            category:categories(*)
          `)
          .order('created_at', { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          allProducts.push(...(data as Product[]));
          from += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      return allProducts;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Partial<Product>) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}