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
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/15 to-primary/10 animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-warning/20 via-primary/10 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-secondary/25 via-transparent to-transparent" />
      
      {/* Floating animated shapes */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-warning/15 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '8s', animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-secondary/20 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '5s' }} />
      
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
