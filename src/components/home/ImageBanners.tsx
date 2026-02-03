import { Link } from 'react-router-dom';

const bannerImages = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&h=400&fit=crop',
    title: 'Equipamentos de Qualidade',
    link: '/produtos',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=400&fit=crop',
    title: 'Sementes Selecionadas',
    link: '/produtos',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=400&fit=crop',
    title: 'Ferramentas Profissionais',
    link: '/produtos',
  },
];

export function ImageBanners() {
  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {bannerImages.map((banner) => (
            <Link
              key={banner.id}
              to={banner.link}
              className="group relative overflow-hidden rounded-xl aspect-[3/2]"
            >
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                <h3 className="text-white text-lg md:text-xl font-bold">{banner.title}</h3>
                <span className="inline-block mt-2 text-white/80 text-sm group-hover:text-white transition-colors">
                  Ver produtos →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
