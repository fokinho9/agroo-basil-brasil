import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface StepProps {
  number: number;
  title: string;
  children: React.ReactNode;
  badge?: string;
}

export function Step({ number, title, children, badge }: StepProps) {
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

export function CopySnippet({ code, label }: { code: string; label: string }) {
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

export function AutoFeatureList({ items }: { items: { icon: React.ElementType; text: string }[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
            <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span className="text-sm">{item.text}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ConversionEventsTable({ events, platform }: { events: { event: string; desc: string }[]; platform: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Eventos de Conversão Rastreados</CardTitle>
        <CardDescription>
          Eventos disparados automaticamente que podem ser usados como ações de conversão no {platform}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {events.map((e) => (
            <div key={e.event} className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background px-2 py-1 rounded border font-mono">{e.event}</code>
                <span className="text-sm text-muted-foreground">{e.desc}</span>
              </div>
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                Automático
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TipsCard({ tips }: { tips: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💡 Dicas Importantes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-primary mt-0.5 shrink-0">•</span>
            <span className="text-sm">{tip}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export const standardEvents = [
  { event: 'PageView', desc: 'Visualização de página (todas as páginas)' },
  { event: 'ViewContent', desc: 'Visualização de produto (página de produto)' },
  { event: 'AddToCart', desc: 'Produto adicionado ao carrinho' },
  { event: 'InitiateCheckout', desc: 'Início do checkout' },
  { event: 'Purchase', desc: 'Compra finalizada' },
  { event: 'Search', desc: 'Busca de produtos' },
];
