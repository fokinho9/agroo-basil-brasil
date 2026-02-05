import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// Import banner images
import selasDesktop from '@/assets/banners/selas-desktop.jpg';
import selasMobile from '@/assets/banners/selas-mobile.png';
import jeansDesktop from '@/assets/banners/jeans-desktop.jpg';
import jeansMobile from '@/assets/banners/jeans-mobile.png';
import capaceteDesktop from '@/assets/banners/capacete-desktop.jpg';
import capaceteMobile from '@/assets/banners/capacete-mobile.png';
import boleteirasDesktop from '@/assets/banners/boleteiras-desktop.jpg';
import boleiteirasMobile from '@/assets/banners/boleteiras-mobile.png';

interface BannerItem {
  id: number;
  desktopImage: string;
  mobileImage: string;
  title: string;
  link: string;
}

const banners: BannerItem[] = [
  {
    id: 1,
    desktopImage: selasDesktop,
    mobileImage: selasMobile,
    title: 'Selas 3 Tambores',
    link: '/produtos',
  },
  {
    id: 2,
    desktopImage: jeansDesktop,
    mobileImage: jeansMobile,
    title: 'Liquidação Calça Jeans',
    link: '/produtos',
  },
  {
    id: 3,
    desktopImage: capaceteDesktop,
    mobileImage: capaceteMobile,
    title: 'Capacetes Troxel Spirit',
    link: '/produtos',
  },
  {
    id: 4,
    desktopImage: boleteirasDesktop,
    mobileImage: boleiteirasMobile,
    title: 'Kit Boleteiras',
    link: '/produtos',
  },
];

export function ImageBanners() {
  const isMobile = useIsMobile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  return (
    <section className="relative w-full overflow-hidden group">
      {/* Carousel Container - Full Width */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner) => (
          <Link
            key={banner.id}
            to={banner.link}
            className="min-w-full relative"
          >
            <img
              src={isMobile ? banner.mobileImage : banner.desktopImage}
              alt={banner.title}
              className="w-full h-auto object-cover"
            />
          </Link>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 bg-card/80 hover:bg-card text-foreground rounded-full p-2 md:p-3 transition-all opacity-0 group-hover:opacity-100 shadow-lg z-10"
        aria-label="Banner anterior"
      >
        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 bg-card/80 hover:bg-card text-foreground rounded-full p-2 md:p-3 transition-all opacity-0 group-hover:opacity-100 shadow-lg z-10"
        aria-label="Próximo banner"
      >
        <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all shadow ${
              index === currentIndex
                ? 'bg-primary scale-110'
                : 'bg-card/70 hover:bg-card'
            }`}
            aria-label={`Ir para banner ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
