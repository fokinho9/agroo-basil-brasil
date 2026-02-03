export default function ReturnsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold text-foreground mb-6">Trocas e Devoluções</h1>
      
      <div className="prose prose-lg max-w-none text-muted-foreground">
        <p className="lead">
          Na AgroShop, queremos que você esteja completamente satisfeito com sua compra. 
          Confira nossa política de trocas e devoluções.
        </p>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Prazo para Troca ou Devolução</h2>
        <p>
          Você tem até 7 (sete) dias corridos, a partir do recebimento do produto, 
          para solicitar troca ou devolução, conforme previsto no Código de Defesa do Consumidor.
        </p>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Condições para Troca</h2>
        <ul className="list-disc list-inside">
          <li>O produto deve estar em sua embalagem original</li>
          <li>Não pode ter sido utilizado</li>
          <li>Deve estar acompanhado da nota fiscal</li>
          <li>Não pode ter sido danificado após o recebimento</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Como Solicitar</h2>
        <ol className="list-decimal list-inside">
          <li>Entre em contato pelo WhatsApp ou e-mail</li>
          <li>Informe o número do pedido e o motivo da solicitação</li>
          <li>Aguarde as instruções para envio do produto</li>
          <li>Envie o produto conforme orientado</li>
        </ol>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Reembolso</h2>
        <p>
          Após o recebimento e análise do produto devolvido, o reembolso será 
          processado em até 10 dias úteis, utilizando o mesmo método de pagamento 
          da compra original.
        </p>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Produtos com Defeito</h2>
        <p>
          Caso receba um produto com defeito de fabricação, entre em contato 
          imediatamente. Cobriremos todos os custos de envio para troca.
        </p>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Frete</h2>
        <p>
          Para trocas por arrependimento, o custo do frete de devolução é de 
          responsabilidade do cliente. Para produtos com defeito, a AgroShop 
          arca com todos os custos de frete.
        </p>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Contato</h2>
        <p>
          Para solicitar troca ou devolução:<br />
          WhatsApp: (11) 99999-9999<br />
          E-mail: trocas@agroshop.com.br
        </p>
      </div>
    </div>
  );
}
