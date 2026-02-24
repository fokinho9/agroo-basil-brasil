import { Seo } from '@/components/seo/Seo';
import { Package, Clock, AlertTriangle, CheckCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  { num: '1', title: 'Entre em contato', desc: 'Fale conosco pelo WhatsApp ou e-mail informando o número do pedido e o motivo da solicitação.' },
  { num: '2', title: 'Aguarde a análise', desc: 'Nossa equipe analisará sua solicitação em até 2 dias úteis e enviará as instruções de envio.' },
  { num: '3', title: 'Envie o produto', desc: 'Embale o produto na embalagem original e envie conforme as instruções recebidas.' },
  { num: '4', title: 'Receba o reembolso', desc: 'Após recebimento e análise, o reembolso é processado em até 10 dias úteis.' },
];

export default function ReturnsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Seo
        title="Trocas e Devoluções"
        description="Política de trocas e devoluções da Agro Brasil. Conforme o Código de Defesa do Consumidor, você tem 7 dias para solicitar troca ou devolução."
        canonicalPath="/trocas"
        keywords={['trocas e devoluções', 'política de devolução', 'reembolso']}
      />
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Trocas e Devoluções</h1>
      <p className="text-muted-foreground mb-10">
        Sua satisfação é nossa prioridade. Confira como solicitar troca ou devolução.
      </p>

      {/* Key info cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-12">
        <div className="p-6 bg-card rounded-xl border text-center">
          <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-1">7 Dias</h3>
          <p className="text-sm text-muted-foreground">Prazo para solicitar troca ou devolução após o recebimento</p>
        </div>
        <div className="p-6 bg-card rounded-xl border text-center">
          <Package className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-1">Embalagem Original</h3>
          <p className="text-sm text-muted-foreground">O produto deve estar na embalagem original e sem uso</p>
        </div>
        <div className="p-6 bg-card rounded-xl border text-center">
          <CheckCircle className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-1">10 Dias Úteis</h3>
          <p className="text-sm text-muted-foreground">Prazo para processamento do reembolso</p>
        </div>
      </div>

      {/* Steps */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">Como Solicitar</h2>
        <div className="space-y-4">
          {steps.map((s) => (
            <div key={s.num} className="flex gap-4 items-start p-4 bg-card rounded-xl border">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                {s.num}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Conditions */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-4">Condições para Troca/Devolução</h2>
        <div className="space-y-3">
          {[
            'O produto deve estar em sua embalagem original, lacrada quando aplicável.',
            'O produto não pode ter sido utilizado, lavado ou alterado.',
            'Deve estar acompanhado da nota fiscal.',
            'O produto não pode ter sido danificado pelo cliente após o recebimento.',
            'Itens personalizados ou sob medida não são elegíveis para troca por arrependimento.',
          ].map((c, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-muted-foreground text-sm">{c}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Defective products */}
      <section className="bg-destructive/5 rounded-xl p-6 mb-12 border border-destructive/20">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-foreground mb-2">Produto com Defeito?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Se você recebeu um produto com defeito de fabricação, entre em contato imediatamente. 
              A Agro Brasil arca com todos os custos de frete para troca, conforme previsto no 
              Código de Defesa do Consumidor (art. 18).
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <p className="text-muted-foreground mb-4">Precisa solicitar uma troca ou devolução?</p>
        <Button
          size="lg"
          className="gap-2"
          onClick={() => window.open('https://wa.me/5565999999999?text=Olá! Gostaria de solicitar uma troca/devolução.', '_blank')}
        >
          <MessageCircle className="h-5 w-5" />
          Falar no WhatsApp
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Ou envie um e-mail para: trocas@agrobrasil.com.br
        </p>
      </div>
    </div>
  );
}
