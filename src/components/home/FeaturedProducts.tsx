import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useFeaturedProducts } from '@/hooks/useProducts';

export function FeaturedProducts() {
  const { data: products, isLoading } = useFeaturedProducts();

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Mantas Boots Horse
            </h2>
            <p className="text-muted-foreground mt-1">
              Qualidade e conforto para seu cavalo
            </p>
          </div>
          <Link to="/produtos">
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
