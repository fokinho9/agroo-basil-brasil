import { HeroBanner } from '@/components/home/HeroBanner';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { CategorySection } from '@/components/home/CategorySection';
import { PromotionSection } from '@/components/home/PromotionSection';
import { LatestProducts } from '@/components/home/LatestProducts';
import { FeaturedCategories } from '@/components/home/FeaturedCategories';
import { CTABanner } from '@/components/home/CTABanner';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { BrandsSection } from '@/components/home/BrandsSection';
import { ContactCTA } from '@/components/home/ContactCTA';
import { ImageBanners } from '@/components/home/ImageBanners';
import { TrustBadges } from '@/components/home/TrustBadges';
import { AllProducts } from '@/components/home/AllProducts';
import { Truck, Shield, Headphones, CreditCard, Leaf, Award, Package, Timer } from 'lucide-react';

const benefits = [
  {
    icon: Truck,
    title: 'Entrega Rápida',
    description: 'Envio para todo Brasil',
  },
  {
    icon: Shield,
    title: 'Compra Segura',
    description: 'Seus dados protegidos',
  },
  {
    icon: Headphones,
    title: 'Suporte 24h',
    description: 'Atendimento dedicado',
  },
  {
    icon: CreditCard,
    title: 'Pagamento Fácil',
    description: 'PIX, cartão e boleto',
  },
];

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
      {/* Hero Banner */}
      <HeroBanner />
      
      {/* Trust Badges */}
      <TrustBadges />

      {/* Benefits Bar */}
      <section className="bg-card border-y border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 justify-center md:justify-start">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <benefit.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Banners */}
      <ImageBanners />

      {/* Category Section */}
      <CategorySection />

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Promotions with Discounts */}
      <PromotionSection />

      {/* Featured Categories with Images */}
      <FeaturedCategories />

      {/* Latest Products */}
      <LatestProducts />

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

      {/* Brands */}
      <BrandsSection />

      {/* Contact CTA */}
      <ContactCTA />
    </div>
  );
}
