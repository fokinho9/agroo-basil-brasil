import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import logoAgroBrasil from '@/assets/logo-agro-brasil.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSearchProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency } from '@/lib/utils';
import { Category } from '@/types';

interface CategoryTree extends Category {
  children: CategoryTree[];
}

function buildCategoryTree(categories: Category[]): CategoryTree[] {
  const map = new Map<string, CategoryTree>();
  const roots: CategoryTree[] = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }
  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sort = (nodes: CategoryTree[]) => {
    nodes.sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name));
    for (const n of nodes) sort(n.children);
  };
  sort(roots);
  return roots;
}

function DesktopCategoryDropdown({ category, closeMobileMenu }: { category: CategoryTree; closeMobileMenu?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Link
        to={`/categoria/${category.slug}`}
        className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
      >
        {category.name}
        <ChevronDown className="h-3 w-3" />
      </Link>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg min-w-[200px] py-1 z-50">
          {category.children.map((sub) => (
            <SubcategoryItem key={sub.id} category={sub} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubcategoryItem({ category, depth }: { category: CategoryTree; depth: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = category.children.length > 0;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Link
        to={`/categoria/${category.slug}`}
        className="flex items-center justify-between px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
      >
        {category.name}
        {hasChildren && <ChevronRight className="h-3 w-3" />}
      </Link>

      {hasChildren && isOpen && (
        <div className="absolute left-full top-0 bg-card border border-border rounded-lg shadow-lg min-w-[180px] py-1 z-50">
          {category.children.map((sub) => (
            <SubcategoryItem key={sub.id} category={sub} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: searchResults } = useSearchProducts(searchTerm);
  const { data: categories } = useCategories();

  const categoryTree = useMemo(() => {
    if (!categories) return [];
    return buildCategoryTree(categories);
  }, [categories]);

  // Only show categories that have subcategories
  const parentCategories = useMemo(() => {
    return categoryTree.filter(c => c.children.length > 0);
  }, [categoryTree]);

  // Find Chapéus category for direct nav link
  const chapeuCategory = useMemo(() => {
    for (const root of categoryTree) {
      for (const child of root.children || []) {
        if (child.slug === 'vestuario-chapeus') return child;
      }
    }
    return null;
  }, [categoryTree]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setIsMobileSearchOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/busca?q=${encodeURIComponent(searchTerm)}`);
      setIsSearchOpen(false);
      setIsMobileSearchOpen(false);
      setSearchTerm('');
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/produto/${productId}`);
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    setSearchTerm('');
  };

  const toggleMobileExpand = (id: string) => {
    setExpandedMobile(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderMobileCategory = (cat: CategoryTree, depth: number = 0) => {
    const hasChildren = cat.children.length > 0;
    const isExpanded = expandedMobile.has(cat.id);

    return (
      <div key={cat.id}>
        <div className="flex items-center" style={{ paddingLeft: `${depth * 16 + 16}px` }}>
          <Link
            to={`/categoria/${cat.slug}`}
            className="flex-1 py-2 text-muted-foreground hover:text-primary transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {cat.name}
          </Link>
          {hasChildren && (
            <button
              onClick={() => toggleMobileExpand(cat.id)}
              className="p-2 text-muted-foreground hover:text-primary"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
        </div>
        {hasChildren && isExpanded && cat.children.map(sub => renderMobileCategory(sub, depth + 1))}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={logoAgroBrasil} 
              alt="Agro Brasil - Tradição e Força" 
              className="h-12 sm:h-14 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {parentCategories.slice(0, 5).map((category) => (
              <DesktopCategoryDropdown key={category.id} category={category} />
            ))}
            {chapeuCategory && (
              <Link
                to={`/categoria/${chapeuCategory.slug}`}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {chapeuCategory.name}
              </Link>
            )}
          </nav>

          {/* Search Bar Desktop */}
          <div ref={searchRef} className="relative flex-1 max-w-md mx-4 hidden md:block">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar produtos..."
                  className="pl-10 pr-4"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                />
              </div>
            </form>

            {/* Search Results Dropdown */}
            {isSearchOpen && searchTerm && searchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
                {searchResults.slice(0, 5).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                  >
                    <img
                      src={product.image_url || '/placeholder.svg'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{product.name}</p>
                      <p className="text-sm text-primary font-semibold">
                        {product.price === 0 ? 'Preço sob consulta' : formatCurrency(product.price)}
                      </p>
                    </div>
                  </button>
                ))}
                <button
                  onClick={handleSearch}
                  className="w-full p-3 text-center text-primary hover:bg-muted transition-colors border-t border-border"
                >
                  Ver todos os resultados
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isMobileSearchOpen && (
          <div ref={mobileSearchRef} className="md:hidden py-3 border-t border-border">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar produtos..."
                  className="pl-10 pr-4"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </form>
            {searchTerm && searchResults && searchResults.length > 0 && (
              <div className="mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                {searchResults.slice(0, 5).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                  >
                    <img
                      src={product.image_url || '/placeholder.svg'}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate text-sm">{product.name}</p>
                      <p className="text-xs text-primary font-semibold">
                        {product.price === 0 ? 'Preço sob consulta' : formatCurrency(product.price)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 max-h-[70vh] overflow-y-auto">
            <nav className="flex flex-col gap-0.5">
              {parentCategories.map((cat) => renderMobileCategory(cat))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
