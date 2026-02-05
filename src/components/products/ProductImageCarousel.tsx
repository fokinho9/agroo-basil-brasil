import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductImageCarouselProps {
  images: string[];
  productName: string;
  className?: string;
}

export function ProductImageCarousel({ images, productName, className }: ProductImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter out empty strings and ensure we have at least one image
  const validImages = images.filter(img => img && img.trim() !== '');
  
  if (validImages.length === 0) {
    return (
      <div className={cn("relative aspect-square bg-muted", className)}>
        <img
          src="/placeholder.svg"
          alt={productName}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  if (validImages.length === 1) {
    return (
      <div className={cn("relative aspect-square overflow-hidden bg-muted", className)}>
        <img
          src={validImages[0]}
          alt={productName}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={cn("relative aspect-square overflow-hidden bg-muted group", className)}>
      {/* Main Image */}
      <img
        src={validImages[currentIndex]}
        alt={`${productName} - Imagem ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:scale-110 shadow-lg"
        aria-label="Imagem anterior"
      >
        <ChevronLeft className="w-4 h-4 text-foreground" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:scale-110 shadow-lg"
        aria-label="Próxima imagem"
      >
        <ChevronRight className="w-4 h-4 text-foreground" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {validImages.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentIndex(index);
            }}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentIndex
                ? "bg-primary w-4"
                : "bg-background/60 hover:bg-background/80"
            )}
            aria-label={`Ir para imagem ${index + 1}`}
          />
        ))}
      </div>

      {/* Image Counter */}
      <div className="absolute top-2 right-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-full text-xs font-medium">
        {currentIndex + 1}/{validImages.length}
      </div>
    </div>
  );
}
