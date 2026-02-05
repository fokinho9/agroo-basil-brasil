import { Shield, Truck, CreditCard, Headphones, Lock, CheckCircle } from 'lucide-react';
const badges = [{
  icon: Shield,
  title: 'Site 100% Seguro',
  description: 'Proteção SSL'
}, {
  icon: Lock,
  title: 'Dados Protegidos',
  description: 'Criptografia avançada'
}, {
  icon: Truck,
  title: 'Entrega Garantida',
  description: 'Rastreio completo'
}, {
  icon: CreditCard,
  title: 'Pagamento Seguro',
  description: 'PIX e Cartão'
}, {
  icon: Headphones,
  title: 'Suporte 24h',
  description: 'Atendimento dedicado'
}, {
  icon: CheckCircle,
  title: 'Qualidade Garantida',
  description: 'Produtos originais'
}];
export function TrustBadges() {
  return (
    <section className="bg-muted/50 py-4 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {badges.map((badge, index) => (
            <div key={index} className="flex items-center gap-2 justify-center">
              <badge.icon className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">{badge.title}</p>
                <p className="text-[10px] text-muted-foreground">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}