import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';

// Import banner image
import mantasDesktop from '@/assets/banners/mantas-desktop.webp';

function useMantasProducts(limit: number = 8) {
  return useQuery({
    queryKey: ['products', 'mantas', limit],
    queryFn: async () => {
      // First get the mantas category
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', 'mantas')
        .single();

      if (!category) return [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('active', true)
        .eq('category_id', category.id)
        .gt('price', 0)
        .lte('price', 500)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Product[];
    },
  });
}

export function MantasSection() {
  const { data: products, isLoading } = useMantasProducts(8);

  if (!isLoading && (!products || products.length === 0)) {
    return null;
  }

  return (
    <section className="py-12 md:py-20 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${mantasDesktop})` }}
      />
      
      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/60" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Products Grid */}
        <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-3xl p-6 md:p-10 shadow-2xl">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Ver Todos Button */}
          <div className="flex justify-center mt-8">
            <Link to="/categoria/mantas">
              <Button 
                size="lg" 
                className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg font-semibold rounded-full"
              >
                Ver Todas as Mantas
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}