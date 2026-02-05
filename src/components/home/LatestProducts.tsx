import { Link } from 'react-router-dom';
import { ArrowRight, Shirt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useShirtProducts } from '@/hooks/useProducts';

export function LatestProducts() {
  const { data: products, isLoading } = useShirtProducts(12);

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Shirt className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Camisas Cowboys
              </h2>
              <p className="text-muted-foreground mt-1">
                Estilo e conforto para o dia a dia
              </p>
            </div>
          </div>
          <Link to="/produtos?busca=camisa">
            <Button variant="ghost" className="gap-2">
              Ver Todas
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <ProductGrid products={products} isLoading={isLoading} />
      </div>
    </section>
  );
}
