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
    <section className="py-12 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {badges.map((badge, index) => (
            <div key={index} className="flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <badge.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">{badge.title}</h3>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}