import { useParams, useSearchParams } from 'react-router-dom';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function ProductsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  
  const { data: products, isLoading } = useProducts(slug, searchTerm);
  const { data: categories } = useCategories();

  const currentCategory = categories?.find((c) => c.slug === slug);
  const pageTitle = searchTerm
    ? `Resultados para "${searchTerm}"`
    : currentCategory
    ? currentCategory.name
    : 'Todos os Produtos';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{pageTitle}</h1>
        {products && (
          <p className="text-muted-foreground">
            {products.length} produto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Categories Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link to="/produtos">
          <Button variant={!slug ? 'default' : 'outline'} size="sm">
            Todos
          </Button>
        </Link>
        {categories?.map((category) => (
          <Link key={category.id} to={`/categoria/${category.slug}`}>
            <Button variant={slug === category.slug ? 'default' : 'outline'} size="sm">
              {category.name}
            </Button>
          </Link>
        ))}
      </div>

      {/* Products Grid */}
      <ProductGrid
        products={products}
        isLoading={isLoading}
        emptyMessage={searchTerm ? 'Nenhum produto encontrado para sua busca' : 'Nenhum produto disponível'}
      />
    </div>
  );
}
