import { Link } from 'react-router-dom';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useFeaturedProducts } from '@/hooks/useProducts';
import { useIsMobile } from '@/hooks/use-mobile';

// Import banner images
import mantasDesktop from '@/assets/banners/mantas-desktop.webp';
import mantasMobile from '@/assets/banners/mantas-mobile.webp';

export function FeaturedProducts() {
  const { data: products, isLoading } = useFeaturedProducts();
  const isMobile = useIsMobile();

  return (
    <section className="py-12 md:py-16 relative overflow-hidden">
      {/* Soft gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-primary/5 to-secondary/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Banner Image */}
        <Link to="/produtos?busca=manta+boots+horse" className="block mb-8">
          <img 
            src={isMobile ? mantasMobile : mantasDesktop} 
            alt="Mantas Boots Horse - Conforto e proteção para seu cavalo"
            className="w-full h-auto rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]"
          />
        </Link>

        {/* Products Grid */}
        <div className="bg-white/60 dark:bg-card/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg">
          <ProductGrid products={products} isLoading={isLoading} />
        </div>
      </div>
    </section>
  );
}
