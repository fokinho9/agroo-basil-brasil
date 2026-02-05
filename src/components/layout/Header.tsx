import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import logoAgroBrasil from '@/assets/logo-agro-brasil.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSearchProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency } from '@/lib/utils';

export function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: searchResults } = useSearchProducts(searchTerm);
  const { data: categories } = useCategories();

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
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
              Início
            </Link>
            <Link to="/produtos" className="text-muted-foreground hover:text-primary transition-colors">
              Produtos
            </Link>
            {categories?.slice(0, 4).map((category) => (
              <Link
                key={category.id}
                to={`/categoria/${category.slug}`}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {category.name}
              </Link>
            ))}
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
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Mobile Menu Toggle */}
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
            {/* Mobile Search Results */}
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
          <div className="md:hidden border-t border-border py-4">
            <nav className="flex flex-col gap-2">
              <Link
                to="/"
                className="px-4 py-2 text-muted-foreground hover:text-primary hover:bg-muted rounded transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Início
              </Link>
              <Link
                to="/produtos"
                className="px-4 py-2 text-muted-foreground hover:text-primary hover:bg-muted rounded transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Produtos
              </Link>
              {categories?.map((category) => (
                <Link
                  key={category.id}
                  to={`/categoria/${category.slug}`}
                  className="px-4 py-2 text-muted-foreground hover:text-primary hover:bg-muted rounded transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
