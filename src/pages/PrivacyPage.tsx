import { Seo } from '@/components/seo/Seo';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Seo title="Política de Privacidade" description="Saiba como a Agro Brasil protege seus dados pessoais e sua privacidade." canonicalPath="/privacidade" noindex />
      <h1 className="text-4xl font-bold text-foreground mb-6">Política de Privacidade</h1>
      
      <div className="prose prose-lg max-w-none text-muted-foreground">
        <p className="lead">
          A AgroShop está comprometida em proteger sua privacidade. Esta política 
          descreve como coletamos, usamos e protegemos suas informações pessoais.
        </p>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">1. Coleta de Informações</h2>
        <p>
          Coletamos informações que você nos fornece diretamente, como nome, e-mail, 
          telefone e endereço quando você realiza uma compra ou se cadastra em nosso site.
        </p>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">2. Uso das Informações</h2>
        <p>Utilizamos suas informações para:</p>
        <ul className="list-disc list-inside">
          <li>Processar seus pedidos e entregas</li>
          <li>Enviar confirmações e atualizações de pedidos</li>
          <li>Responder suas dúvidas e solicitações</li>
          <li>Enviar comunicações de marketing (com seu consentimento)</li>
          <li>Melhorar nossos serviços e experiência do usuário</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">3. Proteção de Dados</h2>
        <p>
          Implementamos medidas de segurança técnicas e organizacionais para proteger 
          suas informações contra acesso não autorizado, alteração, divulgação ou destruição.
        </p>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">4. Compartilhamento</h2>
        <p>
          Não vendemos ou alugamos suas informações pessoais a terceiros. Podemos 
          compartilhar dados apenas com parceiros de confiança para processamento 
          de pedidos e entregas.
        </p>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">5. Cookies</h2>
        <p>
          Utilizamos cookies para melhorar sua experiência de navegação. Você pode 
          configurar seu navegador para recusar cookies, mas isso pode afetar algumas 
          funcionalidades do site.
        </p>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">6. Seus Direitos</h2>
        <p>
          Você tem o direito de acessar, corrigir ou excluir suas informações pessoais. 
          Para exercer esses direitos, entre em contato conosco.
        </p>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">7. Contato</h2>
        <p>
          Para dúvidas sobre esta política de privacidade, entre em contato pelo 
          e-mail: privacidade@agroshop.com.br
        </p>

        <p className="mt-8 text-sm">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  );
}
