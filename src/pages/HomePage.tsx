import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { CategorySection } from '@/components/home/CategorySection';
import { PromotionSection } from '@/components/home/PromotionSection';
import { LatestProducts } from '@/components/home/LatestProducts';
import { FeaturedCategories } from '@/components/home/FeaturedCategories';
import { CTABanner } from '@/components/home/CTABanner';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { ImageBanners } from '@/components/home/ImageBanners';
import { AllProducts } from '@/components/home/AllProducts';
import { PremiumProducts } from '@/components/home/PremiumProducts';
import { MantasSection } from '@/components/home/MantasSection';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

import mantasPromoDesktop from '@/assets/banners/mantas-promo-desktop.png';
import selasDesktop from '@/assets/banners/selas-desktop.jpg';
import jeansDesktop from '@/assets/banners/jeans-desktop.jpg';

import { Leaf, Award, Package, Timer } from 'lucide-react';

const stats = [
  { icon: Package, value: '1500+', label: 'Produtos Disponíveis' },
  { icon: Award, value: '10+', label: 'Anos de Experiência' },
  { icon: Leaf, value: '100%', label: 'Qualidade Garantida' },
  { icon: Timer, value: '24h', label: 'Atendimento Rápido' },
];

function MidBanner({ image, alt, link, className = '' }: { image: string; alt: string; link: string; className?: string }) {
  return (
    <section className={`py-4 md:py-6 ${className}`}>
      <div className="container mx-auto px-4">
        <Link to={link} className="block">
          <img
            src={image}
            alt={alt}
            className="w-full h-auto rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] max-h-[200px] md:max-h-[300px] object-cover"
          />
        </Link>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div>
      {/* Image Banners Carousel - Full Width */}
      <ImageBanners />

      {/* Featured Categories with Images */}
      <FeaturedCategories />

      {/* Mantas Section */}
      <MantasSection />

      {/* Mid Banner - Selas */}
      <MidBanner image={selasDesktop} alt="Selas e Acessórios" link="/categoria/selaria-selas-e-acessorios" />

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Promotions with Discounts */}
      <PromotionSection />

      {/* Mid Banner - Jeans */}
      <MidBanner image={jeansDesktop} alt="Calças Jeans Country" link="/categoria/vestuario-calcas" />

      {/* Premium Products */}
      <PremiumProducts />

      {/* Latest Products (Camisas) */}
      <LatestProducts />

      {/* Category Section */}
      <CategorySection />

      {/* CTA Banner */}
      <CTABanner />

      {/* All Products Section */}
      <AllProducts />

      {/* Stats Section */}
      <section className="py-12 md:py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />
    </div>
  );
}
