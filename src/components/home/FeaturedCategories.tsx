import { Link } from 'react-router-dom';

import ligaDescansoImg from '@/assets/categories/liga-descanso.png';
import vestuarioImg from '@/assets/categories/vestuario.png';
import botasImg from '@/assets/categories/botas.png';
import cordasImg from '@/assets/categories/cordas.png';

const featuredCategories = [
  {
    name: 'Liga de Descanso',
    image: ligaDescansoImg,
    slug: 'mantas-e-protecao-para-cavalo-ligas',
  },
  {
    name: 'Vestuário',
    image: vestuarioImg,
    slug: 'vestuario',
  },
  {
    name: 'Botas',
    image: botasImg,
    slug: 'botas',
  },
  {
    name: 'Cordas',
    image: cordasImg,
    slug: 'selaria-cordas',
  },
];

export function FeaturedCategories() {
  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featuredCategories.map((category) => (
            <Link
              key={category.slug}
              to={`/categoria/${category.slug}`}
              className="group relative aspect-square rounded-2xl overflow-hidden"
            >
              <img
                src={category.image}
                alt={category.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
