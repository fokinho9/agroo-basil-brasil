import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink, ArrowRight, Zap, Tag, BarChart3, Target, Users, Settings } from 'lucide-react';
import { Step, CopySnippet, AutoFeatureList, ConversionEventsTable, TipsCard, standardEvents } from './GuideComponents';

export function MetaAdsGuide() {
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

  return (
    <div className="space-y-6">
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Zap className="h-5 w-5" />
            O que já está configurado automaticamente
          </CardTitle>
          <CardDescription>Seu site já possui integração nativa com o Meta Pixel (Facebook/Instagram Ads).</CardDescription>
        </CardHeader>
        <CardContent>
          <AutoFeatureList items={[
            { icon: Tag, text: 'Meta Pixel (fbevents.js) é injetado automaticamente quando ativado' },
            { icon: BarChart3, text: 'PageView é disparado a cada navegação de página' },
            { icon: Target, text: 'Eventos AddToCart, Purchase, ViewContent e InitiateCheckout são rastreados' },
            { icon: Users, text: 'FBCLID (Facebook Click ID) é capturado automaticamente da URL' },
            { icon: Settings, text: 'UTM Source, Medium e Campaign são rastreados' },
            { icon: BarChart3, text: 'Todos os eventos ficam disponíveis na aba "Eventos Disparados"' },
          ]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Passo a Passo: Configurar Meta Ads (Facebook/Instagram)</CardTitle>
          <CardDescription>Siga estas etapas para criar campanhas e vincular ao seu site</CardDescription>
        </CardHeader>
        <CardContent>
          <Step number={1} title="Crie sua conta no Meta Business Suite" badge="Obrigatório">
            <p>Acesse{' '}<a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">business.facebook.com <ExternalLink className="h-3 w-3" /></a>{' '}e crie uma conta Business.</p>
            <p>Se já tem página do Facebook ou Instagram comercial, vincule-os à conta Business.</p>
          </Step>

          <Step number={2} title="Crie o Pixel do Meta" badge="Obrigatório">
            <ol className="list-decimal ml-4 space-y-1">
              <li>No Business Suite, vá em <strong>Todas as Ferramentas → Gerenciador de Eventos</strong></li>
              <li>Clique em <strong>"Conectar Fontes de Dados" → "Web"</strong></li>
              <li>Escolha <strong>"Meta Pixel"</strong> e dê um nome (ex: "Agro Brasil")</li>
              <li>Copie o <strong>ID do Pixel</strong> (número com ~15 dígitos)</li>
            </ol>
            <div className="flex items-center gap-2 p-2 rounded bg-primary/10 mt-1">
              <ArrowRight className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium">Cole esse ID na aba <strong>"Configurar Pixels"</strong> → <strong>Facebook Pixel (Meta)</strong> e ative.</span>
            </div>
          </Step>

          <Step number={3} title="Configure Eventos de Conversão" badge="Recomendado">
            <p>No Gerenciador de Eventos:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Selecione seu Pixel → aba <strong>"Configurações"</strong></li>
              <li>Em <strong>"Medição de eventos agregados"</strong>, clique em <strong>"Gerenciar eventos"</strong></li>
              <li>Adicione seu domínio e configure a prioridade dos eventos:</li>
            </ol>
            <div className="bg-muted rounded-lg p-3 mt-2 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Prioridade recomendada (do maior para menor):</p>
              <ol className="list-decimal ml-4 text-xs space-y-0.5">
                <li><strong>Purchase</strong> — Compra finalizada</li>
                <li><strong>InitiateCheckout</strong> — Início do checkout</li>
                <li><strong>AddToCart</strong> — Adicionar ao carrinho</li>
                <li><strong>ViewContent</strong> — Ver produto</li>
              </ol>
            </div>
          </Step>

          <Step number={4} title="Verifique o Domínio" badge="Importante">
            <ol className="list-decimal ml-4 space-y-1">
              <li>No Business Suite, vá em <strong>Configurações do Negócio → Brand Safety → Domínios</strong></li>
              <li>Adicione seu domínio e verifique com uma das opções (DNS ou meta tag)</li>
              <li>A verificação é necessária para rastrear conversões no iOS 14+</li>
            </ol>
          </Step>

          <Step number={5} title="Crie sua Campanha" badge="Meta Ads">
            <ol className="list-decimal ml-4 space-y-1">
              <li>Acesse{' '}<a href="https://www.facebook.com/adsmanager" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">Gerenciador de Anúncios <ExternalLink className="h-3 w-3" /></a></li>
              <li>Clique em <strong>"+ Criar"</strong></li>
              <li>Objetivo: <strong>Vendas</strong> (conversão) ou <strong>Tráfego</strong></li>
              <li>Defina o público-alvo: localização, idade, interesses (ex: "vida rural", "cavalo", "agropecuária")</li>
              <li>Escolha os posicionamentos: <strong>Feed do Instagram</strong>, <strong>Stories</strong>, <strong>Feed do Facebook</strong></li>
              <li>Defina orçamento e cronograma</li>
              <li>Na URL de destino, use UTMs:</li>
            </ol>
            <CopySnippet label="URL com rastreamento UTM" code={`${siteUrl}/produtos?utm_source=facebook&utm_medium=cpc&utm_campaign=nome-da-campanha`} />
          </Step>

          <Step number={6} title="Crie Públicos Personalizados" badge="Avançado">
            <p>No Gerenciador de Eventos → <strong>Públicos</strong>:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li><strong>Visitantes do site</strong> — quem visitou nos últimos 30 dias (remarketing)</li>
              <li><strong>AddToCart sem Purchase</strong> — quem adicionou ao carrinho mas não comprou</li>
              <li><strong>Lookalike</strong> — público semelhante aos seus compradores</li>
            </ol>
            <p className="mt-1">Esses públicos são criados automaticamente com base nos eventos que o site já dispara.</p>
          </Step>

          <Step number={7} title="Verifique se Está Funcionando">
            <ol className="list-decimal ml-4 space-y-1">
              <li>Instale a extensão <a href="https://chrome.google.com/webstore/detail/meta-pixel-helper" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">Meta Pixel Helper <ExternalLink className="h-3 w-3" /></a> no Chrome</li>
              <li>Acesse seu site e veja se o pixel está disparando</li>
              <li>No Gerenciador de Eventos, verifique se os eventos aparecem em tempo real</li>
              <li>Nesta página, vá na aba <strong>"Eventos Disparados"</strong> e filtre por <code className="bg-muted px-1 py-0.5 rounded text-xs">facebook</code></li>
            </ol>
          </Step>
        </CardContent>
      </Card>

      <TipsCard tips={[
        'Sempre verifique seu domínio no Meta Business Suite — sem isso, o rastreamento no iOS é limitado.',
        'Use o Conversions API (CAPI) se precisar de dados mais precisos — isso requer configuração no servidor.',
        'Comece com R$ 30-50/dia e otimize para o evento "Purchase" após ter pelo menos 50 conversões.',
        'Use criativos em vídeo (Reels) para melhor alcance e menor custo por clique.',
        'Crie públicos Lookalike baseados em compradores para encontrar novos clientes semelhantes.',
      ]} />

      <ConversionEventsTable events={standardEvents} platform="Meta Ads" />
    </div>
  );
}
