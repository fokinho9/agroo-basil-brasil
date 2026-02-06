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

import { Leaf, Award, Package, Timer } from 'lucide-react';

const stats = [
  {
    icon: Package,
    value: '500+',
    label: 'Produtos Disponíveis',
  },
  {
    icon: Award,
    value: '10+',
    label: 'Anos de Experiência',
  },
  {
    icon: Leaf,
    value: '100%',
    label: 'Qualidade Garantida',
  },
  {
    icon: Timer,
    value: '24h',
    label: 'Atendimento Rápido',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Image Banners Carousel - Full Width */}
      <ImageBanners />

      {/* Featured Categories with Images - After Carousel */}
      <FeaturedCategories />

      {/* Mantas Section - Terra e Grama */}
      <MantasSection />

      {/* Featured Products - Mantas Boots Horse */}
      <FeaturedProducts />

      {/* Premium Products - 8 most expensive */}
      <PremiumProducts />

      {/* Promotions with Discounts */}
      <PromotionSection />

      {/* Latest Products */}
      <LatestProducts />

      {/* Category Section */}
      <CategorySection />

      {/* All Products Section */}
      <AllProducts />

      {/* CTA Banner */}
      <CTABanner />

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
