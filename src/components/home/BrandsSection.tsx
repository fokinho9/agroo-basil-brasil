import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const brands = [
  { name: 'Marca 1', logo: 'https://via.placeholder.com/150x60?text=Marca+1' },
  { name: 'Marca 2', logo: 'https://via.placeholder.com/150x60?text=Marca+2' },
  { name: 'Marca 3', logo: 'https://via.placeholder.com/150x60?text=Marca+3' },
  { name: 'Marca 4', logo: 'https://via.placeholder.com/150x60?text=Marca+4' },
  { name: 'Marca 5', logo: 'https://via.placeholder.com/150x60?text=Marca+5' },
  { name: 'Marca 6', logo: 'https://via.placeholder.com/150x60?text=Marca+6' },
];

export function BrandsSection() {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Marcas que Trabalhamos
          </h2>
          <p className="text-muted-foreground">
            Parceiros de confiança para garantir a melhor qualidade
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
          {brands.map((brand, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-center h-20">
                <img 
                  src={brand.logo} 
                  alt={brand.name}
                  className="max-h-full max-w-full object-contain grayscale hover:grayscale-0 transition-all"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
