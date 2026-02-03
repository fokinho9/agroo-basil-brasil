import { Link } from 'react-router-dom';
import { ArrowRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useDiscountedProducts } from '@/hooks/useProducts';

export function PromotionSection() {
  const { data: products, isLoading } = useDiscountedProducts(8);

  if (!isLoading && (!products || products.length === 0)) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-destructive/5 via-background to-orange-500/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-full">
              <Flame className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Ofertas Imperdíveis
                </h2>
                <Badge variant="destructive" className="animate-pulse">
                  Promoção
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Aproveite os melhores descontos
              </p>
            </div>
          </div>
          <Link to="/produtos">
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
