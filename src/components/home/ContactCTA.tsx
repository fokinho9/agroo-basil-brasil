import { MessageCircle, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ContactCTA() {
  const whatsappNumber = '5511972238165';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Olá! Gostaria de mais informações sobre os produtos.`;

  return (
    <section className="py-12 md:py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Ficou com alguma dúvida?
        </h2>
        <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
          Entre em contato conosco! Nossa equipe está pronta para ajudar você a encontrar 
          os melhores produtos para sua necessidade.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => window.open(whatsappUrl, '_blank')}
            className="gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            WhatsApp
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2"
            onClick={() => window.location.href = 'tel:+5511972238165'}
          >
            <Phone className="h-5 w-5" />
            Ligar Agora
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2"
            onClick={() => window.location.href = 'mailto:contato@agroshop.com.br'}
          >
            <Mail className="h-5 w-5" />
            E-mail
          </Button>
        </div>
      </div>
    </section>
  );
}
