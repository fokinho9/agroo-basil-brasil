import { Seo } from '@/components/seo/Seo';

const sections = [
  {
    title: '1. Aceitação dos Termos',
    text: 'Ao acessar e utilizar o site da Agro Brasil (agrobrasil.com.br), você declara que leu, compreendeu e concorda integralmente com estes Termos de Uso. Caso não concorde com qualquer disposição, recomendamos que não utilize nossos serviços.',
  },
  {
    title: '2. Identificação da Empresa',
    text: 'A Agro Brasil é uma loja virtual especializada em produtos agropecuários, selaria, vestuário country e acessórios para cavalos. Estamos localizados em Tangará da Serra - MT e operamos em conformidade com a legislação brasileira, incluindo o Código de Defesa do Consumidor (Lei nº 8.078/1990) e o Marco Civil da Internet (Lei nº 12.965/2014).',
  },
  {
    title: '3. Cadastro e Dados Pessoais',
    text: 'Para realizar compras, o usuário deverá fornecer informações pessoais verdadeiras e atualizadas, como nome completo, CPF, endereço de entrega, telefone e e-mail. O uso de dados falsos pode resultar no cancelamento do pedido. O tratamento dos dados pessoais segue nossa Política de Privacidade, em conformidade com a LGPD (Lei nº 13.709/2018).',
  },
  {
    title: '4. Produtos e Preços',
    text: 'Todos os produtos exibidos estão sujeitos à disponibilidade de estoque. Os preços podem ser alterados sem aviso prévio, porém pedidos já confirmados mantêm o valor acordado no momento da compra. As imagens dos produtos são meramente ilustrativas e podem apresentar variações de cor em relação ao produto físico.',
  },
  {
    title: '5. Pagamentos',
    text: 'Aceitamos pagamentos via PIX (pagamento instantâneo) e cartão de crédito em até 12x sem juros. Todas as transações financeiras são processadas por intermediadores de pagamento seguros e certificados. A Agro Brasil não armazena dados de cartão de crédito em seus servidores.',
  },
  {
    title: '6. Entrega e Frete',
    text: 'Os prazos de entrega variam conforme a região e são contados a partir da confirmação do pagamento. Frete grátis para compras acima de R$ 200,00. Para compras abaixo deste valor, o frete é calculado com base no CEP de destino. A Agro Brasil não se responsabiliza por atrasos causados por transportadoras ou eventos de força maior.',
  },
  {
    title: '7. Direito de Arrependimento',
    text: 'Conforme o art. 49 do Código de Defesa do Consumidor, o comprador tem até 7 (sete) dias corridos após o recebimento do produto para exercer o direito de arrependimento, com reembolso integral do valor pago. O produto deve ser devolvido em sua embalagem original e sem sinais de uso.',
  },
  {
    title: '8. Propriedade Intelectual',
    text: 'Todo o conteúdo do site — incluindo textos, imagens, logotipos, marcas, layout e software — é de propriedade da Agro Brasil ou de seus licenciadores, sendo protegido pelas leis de direitos autorais e propriedade industrial. É proibida a reprodução sem autorização prévia por escrito.',
  },
  {
    title: '9. Limitação de Responsabilidade',
    text: 'A Agro Brasil não se responsabiliza por danos indiretos, incidentais ou consequenciais decorrentes do uso ou incapacidade de uso do site, incluindo, mas não se limitando a, perda de dados ou lucros cessantes.',
  },
  {
    title: '10. Legislação Aplicável e Foro',
    text: 'Estes Termos de Uso são regidos pela legislação brasileira. Fica eleito o foro da comarca de Tangará da Serra - MT para dirimir quaisquer controvérsias.',
  },
];

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Seo title="Termos de Uso" description="Termos e condições de uso do site Agro Brasil. Informações sobre compras, entregas, pagamentos e direitos do consumidor." canonicalPath="/termos" />
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Termos de Uso</h1>
      <p className="text-muted-foreground mb-8">
        Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
      </p>
      
      <div className="space-y-8">
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-xl font-bold text-foreground mb-3">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
