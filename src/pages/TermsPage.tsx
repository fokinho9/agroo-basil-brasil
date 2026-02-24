import { Seo } from '@/components/seo/Seo';

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Seo title="Termos de Uso" description="Leia os termos e condições de uso do site Agro Brasil." canonicalPath="/termos" noindex />
      <h1 className="text-4xl font-bold text-foreground mb-6">Termos de Uso</h1>
      
      <div className="prose prose-lg max-w-none text-muted-foreground">
        <p className="lead">
          Ao utilizar o site da AgroShop, você concorda com os termos e condições descritos abaixo.
        </p>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">1. Aceitação dos Termos</h2>
        <p>
          Ao acessar e usar este site, você aceita e concorda em cumprir os termos e 
          condições de uso. Se você não concordar com qualquer parte destes termos, 
          não deverá usar nosso site.
        </p>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">2. Uso do Site</h2>
        <p>
          Você concorda em usar o site apenas para fins legais e de maneira que não 
          infrinja os direitos de terceiros ou restrinja o uso do site por terceiros.
        </p>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">3. Produtos e Preços</h2>
        <p>
          Todos os produtos exibidos estão sujeitos à disponibilidade. Os preços podem 
          ser alterados sem aviso prévio. Nos reservamos o direito de limitar as 
          quantidades de qualquer produto.
        </p>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">4. Pagamentos</h2>
        <p>
          Aceitamos pagamentos via PIX, cartão de crédito e boleto bancário. Todas as 
          transações são processadas de forma segura.
        </p>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">5. Propriedade Intelectual</h2>
        <p>
          Todo o conteúdo do site, incluindo textos, gráficos, logotipos, imagens e 
          software, é propriedade da AgroShop e está protegido por leis de direitos autorais.
        </p>

        <h2 className="text-xl font-bold text-foreground mt-8 mb-4">6. Alterações nos Termos</h2>
        <p>
          Reservamo-nos o direito de modificar estes termos a qualquer momento. As 
          alterações entrarão em vigor imediatamente após sua publicação no site.
        </p>

        <p className="mt-8 text-sm">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  );
}
