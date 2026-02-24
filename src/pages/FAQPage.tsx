import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Seo } from '@/components/seo/Seo';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const faqs = [
  {
    question: 'Como faço para comprar no site?',
    answer: 'É muito simples! Navegue pelos nossos produtos, adicione os itens desejados ao carrinho, preencha seus dados de entrega e realize o pagamento via PIX ou cartão de crédito. Você receberá a confirmação por e-mail e WhatsApp.',
  },
  {
    question: 'Quais formas de pagamento são aceitas?',
    answer: 'Aceitamos PIX (pagamento instantâneo com 5% de desconto à vista) e cartão de crédito em até 12x sem juros. Para pedidos especiais, você pode negociar condições pelo nosso WhatsApp.',
  },
  {
    question: 'Qual o prazo de entrega?',
    answer: 'O prazo varia conforme a região. Para a região Centro-Oeste, de 2 a 4 dias úteis. Sudeste e Sul, de 3 a 6 dias úteis. Norte e Nordeste, de 5 a 10 dias úteis. Os prazos são contados a partir da confirmação do pagamento.',
  },
  {
    question: 'O frete é grátis?',
    answer: 'Sim! Para compras acima de R$ 200,00, o frete é grátis para todo o Brasil. Para compras abaixo desse valor, o frete é calculado automaticamente com base no CEP de destino no momento do checkout.',
  },
  {
    question: 'Como acompanho meu pedido?',
    answer: 'Após a confirmação do pagamento e envio, você receberá o código de rastreio por WhatsApp e poderá acompanhar em tempo real na nossa página de Rastreio. Basta digitar o código do pedido.',
  },
  {
    question: 'Posso trocar ou devolver um produto?',
    answer: 'Sim! Você tem até 7 dias após o recebimento para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor. O produto deve estar na embalagem original e sem uso. Consulte nossa página de Trocas e Devoluções para mais detalhes.',
  },
  {
    question: 'Os produtos têm garantia?',
    answer: 'Sim, todos os nossos produtos possuem garantia contra defeitos de fabricação conforme a legislação brasileira. O prazo de garantia varia de acordo com o produto e fabricante. Produtos de selaria possuem garantia mínima de 90 dias.',
  },
  {
    question: 'Vocês emitem nota fiscal?',
    answer: 'Sim! Todos os pedidos são acompanhados de nota fiscal eletrônica (NF-e), que é enviada automaticamente para o e-mail cadastrado no momento da compra.',
  },
  {
    question: 'É seguro comprar no site?',
    answer: 'Totalmente seguro! Nosso site utiliza certificado SSL (HTTPS) para criptografar todas as informações transmitidas. Os dados de pagamento são processados por intermediadores certificados e nunca são armazenados em nossos servidores.',
  },
  {
    question: 'Como entro em contato com vocês?',
    answer: 'Você pode nos contatar pelo WhatsApp (65) 99999-9999 (canal mais rápido), pelo e-mail contato@agrobrasil.com.br, ou pelo formulário na nossa página de Contato. Nosso horário de atendimento é de segunda a sexta, das 8h às 18h.',
  },
  {
    question: 'Vocês vendem no atacado?',
    answer: 'Sim! Oferecemos condições especiais para revendedores e compras em grandes quantidades. Entre em contato pelo WhatsApp para receber uma tabela de preços diferenciada.',
  },
  {
    question: 'Como escolher o tamanho correto da sela?',
    answer: 'O tamanho da sela depende do porte do cavaleiro e do cavalo. Recomendamos entrar em contato com nossa equipe pelo WhatsApp para orientação personalizada. Temos especialistas que podem ajudar a escolher o modelo e tamanho ideais.',
  },
];

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Seo
        title="Perguntas Frequentes (FAQ)"
        description="Tire suas dúvidas sobre compras, pagamento, entrega, trocas e devoluções na Agro Brasil. Respostas para as perguntas mais comuns."
        canonicalPath="/faq"
        keywords={['perguntas frequentes', 'faq agro brasil', 'dúvidas loja agropecuária']}
      />
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Perguntas Frequentes</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Encontre respostas rápidas para as dúvidas mais comuns.
      </p>

      <Accordion type="single" collapsible className="w-full mb-12">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left text-foreground">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* CTA */}
      <div className="text-center bg-muted/50 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-foreground mb-2">Não encontrou sua dúvida?</h2>
        <p className="text-muted-foreground mb-4">Fale diretamente com nossa equipe!</p>
        <Button
          size="lg"
          className="gap-2"
          onClick={() => window.open('https://wa.me/5565999999999?text=Olá! Tenho uma dúvida sobre a loja.', '_blank')}
        >
          <MessageCircle className="h-5 w-5" />
          Perguntar no WhatsApp
        </Button>
      </div>
    </div>
  );
}
