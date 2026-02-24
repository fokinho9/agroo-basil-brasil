import { Seo } from '@/components/seo/Seo';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Group subcategories by parent
function groupCategories(categories: any[]) {
  const parents = categories.filter(c => !c.parent_id);
  const children = categories.filter(c => c.parent_id);
  
  return parents.map(parent => ({
    ...parent,
    children: children.filter(c => c.parent_id === parent.id),
  }));
}

export default function ProductsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('pagina') || '1', 10);
  const [filterOpen, setFilterOpen] = useState(false);
  
  const { data, isLoading } = useProducts(slug, searchTerm, currentPage);
  const { data: categories } = useCategories();

  const currentCategory = categories?.find((c) => c.slug === slug);
  const pageTitle = searchTerm
    ? `Resultados para "${searchTerm}"`
    : currentCategory
    ? currentCategory.name
    : 'Todos os Produtos';

  const grouped = categories ? groupCategories(categories) : [];

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

  // Sidebar content for categories
  const CategoryNav = ({ onSelect }: { onSelect?: () => void }) => (
    <nav className="space-y-1">
      <Link
        to="/produtos"
        onClick={onSelect}
        className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          !slug ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
        }`}
      >
        Todos os Produtos
      </Link>
      <Separator className="my-2" />
      {grouped.map((parent) => (
        <div key={parent.id}>
          <Link
            to={`/categoria/${parent.slug}`}
            onClick={onSelect}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              slug === parent.slug ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
            }`}
          >
            {parent.name}
            {parent.children.length > 0 && <ChevronRight className="h-4 w-4 opacity-50" />}
          </Link>
          {parent.children.length > 0 && (
            <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-border pl-3">
              {parent.children.map((child: any) => (
                <Link
                  key={child.id}
                  to={`/categoria/${child.slug}`}
                  onClick={onSelect}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    slug === child.slug
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <Seo
        title={pageTitle}
        description={searchTerm ? `Resultados de busca para "${searchTerm}" na Agro Brasil.` : currentCategory ? `Compre ${currentCategory.name} na Agro Brasil. Produtos de qualidade com entrega para todo o Brasil.` : 'Explore todos os produtos agropecuários da Agro Brasil: selaria, vestuário country, mantas, botas e mais.'}
        keywords={['produtos agropecuários', 'selaria', 'vestuário country', currentCategory?.name || ''].filter(Boolean)}
        canonicalPath={slug ? `/categoria/${slug}` : '/produtos'}
        pageKey="products"
      />
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        {currentCategory ? (
          <>
            <Link to="/produtos" className="hover:text-foreground transition-colors">Produtos</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">{currentCategory.name}</span>
          </>
        ) : (
          <span className="text-foreground font-medium">Produtos</span>
        )}
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <h3 className="text-lg font-bold text-foreground mb-4">Categorias</h3>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <CategoryNav />
            </ScrollArea>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{pageTitle}</h1>
            </div>

            {/* Mobile Filter Button */}
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Categorias
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Categorias</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                  <CategoryNav onSelect={() => setFilterOpen(false)} />
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active filter chip */}
          {slug && currentCategory && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-muted-foreground">Filtrando por:</span>
              <Link
                to="/produtos"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                {currentCategory.name}
                <X className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

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
      </div>
    </div>
  );
}
