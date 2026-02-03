import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useBanners } from '@/hooks/useBanners';

export function HeroBanner() {
  const { data: banners, isLoading } = useBanners();
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeBanners = banners?.filter((b) => b.active) || [];

  useEffect(() => {
    if (activeBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  if (isLoading) {
    return (
      <div className="relative h-[400px] md:h-[500px] bg-muted animate-pulse" />
    );
  }

  if (activeBanners.length === 0) {
    return (
      <div className="relative h-[400px] md:h-[500px] bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
        <div className="text-center text-primary-foreground px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Bem-vindo à AgroShop</h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Os melhores produtos agrícolas você encontra aqui
          </p>
          <Link to="/produtos">
            <Button size="lg" variant="secondary">
              Ver Produtos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentBanner = activeBanners[currentIndex];

  return (
    <div className="relative h-[400px] md:h-[500px] overflow-hidden">
      {/* Banner Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{
          backgroundImage: `url(${currentBanner.image_url})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 to-foreground/30" />
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div className="max-w-xl text-card">
          {currentBanner.title && (
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{currentBanner.title}</h1>
          )}
          {currentBanner.subtitle && (
            <p className="text-xl md:text-2xl mb-8 opacity-90">{currentBanner.subtitle}</p>
          )}
          {currentBanner.link && (
            <Link to={currentBanner.link}>
              <Button size="lg" variant="secondary">
                {currentBanner.button_text || 'Ver Mais'}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-card/80 hover:bg-card text-foreground rounded-full p-2 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-card/80 hover:bg-card text-foreground rounded-full p-2 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {activeBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex ? 'bg-secondary' : 'bg-card/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
