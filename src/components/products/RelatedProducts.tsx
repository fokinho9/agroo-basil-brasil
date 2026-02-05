import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from './ProductCard';

interface RelatedProductsProps {
  productId: string;
  categoryId?: string | null;
}

export function RelatedProducts({ productId, categoryId }: RelatedProductsProps) {
  const { data: products, isLoading } = useQuery({
    queryKey: ['related-products', productId, categoryId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('active', true)
        .neq('id', productId)
        .gt('price', 0)
        .lte('price', 500)
        .limit(12);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // If not enough products from same category, fetch more
      if (data.length < 12) {
        const { data: moreProducts } = await supabase
          .from('products')
          .select('*, category:categories(*)')
          .eq('active', true)
          .neq('id', productId)
          .gt('price', 0)
          .lte('price', 500)
          .limit(12 - data.length);
        
        if (moreProducts) {
          const existingIds = new Set(data.map(p => p.id));
          const uniqueMore = moreProducts.filter(p => !existingIds.has(p.id));
          return [...data, ...uniqueMore].slice(0, 12);
        }
      }
      
      return data;
    },
  });

  if (isLoading || !products || products.length === 0) return null;

  return (
    <section className="py-10">
      <h2 className="text-xl font-bold text-foreground mb-6">
        Produtos Relacionados
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
