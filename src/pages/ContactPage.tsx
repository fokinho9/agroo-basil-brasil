import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Seo } from '@/components/seo/Seo';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { createWhatsAppLink } from '@/lib/utils';

export default function ContactPage() {
  const { data: settings } = useSiteSettings();
  const whatsappNumber = settings?.whatsapp?.number || '5565999999999';

  return (
    <div className="container mx-auto px-4 py-12">
      <Seo
        title="Contato"
        description="Entre em contato com a Agro Brasil. Atendimento por WhatsApp, telefone e e-mail. Tire suas dúvidas sobre produtos agropecuários."
        canonicalPath="/contato"
        keywords={['contato agro brasil', 'whatsapp agro brasil', 'atendimento loja agropecuária']}
      />
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Fale Conosco</h1>
      <p className="text-lg text-muted-foreground mb-10">
        Estamos prontos para te atender. Escolha o canal mais conveniente.
      </p>
      
      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div className="space-y-6">
          {/* WhatsApp CTA */}
          <Card className="border-2 border-primary bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center">
                  <MessageCircle className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">WhatsApp</h3>
                  <p className="text-sm text-muted-foreground">Resposta rápida</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Nosso canal mais rápido! Fale diretamente com nossa equipe.
              </p>
              <Button
                className="w-full gap-2"
                onClick={() => window.open(createWhatsAppLink(whatsappNumber, 'Olá! Vim do site e gostaria de mais informações.'), '_blank')}
              >
                <MessageCircle className="h-4 w-4" />
                Chamar no WhatsApp
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {[
              { icon: MapPin, title: 'Endereço', lines: ['Tangará da Serra - MT', 'CEP: 78300-000'] },
              { icon: Phone, title: 'Telefone', lines: ['(65) 99999-9999', '(65) 3333-3333'] },
              { icon: Mail, title: 'E-mail', lines: ['contato@agrobrasil.com.br', 'vendas@agrobrasil.com.br'] },
              { icon: Clock, title: 'Horário', lines: ['Seg a Sex: 8h às 18h', 'Sábado: 8h às 12h'] },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  {item.lines.map((line, j) => (
                    <p key={j} className="text-sm text-muted-foreground">{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>Envie sua Mensagem</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Seu nome completo" />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" />
              </div>
              <div>
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input id="phone" placeholder="(00) 00000-0000" />
              </div>
              <div>
                <Label htmlFor="subject">Assunto</Label>
                <Input id="subject" placeholder="Assunto da mensagem" />
              </div>
              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea id="message" placeholder="Escreva sua mensagem..." rows={4} />
              </div>
              <Button type="submit" className="w-full">Enviar Mensagem</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
