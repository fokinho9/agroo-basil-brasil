import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function PromoBar() {
  return (
    <div className="bg-gradient-to-r from-secondary via-secondary/90 to-secondary text-secondary-foreground py-3">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 text-center">
          <p className="font-medium text-sm md:text-base">
            🎉 <span className="font-bold">FRETE GRÁTIS</span> para compras acima de R$ 299,00!
          </p>
          <Link to="/produtos">
            <Button size="sm" variant="outline" className="gap-1 border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10">
              Aproveitar
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
