import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        {/* Banner Image */}
        <Link to="/produtos?busca=manta+boots+horse" className="block mb-8">
          <img 
            src={isMobile ? mantasMobile : mantasDesktop} 
            alt="Mantas Boots Horse - Conforto e proteção para seu cavalo"
            className="w-full h-auto rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
          />
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Mantas Boots Horse
            </h2>
            <p className="text-muted-foreground mt-1">
              Qualidade e conforto para seu cavalo
            </p>
          </div>
          <Link to="/produtos?busca=manta+boots+horse">
            <Button variant="ghost" className="gap-2">
              Ver Todos
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <ProductGrid products={products} isLoading={isLoading} />
      </div>
    </section>
  );
}
