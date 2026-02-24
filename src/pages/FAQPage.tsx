import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Seo } from '@/components/seo/Seo';

const faqs = [
  {
    question: 'Como faço para comprar no site?',
    answer: 'É muito simples! Navegue pelos nossos produtos, adicione os itens desejados ao carrinho, preencha seus dados de entrega e realize o pagamento via PIX. Você receberá a confirmação por e-mail e WhatsApp.',
  },
  {
    question: 'Quais formas de pagamento são aceitas?',
    answer: 'Aceitamos pagamento via PIX (pagamento instantâneo). Para pedidos acima de R$ 500, você pode solicitar condições especiais pelo nosso WhatsApp.',
  },
  {
    question: 'Qual o prazo de entrega?',
    answer: 'O prazo de entrega varia de acordo com a sua região. Em geral, para a região Sudeste o prazo é de 3 a 5 dias úteis. Para outras regiões, pode variar de 5 a 10 dias úteis.',
  },
  {
    question: 'Como acompanho meu pedido?',
    answer: 'Após a confirmação do pagamento, você receberá o código de rastreio por e-mail e WhatsApp. Você pode acompanhar a entrega diretamente no site dos Correios ou transportadora.',
  },
  {
    question: 'Posso trocar ou devolver um produto?',
    answer: 'Sim! Você tem até 7 dias após o recebimento para solicitar troca ou devolução. O produto deve estar em sua embalagem original e sem sinais de uso. Consulte nossa página de Trocas e Devoluções para mais detalhes.',
  },
  {
    question: 'O frete é grátis?',
    answer: 'Sim! Para compras acima de R$ 200,00, o frete é grátis para todo o Brasil. Para compras abaixo desse valor, o frete é calculado de acordo com o CEP de destino.',
  },
  {
    question: 'Os produtos têm garantia?',
    answer: 'Sim, todos os nossos produtos possuem garantia contra defeitos de fabricação. O prazo de garantia varia de acordo com o produto e fabricante.',
  },
  {
    question: 'Como entro em contato com o suporte?',
    answer: 'Você pode entrar em contato conosco pelo WhatsApp (11) 99999-9999, pelo e-mail contato@agroshop.com.br ou através do formulário na página de Contato.',
  },
  {
    question: 'Vocês emitem nota fiscal?',
    answer: 'Sim! Todos os pedidos são acompanhados de nota fiscal eletrônica (NFe), que é enviada para o e-mail cadastrado no momento da compra.',
  },
  {
    question: 'É seguro comprar no site?',
    answer: 'Totalmente seguro! Nosso site utiliza certificado SSL para criptografar todas as informações. Seus dados de pagamento são processados de forma segura e nunca são armazenados em nossos servidores.',
  },
];

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Seo title="Perguntas Frequentes" description="Tire suas dúvidas sobre compras, pagamento, entrega, trocas e devoluções na Agro Brasil." canonicalPath="/faq" />
      <h1 className="text-4xl font-bold text-foreground mb-6">Perguntas Frequentes</h1>
      
      <p className="text-lg text-muted-foreground mb-8">
        Encontre respostas para as dúvidas mais comuns dos nossos clientes. 
        Se não encontrar o que procura, entre em contato conosco.
      </p>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left text-foreground">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
