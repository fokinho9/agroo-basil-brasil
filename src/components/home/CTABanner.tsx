import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag } from 'lucide-react';

export function CTABanner() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background Pattern */}
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
            <span className="text-sm font-medium">Oferta Especial</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Tudo Para Sua
            <span className="text-primary"> Propriedade Rural</span>
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Encontre os melhores produtos agrícolas com preços imbatíveis. 
            Qualidade garantida e entrega rápida para todo o Brasil.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/produtos">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                Ver Todos os Produtos
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contato">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Fale Conosco
              </Button>
            </Link>
          </div>
          
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-primary">500+</p>
              <p className="text-xs md:text-sm text-muted-foreground">Produtos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-primary">1000+</p>
              <p className="text-xs md:text-sm text-muted-foreground">Clientes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-primary">50+</p>
              <p className="text-xs md:text-sm text-muted-foreground">Cidades</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
