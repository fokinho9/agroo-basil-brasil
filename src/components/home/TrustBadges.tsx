import { Shield, Truck, CreditCard, Headphones, Lock, CheckCircle } from 'lucide-react';

const badges = [
  {
    icon: Shield,
    title: 'Site 100% Seguro',
    description: 'Proteção SSL',
  },
  {
    icon: Lock,
    title: 'Dados Protegidos',
    description: 'Criptografia avançada',
  },
  {
    icon: Truck,
    title: 'Entrega Garantida',
    description: 'Rastreio completo',
  },
  {
    icon: CreditCard,
    title: 'Pagamento Seguro',
    description: 'PIX e Cartão',
  },
  {
    icon: Headphones,
    title: 'Suporte 24h',
    description: 'Atendimento dedicado',
  },
  {
    icon: CheckCircle,
    title: 'Qualidade Garantida',
    description: 'Produtos originais',
  },
];

export function TrustBadges() {
  return (
    <section className="py-8 bg-card border-y border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {badges.map((badge, index) => (
            <div key={index} className="flex flex-col items-center text-center p-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <badge.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium text-foreground text-sm">{badge.title}</p>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
