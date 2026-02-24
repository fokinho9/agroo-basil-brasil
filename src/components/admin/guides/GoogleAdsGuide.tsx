import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink, ArrowRight, Zap, Tag, BarChart3, Target, Chrome, Settings } from 'lucide-react';
import { Step, CopySnippet, AutoFeatureList, ConversionEventsTable, TipsCard, standardEvents } from './GuideComponents';

export function GoogleAdsGuide() {
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

  return (
    <div className="space-y-6">
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Zap className="h-5 w-5" />
            O que já está configurado automaticamente
          </CardTitle>
          <CardDescription>Seu site já possui integração nativa com Google Ads.</CardDescription>
        </CardHeader>
        <CardContent>
          <AutoFeatureList items={[
            { icon: Tag, text: 'Tag global do Google Ads (gtag.js) é injetada automaticamente quando você ativa o pixel' },
            { icon: BarChart3, text: 'PageView é disparado em cada navegação de página' },
            { icon: Target, text: 'Eventos AddToCart, Purchase e ViewContent são rastreados' },
            { icon: Chrome, text: 'GCLID (Google Click ID) é capturado dos parâmetros da URL' },
            { icon: Settings, text: 'UTM Source, Medium e Campaign são rastreados automaticamente' },
            { icon: BarChart3, text: 'Dados de conversão ficam disponíveis na aba "Eventos Disparados"' },
          ]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Passo a Passo: Configurar Google Ads</CardTitle>
          <CardDescription>Siga estas etapas para criar campanhas no Google Ads e vincular ao seu site</CardDescription>
        </CardHeader>
        <CardContent>
          <Step number={1} title="Crie sua conta no Google Ads" badge="Obrigatório">
            <p>Acesse{' '}<a href="https://ads.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">ads.google.com <ExternalLink className="h-3 w-3" /></a>{' '}e crie uma conta usando o mesmo Gmail da sua empresa.</p>
            <p>Escolha o objetivo "Vendas" ou "Tráfego para o site" ao configurar a primeira campanha.</p>
          </Step>
          <Step number={2} title="Obtenha seu ID do Google Ads" badge="Obrigatório">
            <p>No Google Ads, vá em <strong>Configurações → Informações da Conta</strong>.</p>
            <p>Copie o <strong>ID do cliente</strong>, formato <code className="bg-muted px-1.5 py-0.5 rounded text-xs">AW-XXXXXXXXXX</code>.</p>
            <div className="flex items-center gap-2 p-2 rounded bg-primary/10 mt-1">
              <ArrowRight className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium">Cole esse ID na aba <strong>"Configurar Pixels"</strong> → <strong>Google Ads</strong> e ative.</span>
            </div>
          </Step>
          <Step number={3} title="Configure o Acompanhamento de Conversões" badge="Recomendado">
            <p>No Google Ads:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Vá em <strong>Ferramentas e Configurações → Conversões</strong></li>
              <li>Clique em <strong>"+ Nova ação de conversão"</strong></li>
              <li>Escolha <strong>"Site"</strong></li>
              <li>Defina o nome (ex: "Compra" ou "Adicionar ao Carrinho")</li>
              <li>Copie o <strong>Rótulo de Conversão</strong> (Conversion Label)</li>
            </ol>
            <div className="flex items-center gap-2 p-2 rounded bg-primary/10 mt-1">
              <ArrowRight className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium">Cole o Rótulo no campo <strong>"Conversion Label"</strong> na aba de configuração.</span>
            </div>
          </Step>
          <Step number={4} title="Crie sua Campanha" badge="Google Ads">
            <ol className="list-decimal ml-4 space-y-1">
              <li>Clique em <strong>"+ Nova Campanha"</strong></li>
              <li>Objetivo: <strong>Vendas</strong> ou <strong>Tráfego para o site</strong></li>
              <li>Tipo: <strong>Pesquisa</strong> ou <strong>Performance Max</strong></li>
              <li>Defina o orçamento diário</li>
              <li>Adicione palavras-chave do nicho (ex: "bota country", "sela para cavalo")</li>
              <li>No URL de destino, use seu site com UTMs:</li>
            </ol>
            <CopySnippet label="URL com rastreamento UTM" code={`${siteUrl}/produtos?utm_source=google&utm_medium=cpc&utm_campaign=nome-da-campanha`} />
          </Step>
          <Step number={5} title="Verifique se Está Funcionando">
            <ol className="list-decimal ml-4 space-y-1">
              <li>Vá na aba <strong>"Eventos Disparados"</strong> nesta página</li>
              <li>Verifique se aparecem eventos de <code className="bg-muted px-1 py-0.5 rounded text-xs">google_ads</code></li>
              <li>No Google Ads, vá em <strong>Ferramentas → Verificação de Tags</strong></li>
            </ol>
          </Step>
        </CardContent>
      </Card>

      <TipsCard tips={[
        'Ative o "Auto-tagging" no Google Ads para capturar o GCLID automaticamente.',
        'Use o Google Analytics (GA4) junto com o Google Ads para dados mais completos.',
        'Comece com orçamento baixo (R$ 20-50/dia) e escale com base nos dados de conversão.',
        'Para remarketing, configure o público no Google Ads usando os dados de PageView.',
      ]} />

      <ConversionEventsTable events={standardEvents} platform="Google Ads" />
    </div>
  );
}
