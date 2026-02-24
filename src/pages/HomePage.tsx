import { Seo } from '@/components/seo/Seo';
import { PromotionSection } from '@/components/home/PromotionSection';
import { LatestProducts } from '@/components/home/LatestProducts';
import { FeaturedCategories } from '@/components/home/FeaturedCategories';
import { CTABanner } from '@/components/home/CTABanner';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { ImageBanners } from '@/components/home/ImageBanners';
import { MantasSection } from '@/components/home/MantasSection';
import { CategoryProductsSection } from '@/components/home/CategoryProductsSection';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';

import selasDesktopDefault from '@/assets/banners/selas-desktop.jpg';
import jeansDesktopDefault from '@/assets/banners/jeans-desktop.jpg';
import ofertasDesktopDefault from '@/assets/banners/ofertas-desktop.jpg';
import chapeusDesktopDefault from '@/assets/banners/chapeus-desktop.jpg';

import { Leaf, Award, Package, Timer } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = { Package, Award, Leaf, Timer };

const defaultStats = [
  { icon: 'Package', value: '1500+', label: 'Produtos Disponíveis' },
  { icon: 'Award', value: '10+', label: 'Anos de Experiência' },
  { icon: 'Leaf', value: '100%', label: 'Qualidade Garantida' },
  { icon: 'Timer', value: '24h', label: 'Atendimento Rápido' },
];

const defaultMidBanners = {
  ofertas: { image: ofertasDesktopDefault, alt: 'Ofertas Imperdíveis', link: '/produtos', active: true },
  chapeus: { image: chapeusDesktopDefault, alt: 'Chapéus Country', link: '/categoria/vestuario-chapeus', active: true },
  selas: { image: selasDesktopDefault, alt: 'Selas e Acessórios', link: '/categoria/selaria-selas-e-acessorios', active: true },
  jeans: { image: jeansDesktopDefault, alt: 'Calças Jeans Country', link: '/categoria/vestuario-calcas', active: true },
};

function MidBanner({ image, alt, link }: { image: string; alt: string; link: string }) {
  return (
    <section className="py-4 md:py-6">
      <div className="container mx-auto px-4">
        <Link to={link} className="block">
          <img
            src={image}
            alt={alt}
            className="w-full h-auto rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] max-h-[200px] md:max-h-[300px] object-cover"
            loading="lazy"
          />
        </Link>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { data: settings } = useSiteSettings();
  const config = settings?.homepage_config as any;

  const sections = config?.sections || {
    categorias: true, mantas: true, ofertas: true, chapeus: true,
    selas: true, jeans: true, cta: true, estatisticas: true, depoimentos: true,
  };

  const midBanners = {
    ofertas: { ...defaultMidBanners.ofertas, ...config?.midBanners?.ofertas },
    chapeus: { ...defaultMidBanners.chapeus, ...config?.midBanners?.chapeus },
    selas: { ...defaultMidBanners.selas, ...config?.midBanners?.selas },
    jeans: { ...defaultMidBanners.jeans, ...config?.midBanners?.jeans },
  };

  // Use admin image if set, otherwise fallback to default imported image
  const getMidImage = (key: keyof typeof defaultMidBanners) => {
    const adminImage = config?.midBanners?.[key]?.image;
    return adminImage || defaultMidBanners[key].image;
  };

  const stats = config?.stats || defaultStats;

  return (
    <div>
      <Seo
        title="Loja Agropecuária Online"
        description="Compre produtos agropecuários de qualidade: selas, mantas para cavalo, vestuário country, botas, chapéus, cordas e mais. Entrega para todo o Brasil."
        keywords={['loja agro', 'produtos agropecuários', 'selaria', 'manta para cavalo', 'vestuário country', 'botas country', 'chapéu country', 'loja agropecuária online']}
        canonicalPath="/"
        pageKey="home"
      />
      <div data-section="hero-banners">
        <ImageBanners />
      </div>

      {sections.categorias && (
        <div data-section="categorias">
          <FeaturedCategories />
        </div>
      )}

      {sections.mantas && (
        <div data-section="mantas">
          <MantasSection />
        </div>
      )}

      {midBanners.ofertas.active !== false && (
        <MidBanner image={getMidImage('ofertas')} alt={midBanners.ofertas.alt} link={midBanners.ofertas.link} />
      )}
      {sections.ofertas && (
        <div data-section="promocoes">
          <PromotionSection />
        </div>
      )}

      {midBanners.chapeus.active !== false && (
        <MidBanner image={getMidImage('chapeus')} alt={midBanners.chapeus.alt} link={midBanners.chapeus.link} />
      )}
      {sections.chapeus && (
        <div data-section="ultimos-produtos">
          <LatestProducts />
        </div>
      )}

      {midBanners.selas.active !== false && (
        <MidBanner image={getMidImage('selas')} alt={midBanners.selas.alt} link={midBanners.selas.link} />
      )}
      {sections.selas && (
        <div data-section="selas">
          <CategoryProductsSection
            categorySlug="selaria-selas-e-acessorios"
            title="Selas e Acessórios"
            subtitle="As melhores selas para sua montaria"
            buttonLabel="Ver Todas"
            limit={8}
          />
        </div>
      )}

      {midBanners.jeans.active !== false && (
        <MidBanner image={getMidImage('jeans')} alt={midBanners.jeans.alt} link={midBanners.jeans.link} />
      )}
      {sections.jeans && (
        <div data-section="calcas-jeans">
          <CategoryProductsSection
            categorySlug="vestuario-calcas"
            title="Calças Jeans"
            subtitle="Estilo e conforto no dia a dia"
            buttonLabel="Ver Todas"
            limit={8}
          />
        </div>
      )}

      {sections.cta && (
        <div data-section="cta-banner">
          <CTABanner />
        </div>
      )}

      {sections.estatisticas && (
        <section className="py-12 md:py-16 bg-muted/50" data-section="estatisticas">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat: any, index: number) => {
                const Icon = iconMap[stat.icon] || Package;
                return (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {sections.depoimentos && (
        <div data-section="depoimentos">
          <TestimonialsSection />
        </div>
      )}
    </div>
  );
}
