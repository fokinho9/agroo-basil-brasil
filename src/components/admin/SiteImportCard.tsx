import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Loader2, Check, AlertCircle, ExternalLink, SkipForward, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveImportJob } from '@/hooks/useImportJobs';
import { toast } from 'sonner';
import { Category } from '@/types';

interface ProductLog {
  url: string;
  name: string | null;
  price: number | null;
  status: 'success' | 'error' | 'skipped';
  productId: string | null;
  message: string;
}

interface SiteImportCardProps {
  categories: Category[];
  onComplete: () => void;
}

const LOGS_PER_PAGE = 15;

function LogEntry({ log }: { log: ProductLog }) {
  const statusIcon = log.status === 'success'
    ? <Check className="h-4 w-4 text-green-600 shrink-0" />
    : log.status === 'skipped'
    ? <SkipForward className="h-4 w-4 text-yellow-600 shrink-0" />
    : <XCircle className="h-4 w-4 text-destructive shrink-0" />;

  const productLink = log.productId ? `/produto/${log.productId}` : null;

  return (
    <div className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0 text-sm">
      {statusIcon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{log.name || 'Sem nome'}</span>
          {log.price != null && (
            <span className="text-muted-foreground text-xs">
              R$ {log.price.toFixed(2)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{log.message}</p>
        <div className="flex gap-2 mt-1">
          {productLink && (
            <a href={productLink} target="_blank" rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1">
              <ExternalLink className="h-3 w-3" /> Ver produto
            </a>
          )}
          <a href={log.url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
            <ExternalLink className="h-3 w-3" /> Fonte
          </a>
        </div>
      </div>
    </div>
  );
}

function PaginatedLogs({ logs }: { logs: ProductLog[] }) {
  const [page, setPage] = useState(0);

  // Reset page when new logs come in and we're viewing beyond available pages
  const totalPages = Math.max(1, Math.ceil(logs.length / LOGS_PER_PAGE));
  const currentPage = Math.min(page, totalPages - 1);

  // Show newest first
  const reversedLogs = useMemo(() => [...logs].reverse(), [logs]);
  const paginatedLogs = reversedLogs.slice(currentPage * LOGS_PER_PAGE, (currentPage + 1) * LOGS_PER_PAGE);

  if (logs.length === 0) return null;

  return (
    <div className="bg-muted/30 rounded-lg border border-border">
      <div className="p-3 border-b border-border bg-muted/50 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Log de importação ({logs.length} itens)
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="icon" className="h-6 w-6"
              disabled={currentPage === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="ghost" size="icon" className="h-6 w-6"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      <div className="p-3">
        {paginatedLogs.map((log, i) => (
          <LogEntry key={`${currentPage}-${i}`} log={log} />
        ))}
      </div>
    </div>
  );
}

export function SiteImportCard({ categories, onComplete }: SiteImportCardProps) {
  const [siteUrl, setSiteUrl] = useState('https://www.cavalariashop.com.br/');
  const [categoryId, setCategoryId] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [dismissedJobId, setDismissedJobId] = useState<string | null>(null);

  const { data: rawActiveJob, refetch: refetchJob } = useActiveImportJob('site-import');
  const activeJob = rawActiveJob && rawActiveJob.id !== dismissedJobId ? rawActiveJob : null;

  const handleStart = async () => {
    if (!siteUrl.trim()) {
      toast.error('Digite a URL do site');
      return;
    }

    setIsStarting(true);
    try {
      const { data: newJob, error: insertError } = await supabase
        .from('import_jobs')
        .insert({
          type: 'site-import',
          status: 'pending',
          total_items: 0,
          config: { siteUrl: siteUrl.trim(), categoryId: categoryId || null },
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { error: fnError } = await supabase.functions.invoke('import-from-site', {
        body: { jobId: newJob.id },
      });

      if (fnError) {
        await supabase.from('import_jobs').update({
          status: 'failed',
          error_message: fnError.message,
        }).eq('id', newJob.id);
        throw fnError;
      }

      toast.success('Importação iniciada! Acompanhe o progresso abaixo.');
      setDismissedJobId(null);
      refetchJob();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao iniciar importação');
    } finally {
      setIsStarting(false);
    }
  };

  const handleCancel = async () => {
    if (!activeJob) return;
    await supabase.from('import_jobs').update({
      status: 'failed',
      error_message: 'Cancelado pelo usuário',
    }).eq('id', activeJob.id);
    setDismissedJobId(activeJob.id);
    refetchJob();
    toast.info('Importação cancelada');
  };

  const isRunning = activeJob?.status === 'running' || activeJob?.status === 'pending';
  const progress = activeJob?.total_items
    ? Math.round(((activeJob.processed_items || 0) / activeJob.total_items) * 100)
    : 0;
  const logs: ProductLog[] = (activeJob?.results as any)?.logs || [];

  if (activeJob?.status === 'completed') {
    onComplete();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Importar Produtos de Site Externo
        </CardTitle>
        <CardDescription>
          Mapeia e importa automaticamente todos os produtos de um site usando Firecrawl
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isRunning ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">Importação em andamento...</span>
            </div>
            <Progress value={progress} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{activeJob.processed_items || 0} / {activeJob.total_items || '?'} produtos</span>
              <span>
                ✅ {activeJob.success_count || 0} |
                ❌ {activeJob.error_count || 0}
                {(activeJob.results as any)?.skipped ? ` | ⏭️ ${(activeJob.results as any).skipped}` : ''}
              </span>
            </div>

            <PaginatedLogs logs={logs} />

            <Button variant="destructive" onClick={handleCancel} size="sm">
              Cancelar Importação
            </Button>
          </div>
        ) : activeJob?.status === 'completed' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span className="font-medium">Importação concluída!</span>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-1">
              <p>✅ <strong>{activeJob.success_count}</strong> produtos importados</p>
              <p>❌ <strong>{activeJob.error_count}</strong> erros</p>
              {(activeJob.results as any)?.skipped > 0 && (
                <p>⏭️ <strong>{(activeJob.results as any).skipped}</strong> duplicados ignorados</p>
              )}
              <p className="text-muted-foreground">Total processado: {activeJob.processed_items} / {activeJob.total_items}</p>
            </div>

            <PaginatedLogs logs={logs} />

            <Button onClick={() => { setDismissedJobId(activeJob.id); onComplete(); }}>
              Iniciar Nova Importação
            </Button>
          </div>
        ) : activeJob?.status === 'failed' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Importação falhou</span>
            </div>
            {activeJob.error_message && (
              <p className="text-sm text-muted-foreground">{activeJob.error_message}</p>
            )}
            {(activeJob.success_count || 0) > 0 && (
              <p className="text-sm">{activeJob.success_count} produtos foram importados antes do erro.</p>
            )}

            <PaginatedLogs logs={logs} />

            <Button onClick={() => setDismissedJobId(activeJob.id)}>
              Iniciar Nova Importação
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>URL do Site</Label>
              <Input
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://www.cavalariashop.com.br/"
              />
            </div>

            <div>
              <Label>Categoria (opcional)</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground space-y-1">
              <p>🔍 O sistema irá:</p>
              <p>1. Mapear todas as URLs de produtos do site</p>
              <p>2. Importar produto por produto automaticamente</p>
              <p>3. Ignorar produtos duplicados (por nome)</p>
              <p>4. Continuar até processar todos os produtos</p>
              <p>5. Mostrar log em tempo real com paginação</p>
            </div>

            <Button
              onClick={handleStart}
              disabled={isStarting || !siteUrl.trim()}
              size="lg"
              className="w-full"
            >
              {isStarting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Iniciar Importação do Site
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
