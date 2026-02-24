import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const defaultCta = {
  badge: 'Oferta Especial',
  title: 'Tudo Para Sua',
  titleHighlight: 'Propriedade Rural',
  description: 'Encontre os melhores produtos agrícolas com preços imbatíveis. Qualidade garantida e entrega rápida para todo o Brasil.',
  buttonText: 'Ver Todos os Produtos',
  buttonLink: '/produtos',
  secondButtonText: 'Fale Conosco',
  secondButtonLink: '/contato',
  stat1Value: '500+', stat1Label: 'Produtos',
  stat2Value: '1000+', stat2Label: 'Clientes',
  stat3Value: '50+', stat3Label: 'Cidades',
};

export function CTABanner() {
  const { data: settings } = useSiteSettings();
  const adminCta = (settings?.homepage_config as any)?.cta;
  const cta = { ...defaultCta, ...adminCta };

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-muted via-background to-muted" />
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <ShoppingBag className="h-4 w-4" />
            <span className="text-sm font-medium">{cta.badge}</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {cta.title}
            <span className="text-primary"> {cta.titleHighlight}</span>
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            {cta.description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={cta.buttonLink}>
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                {cta.buttonText}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to={cta.secondButtonLink}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {cta.secondButtonText}
              </Button>
            </Link>
          </div>
          
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-primary">{cta.stat1Value}</p>
              <p className="text-xs md:text-sm text-muted-foreground">{cta.stat1Label}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-primary">{cta.stat2Value}</p>
              <p className="text-xs md:text-sm text-muted-foreground">{cta.stat2Label}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-primary">{cta.stat3Value}</p>
              <p className="text-xs md:text-sm text-muted-foreground">{cta.stat3Label}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
