import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink, ArrowRight, Zap, Tag, BarChart3, Target, Video, Settings } from 'lucide-react';
import { Step, CopySnippet, AutoFeatureList, ConversionEventsTable, TipsCard, standardEvents } from './GuideComponents';

export function TikTokAdsGuide() {
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

  return (
    <div className="space-y-6">
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Zap className="h-5 w-5" />
            O que já está configurado automaticamente
          </CardTitle>
          <CardDescription>Seu site já possui integração nativa com o TikTok Pixel.</CardDescription>
        </CardHeader>
        <CardContent>
          <AutoFeatureList items={[
            { icon: Tag, text: 'TikTok Pixel (ttq) é injetado automaticamente quando ativado' },
            { icon: BarChart3, text: 'PageView é disparado a cada navegação de página' },
            { icon: Target, text: 'Eventos AddToCart, Purchase e ViewContent são rastreados' },
            { icon: Video, text: 'Rastreamento funciona tanto em tráfego orgânico quanto de anúncios' },
            { icon: Settings, text: 'UTM Source, Medium e Campaign são rastreados automaticamente' },
            { icon: BarChart3, text: 'Todos os eventos ficam na aba "Eventos Disparados"' },
          ]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Passo a Passo: Configurar TikTok Ads</CardTitle>
          <CardDescription>Siga estas etapas para anunciar no TikTok e rastrear conversões</CardDescription>
        </CardHeader>
        <CardContent>
          <Step number={1} title="Crie sua conta no TikTok Ads Manager" badge="Obrigatório">
            <p>Acesse{' '}<a href="https://ads.tiktok.com" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">ads.tiktok.com <ExternalLink className="h-3 w-3" /></a>{' '}e crie uma conta Business.</p>
            <p>Preencha os dados da empresa e aguarde a aprovação (geralmente leva algumas horas).</p>
          </Step>

          <Step number={2} title="Crie o Pixel do TikTok" badge="Obrigatório">
            <ol className="list-decimal ml-4 space-y-1">
              <li>No TikTok Ads Manager, vá em <strong>Ativos → Eventos → Gerenciar</strong></li>
              <li>Clique em <strong>"Configurar Eventos Web"</strong></li>
              <li>Escolha <strong>"TikTok Pixel"</strong></li>
              <li>Selecione <strong>"Instalar código do pixel manualmente"</strong></li>
              <li>Copie o <strong>Pixel ID</strong> (formato: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">CXXXXXXXXXXXXXXXXX</code>)</li>
            </ol>
            <div className="flex items-center gap-2 p-2 rounded bg-primary/10 mt-1">
              <ArrowRight className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium">Cole esse ID na aba <strong>"Configurar Pixels"</strong> → <strong>TikTok Pixel</strong> e ative.</span>
            </div>
          </Step>

          <Step number={3} title="Configure Eventos de Conversão" badge="Recomendado">
            <p>No TikTok Ads Manager, após criar o pixel:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Vá em <strong>"Concluir configuração"</strong></li>
              <li>Na tela de eventos, selecione os eventos que deseja rastrear:</li>
            </ol>
            <div className="bg-muted rounded-lg p-3 mt-2 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Eventos recomendados:</p>
              <ol className="list-decimal ml-4 text-xs space-y-0.5">
                <li><strong>View Content</strong> — Ver produto</li>
                <li><strong>Add to Cart</strong> — Adicionar ao carrinho</li>
                <li><strong>Initiate Checkout</strong> — Início do checkout</li>
                <li><strong>Complete Payment</strong> — Compra finalizada</li>
              </ol>
            </div>
            <p className="mt-2">Selecione <strong>"Code Mode"</strong> — o site já dispara esses eventos automaticamente!</p>
          </Step>

          <Step number={4} title="Crie sua Campanha" badge="TikTok Ads">
            <ol className="list-decimal ml-4 space-y-1">
              <li>No TikTok Ads Manager, clique em <strong>"Criar"</strong></li>
              <li>Objetivo: <strong>Conversões no site</strong> ou <strong>Tráfego</strong></li>
              <li>Selecione o pixel e o evento de otimização (ex: <strong>Complete Payment</strong>)</li>
              <li>Defina o público: localização, idade, interesses (ex: "agro", "cavalos", "vida no campo")</li>
              <li>Defina o orçamento (mínimo R$ 50/dia recomendado)</li>
              <li>Na URL de destino, use UTMs:</li>
            </ol>
            <CopySnippet label="URL com rastreamento UTM" code={`${siteUrl}/produtos?utm_source=tiktok&utm_medium=cpc&utm_campaign=nome-da-campanha`} />
          </Step>

          <Step number={5} title="Crie seu Criativo em Vídeo" badge="Importante">
            <p>O TikTok é uma plataforma de vídeos curtos. Para ter bons resultados:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Grave vídeos de <strong>15-30 segundos</strong> mostrando seus produtos</li>
              <li>Use formato <strong>vertical (9:16)</strong></li>
              <li>Comece com um <strong>gancho nos primeiros 3 segundos</strong> (ex: "Olha essa sela!")</li>
              <li>Use o <strong>TikTok Creative Center</strong> para inspiração: <a href="https://ads.tiktok.com/business/creativecenter" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">Creative Center <ExternalLink className="h-3 w-3" /></a></li>
            </ol>
          </Step>

          <Step number={6} title="Verifique se Está Funcionando">
            <ol className="list-decimal ml-4 space-y-1">
              <li>Instale a extensão <a href="https://chrome.google.com/webstore/detail/tiktok-pixel-helper" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">TikTok Pixel Helper <ExternalLink className="h-3 w-3" /></a> no Chrome</li>
              <li>Acesse seu site e veja se o pixel aparece como ativo</li>
              <li>No TikTok Ads Manager, vá em <strong>Ativos → Eventos</strong> e verifique eventos recebidos</li>
              <li>Nesta página, vá na aba <strong>"Eventos Disparados"</strong> e filtre por <code className="bg-muted px-1 py-0.5 rounded text-xs">tiktok</code></li>
            </ol>
          </Step>
        </CardContent>
      </Card>

      <TipsCard tips={[
        'No TikTok, criativos autênticos e "caseiros" performam melhor que vídeos muito produzidos.',
        'Use a função "Spark Ads" para impulsionar posts orgânicos que já tiveram engajamento.',
        'Comece otimizando para "Add to Cart" até acumular dados, depois mude para "Complete Payment".',
        'O público "Broad" (sem interesses específicos) funciona muito bem no TikTok — o algoritmo encontra seu público.',
        'Teste pelo menos 3-5 criativos diferentes por grupo de anúncios para encontrar o melhor.',
      ]} />

      <ConversionEventsTable events={standardEvents} platform="TikTok Ads" />
    </div>
  );
}
