import { Link } from 'react-router-dom';
import { ArrowRight, Package, Sparkles, Shirt, Footprints } from 'lucide-react';

// Import category images
import diversosImg from '@/assets/categories/diversos.jpg';
import higieneImg from '@/assets/categories/higiene.jpg';
import vestuarioImg from '@/assets/categories/vestuario.jpg';
import calcadosImg from '@/assets/categories/calcados.jpg';

const featuredCategories = [{
  name: 'Tralhas',
  image: diversosImg,
  description: 'Acessórios e itens variados',
  slug: 'diversos',
  icon: Package
}, {
  name: 'Higiene',
  image: higieneImg,
  description: 'Produtos de limpeza e cuidados',
  slug: 'higiene',
  icon: Sparkles
}, {
  name: 'Vestuário',
  image: vestuarioImg,
  description: 'Roupas e acessórios para trabalho',
  slug: 'vestuario',
  icon: Shirt
}, {
  name: 'Calçados',
  image: calcadosImg,
  description: 'Botas e sapatos de qualidade',
  slug: 'calcados',
  icon: Footprints
}];
export function FeaturedCategories() {
  return <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featuredCategories.map(category => <Link key={category.slug} to={`/categoria/${category.slug}`} className="group relative aspect-square rounded-2xl overflow-hidden">
              <img src={category.image} alt={category.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-card">
                <h3 className="text-lg md:text-xl font-bold mb-1">{category.name}</h3>
                <p className="text-xs md:text-sm opacity-80 mb-2 hidden md:block">{category.description}</p>
                <span className="inline-flex items-center gap-1 text-xs md:text-sm font-medium group-hover:gap-2 transition-all">
                  Ver Produtos
                  <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
                </span>
              </div>
            </Link>)}
        </div>
      </div>
    </section>;
}