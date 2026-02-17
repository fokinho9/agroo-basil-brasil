import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertCircle, ExternalLink, Loader2, Check, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Category } from '@/types';

interface FailedUrl {
  url: string;
  message: string;
}

interface FailedImportsCardProps {
  categories: Category[];
  onComplete: () => void;
}

export function FailedImportsCard({ categories, onComplete }: FailedImportsCardProps) {
  const [failedUrls, setFailedUrls] = useState<FailedUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryId, setCategoryId] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({ success: 0, errors: 0, total: 0 });
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

  const fetchFailedUrls = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('results, config')
        .eq('type', 'site-import')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const allFailed: FailedUrl[] = [];
      const seenUrls = new Set<string>();

      for (const job of data || []) {
        const logs = (job.results as any)?.logs || [];
        for (const log of logs) {
          if (log.status === 'error' && log.url && log.url !== 'unknown' && !seenUrls.has(log.url)) {
            seenUrls.add(log.url);
            allFailed.push({ url: log.url, message: log.message || 'Erro desconhecido' });
          }
        }
      }

      setFailedUrls(allFailed);
      setSelectedUrls(new Set(allFailed.map(f => f.url)));
    } catch (err: any) {
      toast.error('Erro ao buscar URLs com falha');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFailedUrls();
  }, []);

  const toggleUrl = (url: string) => {
    setSelectedUrls(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedUrls.size === failedUrls.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(failedUrls.map(f => f.url)));
    }
  };

  const removeUrl = (url: string) => {
    setFailedUrls(prev => prev.filter(f => f.url !== url));
    setSelectedUrls(prev => {
      const next = new Set(prev);
      next.delete(url);
      return next;
    });
  };

  const handleRetryImport = async () => {
    const urls = failedUrls.filter(f => selectedUrls.has(f.url)).map(f => f.url);
    if (urls.length === 0) {
      toast.error('Selecione pelo menos uma URL');
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setResults({ success: 0, errors: 0, total: urls.length });

    try {
      // Create import job with the failed URLs
      const { data: newJob, error: insertError } = await supabase
        .from('import_jobs')
        .insert({
          type: 'site-import',
          status: 'pending',
          total_items: urls.length,
          config: {
            siteUrl: 'retry-failed',
            categoryId: categoryId || null,
            retryUrls: urls,
          },
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

      toast.success(`Reimportação de ${urls.length} produtos iniciada! Acompanhe na aba "Importar Site".`);
      onComplete();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao iniciar reimportação');
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Produtos com Erro na Importação
        </CardTitle>
        <CardDescription>
          {failedUrls.length} URLs que falharam nas últimas importações. Selecione e tente reimportar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {failedUrls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p>Nenhuma URL com erro encontrada!</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  {selectedUrls.size === failedUrls.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedUrls.size} de {failedUrls.length} selecionados
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchFailedUrls}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Atualizar
              </Button>
            </div>

            <div className="border rounded-lg max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 w-10"></th>
                    <th className="text-left p-2">URL</th>
                    <th className="text-left p-2">Erro</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {failedUrls.map((item) => {
                    const shortName = item.url.split('/').pop()?.replace(/-/g, ' ') || item.url;
                    return (
                      <tr key={item.url} className="border-t hover:bg-muted/50">
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedUrls.has(item.url)}
                            onChange={() => toggleUrl(item.url)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium capitalize truncate max-w-xs">
                              {shortName}
                            </span>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Ver original
                            </a>
                          </div>
                        </td>
                        <td className="p-2">
                          <span className="text-xs text-destructive">{item.message}</span>
                        </td>
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removeUrl(item.url)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div>
              <Label>Categoria (opcional)</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Usar categoria do site original" />
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

            <Button
              onClick={handleRetryImport}
              disabled={isImporting || selectedUrls.size === 0}
              size="lg"
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Iniciando reimportação...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reimportar {selectedUrls.size} Produtos
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
