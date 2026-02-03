import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const featuredCategories = [
  {
    name: 'Equipamentos',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop',
    description: 'Ferramentas e equipamentos profissionais',
    slug: 'equipamentos',
  },
  {
    name: 'Vestuário',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    description: 'Roupas e acessórios para trabalho',
    slug: 'vestuario',
  },
  {
    name: 'Nutrição Animal',
    image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400&h=300&fit=crop',
    description: 'Rações e suplementos',
    slug: 'nutricao-animal',
  },
];

export function FeaturedCategories() {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Explore Nossas Categorias
          </h2>
          <p className="text-muted-foreground">
            Encontre tudo que você precisa organizado por categorias
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {featuredCategories.map((category) => (
            <Link 
              key={category.slug}
              to={`/produtos?categoria=${category.slug}`}
              className="group relative h-64 rounded-2xl overflow-hidden"
            >
              <img 
                src={category.image}
                alt={category.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-6 text-card">
                <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                <p className="text-sm opacity-80 mb-3">{category.description}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all">
                  Ver Produtos
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
