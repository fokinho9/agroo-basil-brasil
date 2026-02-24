import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2, ExternalLink, ArrowRight, AlertTriangle,
  Chrome, Settings, Tag, BarChart3, Target, Zap, Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface StepProps {
  number: number;
  title: string;
  children: React.ReactNode;
  badge?: string;
}

function Step({ number, title, children, badge }: StepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
          {number}
        </div>
        <div className="w-px flex-1 bg-border mt-2" />
      </div>
      <div className="pb-8">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold text-foreground">{title}</h3>
          {badge && <Badge variant="outline" className="text-xs">{badge}</Badge>}
        </div>
        <div className="text-sm text-muted-foreground space-y-2">{children}</div>
      </div>
    </div>
  );
}

function CopySnippet({ code, label }: { code: string; label: string }) {
  return (
    <div className="bg-muted rounded-lg p-3 mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 text-xs"
          onClick={() => { navigator.clipboard.writeText(code); toast.success('Copiado!'); }}
        >
          <Copy className="h-3 w-3" /> Copiar
        </Button>
      </div>
      <code className="text-xs block whitespace-pre-wrap break-all text-foreground">{code}</code>
    </div>
  );
}

export function GoogleAdsGuide() {
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

  return (
    <div className="space-y-6">
      {/* What's already automatic */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Zap className="h-5 w-5" />
            O que já está configurado automaticamente
          </CardTitle>
          <CardDescription>
            Seu site já possui integração nativa com Google Ads. Veja o que funciona automaticamente:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: Tag, text: 'Tag global do Google Ads (gtag.js) é injetada automaticamente quando você ativa o pixel' },
              { icon: BarChart3, text: 'PageView é disparado em cada navegação de página' },
              { icon: Target, text: 'Eventos AddToCart, Purchase e ViewContent são rastreados' },
              { icon: Chrome, text: 'GCLID (Google Click ID) é capturado dos parâmetros da URL' },
              { icon: Settings, text: 'UTM Source, Medium e Campaign são rastreados automaticamente' },
              { icon: BarChart3, text: 'Dados de conversão ficam disponíveis na aba "Eventos Disparados"' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step by step */}
      <Card>
        <CardHeader>
          <CardTitle>Passo a Passo: Configurar Google Ads com seu Site</CardTitle>
          <CardDescription>
            Siga estas etapas para criar campanhas no Google Ads e vincular ao seu site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Step number={1} title="Crie sua conta no Google Ads" badge="Obrigatório">
            <p>
              Acesse{' '}
              <a href="https://ads.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
                ads.google.com <ExternalLink className="h-3 w-3" />
              </a>{' '}
              e crie uma conta usando o mesmo Gmail da sua empresa.
            </p>
            <p>Escolha o objetivo "Vendas" ou "Tráfego para o site" ao configurar a primeira campanha.</p>
          </Step>

          <Step number={2} title="Obtenha seu ID do Google Ads" badge="Obrigatório">
            <p>No Google Ads, vá em <strong>Configurações → Informações da Conta</strong>.</p>
            <p>Copie o <strong>ID do cliente</strong>, que tem o formato <code className="bg-muted px-1.5 py-0.5 rounded text-xs">AW-XXXXXXXXXX</code>.</p>
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
              <li>Selecione a categoria <strong>"Compra/Venda"</strong></li>
              <li>Copie o <strong>Rótulo de Conversão</strong> (Conversion Label)</li>
            </ol>
            <div className="flex items-center gap-2 p-2 rounded bg-primary/10 mt-1">
              <ArrowRight className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium">Cole o Rótulo de Conversão no campo <strong>"Conversion Label"</strong> na aba de configuração do Google Ads.</span>
            </div>
          </Step>

          <Step number={4} title="(Opcional) Google Tag Manager" badge="Avançado">
            <p>Se preferir gerenciar todas as tags por um único lugar:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Acesse <a href="https://tagmanager.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">tagmanager.google.com <ExternalLink className="h-3 w-3" /></a></li>
              <li>Crie um container e copie o ID <code className="bg-muted px-1.5 py-0.5 rounded text-xs">GTM-XXXXXXX</code></li>
              <li>Cole o ID na aba <strong>"Configurar Pixels"</strong> → <strong>Google Tag Manager</strong></li>
              <li>No GTM, crie tags de conversão do Google Ads usando o mesmo Conversion ID e Label</li>
            </ol>
          </Step>

          <Step number={5} title="Crie sua Campanha" badge="Google Ads">
            <p>De volta ao Google Ads:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Clique em <strong>"+ Nova Campanha"</strong></li>
              <li>Objetivo: <strong>Vendas</strong> ou <strong>Tráfego para o site</strong></li>
              <li>Tipo: <strong>Pesquisa</strong> (anúncio no Google) ou <strong>Performance Max</strong></li>
              <li>Defina o orçamento diário</li>
              <li>Adicione as palavras-chave do seu nicho (ex: "bota country", "sela para cavalo")</li>
              <li>No URL de destino, use seu site com UTMs:</li>
            </ol>
            <CopySnippet
              label="URL com rastreamento UTM"
              code={`${siteUrl}/produtos?utm_source=google&utm_medium=cpc&utm_campaign=nome-da-campanha`}
            />
            <p className="mt-2">
              <strong>Dica:</strong> O Google Ads também gera UTMs automaticamente com o auto-tagging (gclid).
            </p>
          </Step>

          <Step number={6} title="Verifique se Está Funcionando">
            <p>Após ativar a campanha e clicar no seu anúncio de teste:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Vá na aba <strong>"Eventos Disparados"</strong> nesta página</li>
              <li>Verifique se aparecem eventos de <code className="bg-muted px-1 py-0.5 rounded text-xs">google_ads</code></li>
              <li>No Google Ads, vá em <strong>Ferramentas → Verificação de Tags</strong></li>
              <li>Verifique se o status mostra <strong>"Tag ativa"</strong></li>
            </ol>
          </Step>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Dicas Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            'Ative o "Auto-tagging" no Google Ads para capturar o GCLID automaticamente — ele já é rastreado pelo nosso sistema.',
            'Use o Google Analytics (GA4) junto com o Google Ads para ter dados mais completos sobre o comportamento dos visitantes.',
            'Sempre use UTMs nas URLs dos anúncios para ter rastreamento redundante no nosso painel de Analytics.',
            'Comece com orçamento baixo (R$ 20-50/dia) e escale com base nos dados de conversão.',
            'Para remarketing, configure o público no Google Ads usando os dados de PageView que o site já envia.',
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <span className="text-sm">{tip}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Conversion events reference */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos de Conversão Rastreados</CardTitle>
          <CardDescription>
            Estes eventos são disparados automaticamente e podem ser usados como ações de conversão no Google Ads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { event: 'PageView', desc: 'Visualização de página (todas as páginas)', auto: true },
              { event: 'ViewContent', desc: 'Visualização de produto (página de produto)', auto: true },
              { event: 'AddToCart', desc: 'Produto adicionado ao carrinho', auto: true },
              { event: 'InitiateCheckout', desc: 'Início do checkout', auto: true },
              { event: 'Purchase', desc: 'Compra finalizada', auto: true },
              { event: 'Search', desc: 'Busca de produtos', auto: true },
            ].map((e) => (
              <div key={e.event} className="flex items-center justify-between p-2 rounded bg-muted/50">
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-background px-2 py-1 rounded border font-mono">{e.event}</code>
                  <span className="text-sm text-muted-foreground">{e.desc}</span>
                </div>
                <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                  Automático
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
