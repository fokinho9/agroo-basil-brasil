import { HeroBanner } from '@/components/home/HeroBanner';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { CategorySection } from '@/components/home/CategorySection';
import { Truck, Shield, Headphones, CreditCard } from 'lucide-react';

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

export default function HomePage() {
  return (
    <div>
      <HeroBanner />
      
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

      <CategorySection />
      <FeaturedProducts />
    </div>
  );
}
