import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';

// Import banner images
import mantasDesktop from '@/assets/banners/mantas-desktop.webp';
import mantasPromoDesktop from '@/assets/banners/mantas-promo-desktop.png';
import mantasPromoMobile from '@/assets/banners/mantas-promo-mobile.png';

function useMantasProducts(limit: number = 8) {
  return useQuery({
    queryKey: ['products', 'mantas', limit],
    queryFn: async () => {
      // Get only the Mantas subcategory (not all subcategories like caneleiras, kits, etc.)
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('active', true)
        .eq('category_id', 'b0000002-0000-0000-0000-000000000003')
        .gt('price', 0)
        .order('created_at', { ascending: false })
        .limit(limit * 3);

      if (error) throw error;
      
      // Sort to put "Ultimate Pad" products first
      const sorted = (data as Product[]).sort((a, b) => {
        const aIsUltimate = a.name.toLowerCase().includes('ultimate pad');
        const bIsUltimate = b.name.toLowerCase().includes('ultimate pad');
        
        if (aIsUltimate && !bIsUltimate) return -1;
        if (!aIsUltimate && bIsUltimate) return 1;
        return 0;
      });
      
      return sorted.slice(0, limit);
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
        {/* Banner Promocional no Topo */}
        <Link to="/categoria/mantas" className="block mb-6">
          {/* Desktop Banner */}
          <img 
            src={mantasPromoDesktop} 
            alt="Mantas Boots Horse - Conforto e Proteção para seu Cavalo"
            className="hidden md:block w-full max-w-2xl mx-auto h-auto rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
          />
          {/* Mobile Banner */}
          <img 
            src={mantasPromoMobile} 
            alt="Mantas Boots Horse - Leveza e Proteção para seu Cavalo"
            className="md:hidden w-full max-w-sm mx-auto h-auto rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
          />
        </Link>

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