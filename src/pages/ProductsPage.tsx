import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export default function ProductsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('pagina') || '1', 10);
  
  const { data, isLoading } = useProducts(slug, searchTerm, currentPage);
  const { data: categories } = useCategories();

  const currentCategory = categories?.find((c) => c.slug === slug);
  const pageTitle = searchTerm
    ? `Resultados para "${searchTerm}"`
    : currentCategory
    ? currentCategory.name
    : 'Todos os Produtos';

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newParams.delete('pagina');
    } else {
      newParams.set('pagina', page.toString());
    }
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPaginationItems = () => {
    if (!data) return null;
    const { totalPages } = data;
    const items = [];
    
    // Always show first page
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          onClick={() => handlePageChange(1)}
          isActive={currentPage === 1}
          className="cursor-pointer"
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Always show last page if more than 1 page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{pageTitle}</h1>
        {data && (
          <p className="text-muted-foreground">
            {data.totalCount} produto{data.totalCount !== 1 ? 's' : ''} encontrado{data.totalCount !== 1 ? 's' : ''}
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
        products={data?.products}
        isLoading={isLoading}
        emptyMessage={searchTerm ? 'Nenhum produto encontrado para sua busca' : 'Nenhum produto disponível'}
      />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {renderPaginationItems()}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => currentPage < data.totalPages && handlePageChange(currentPage + 1)}
                  className={currentPage === data.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
