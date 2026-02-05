import { MessageCircle, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function ContactCTA() {
  const whatsappNumber = '5511999999999';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Olá! Gostaria de mais informações sobre os produtos.`;

  return (
    <section className="py-12 md:py-20 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Precisa de Ajuda?
            </h2>
            <p className="text-lg opacity-90 mb-6">
              Nossa equipe está pronta para atender você! Entre em contato pelo WhatsApp 
              e tire todas as suas dúvidas sobre nossos produtos.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="secondary" className="gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Falar no WhatsApp
                </Button>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-primary-foreground/10 border-primary-foreground/20">
              <CardContent className="p-4 text-center">
                <Phone className="h-8 w-8 mx-auto mb-2 opacity-90" />
                <p className="font-medium">Telefone</p>
                <p className="text-sm opacity-80">(11) 99999-9999</p>
              </CardContent>
            </Card>
            <Card className="bg-primary-foreground/10 border-primary-foreground/20">
              <CardContent className="p-4 text-center">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-90" />
                <p className="font-medium">E-mail</p>
                <p className="text-sm opacity-80">contato@loja.com</p>
              </CardContent>
            </Card>
            <Card className="bg-primary-foreground/10 border-primary-foreground/20 col-span-2">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-90" />
                <p className="font-medium">Horário de Atendimento</p>
                <p className="text-sm opacity-80">Seg - Sex: 8h às 18h | Sáb: 8h às 12h</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
