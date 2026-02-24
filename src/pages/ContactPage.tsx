import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Seo } from '@/components/seo/Seo';

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Seo title="Contato" description="Entre em contato com a Agro Brasil. Atendimento por WhatsApp, telefone e e-mail. Estamos prontos para ajudar!" canonicalPath="/contato" />
      <h1 className="text-4xl font-bold text-foreground mb-6">Contato</h1>
      
      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div>
          <p className="text-lg text-muted-foreground mb-8">
            Estamos sempre disponíveis para atender você. Entre em contato 
            através de um dos nossos canais de atendimento.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Endereço</h3>
                <p className="text-muted-foreground">
                  Rua das Fazendas, 123<br />
                  Centro - Cidade Rural, SP<br />
                  CEP: 12345-678
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Telefone</h3>
                <p className="text-muted-foreground">(11) 99999-9999</p>
                <p className="text-muted-foreground">(11) 3333-3333</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">E-mail</h3>
                <p className="text-muted-foreground">contato@agroshop.com.br</p>
                <p className="text-muted-foreground">vendas@agroshop.com.br</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Horário de Funcionamento</h3>
                <p className="text-muted-foreground">Segunda a Sexta: 8h às 18h</p>
                <p className="text-muted-foreground">Sábado: 8h às 12h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>Envie sua Mensagem</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Seu nome completo" />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
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
