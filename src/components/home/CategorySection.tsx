import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Package } from 'lucide-react';

const categoryIcons: Record<string, string> = {
  tralhas: '🎣',
  sementes: '🌱',
  ferramentas: '🔧',
  adubos: '🌿',
  defensivos: '🛡️',
  maquinas: '🚜',
};

export function CategorySection() {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            Categorias
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
          Categorias
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link key={category.id} to={`/categoria/${category.slug}`}>
              <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">
                    {categoryIcons[category.slug] || <Package className="h-10 w-10 mx-auto text-primary" />}
                  </div>
                  <h3 className="font-medium text-foreground">{category.name}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
