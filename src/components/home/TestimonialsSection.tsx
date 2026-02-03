import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const testimonials = [
  {
    name: 'Carlos Silva',
    location: 'São Paulo, SP',
    rating: 5,
    text: 'Excelente qualidade nos produtos! Recebi tudo muito bem embalado e no prazo. Recomendo demais!',
    initials: 'CS',
  },
  {
    name: 'Maria Santos',
    location: 'Campinas, SP',
    rating: 5,
    text: 'Atendimento nota 10! Me ajudaram a escolher os melhores produtos para minha fazenda. Muito satisfeita!',
    initials: 'MS',
  },
  {
    name: 'João Pereira',
    location: 'Ribeirão Preto, SP',
    rating: 5,
    text: 'Preços imbatíveis e entrega super rápida. Já é minha loja favorita para compras agrícolas.',
    initials: 'JP',
  },
  {
    name: 'Ana Costa',
    location: 'Uberlândia, MG',
    rating: 5,
    text: 'A variedade de produtos é impressionante! Encontrei tudo que precisava em um só lugar.',
    initials: 'AC',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-12 md:py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            O Que Nossos Clientes Dizem
          </h2>
          <p className="text-muted-foreground">
            A satisfação dos nossos clientes é nossa maior recompensa
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
                
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <p className="text-foreground mb-4 text-sm leading-relaxed">
                  "{testimonial.text}"
                </p>
                
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
