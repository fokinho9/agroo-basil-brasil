import { Seo } from '@/components/seo/Seo';

const sections = [
  {
    title: '1. Dados Coletados',
    text: 'Coletamos dados pessoais que você nos fornece voluntariamente ao realizar uma compra ou entrar em contato: nome completo, CPF, e-mail, telefone, endereço de entrega e CEP. Também coletamos dados de navegação automaticamente, como endereço IP (anonimizado), tipo de navegador, páginas visitadas e tempo de permanência, para fins de melhoria do site.',
  },
  {
    title: '2. Finalidade do Tratamento',
    text: 'Seus dados são utilizados exclusivamente para: processar pedidos e entregas; enviar confirmações e atualizações de status; responder dúvidas e solicitações de atendimento; emitir notas fiscais; enviar comunicações de marketing (apenas com seu consentimento); melhorar a experiência de navegação e personalizar ofertas; cumprir obrigações legais e regulatórias.',
  },
  {
    title: '3. Base Legal (LGPD)',
    text: 'O tratamento dos seus dados pessoais é realizado com base nas seguintes hipóteses previstas na Lei Geral de Proteção de Dados (Lei nº 13.709/2018): execução de contrato (processamento de pedidos), consentimento (marketing), cumprimento de obrigação legal (emissão de notas fiscais) e legítimo interesse (melhoria dos serviços).',
  },
  {
    title: '4. Compartilhamento de Dados',
    text: 'Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing. Seus dados podem ser compartilhados apenas com: transportadoras (para entrega dos produtos), processadores de pagamento (para transações financeiras), contadores e órgãos fiscais (para emissão de notas fiscais), e autoridades públicas (quando exigido por lei).',
  },
  {
    title: '5. Cookies e Tecnologias de Rastreamento',
    text: 'Utilizamos cookies e tecnologias similares para melhorar sua experiência de navegação, lembrar suas preferências e analisar o tráfego do site. Você pode configurar seu navegador para recusar cookies, mas isso pode afetar algumas funcionalidades. Utilizamos também pixels de rastreamento para campanhas de marketing digital (Facebook Pixel, Google Analytics) quando você consente.',
  },
  {
    title: '6. Segurança dos Dados',
    text: 'Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição. Isso inclui criptografia SSL em todas as páginas, armazenamento seguro em servidores protegidos e acesso restrito aos dados por funcionários autorizados.',
  },
  {
    title: '7. Retenção de Dados',
    text: 'Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades descritas nesta política, observando os prazos legais de retenção obrigatória (como 5 anos para documentos fiscais). Dados de navegação anonimizados podem ser mantidos por tempo indeterminado para fins estatísticos.',
  },
  {
    title: '8. Seus Direitos',
    text: 'Conforme a LGPD, você tem direito a: confirmar a existência de tratamento dos seus dados; acessar seus dados pessoais; corrigir dados incompletos ou desatualizados; solicitar a anonimização, bloqueio ou eliminação de dados desnecessários; solicitar a portabilidade dos dados; revogar o consentimento para marketing. Para exercer esses direitos, entre em contato pelo e-mail: privacidade@agrobrasil.com.br',
  },
  {
    title: '9. Encarregado de Dados (DPO)',
    text: 'Para questões relacionadas à proteção de dados pessoais, entre em contato com nosso encarregado de dados pelo e-mail: privacidade@agrobrasil.com.br. Respostas serão fornecidas em até 15 dias úteis.',
  },
  {
    title: '10. Alterações nesta Política',
    text: 'Esta política pode ser atualizada periodicamente. Quaisquer alterações serão publicadas nesta página com a data de atualização. Recomendamos que visite esta página regularmente.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Seo title="Política de Privacidade" description="Política de privacidade da Agro Brasil conforme a LGPD. Saiba como coletamos, usamos e protegemos seus dados pessoais." canonicalPath="/privacidade" />
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Política de Privacidade</h1>
      <p className="text-muted-foreground mb-8">
        Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
      </p>
      
      <div className="bg-primary/5 rounded-xl p-6 mb-8">
        <p className="text-sm text-muted-foreground leading-relaxed">
          A <strong>Agro Brasil</strong> está comprometida com a proteção da sua privacidade e com o cumprimento 
          da Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018). Esta política descreve como 
          coletamos, usamos, armazenamos e protegemos suas informações pessoais.
        </p>
      </div>

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
