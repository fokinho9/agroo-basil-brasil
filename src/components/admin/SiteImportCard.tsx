import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Loader2, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveImportJob } from '@/hooks/useImportJobs';
import { toast } from 'sonner';
import { Category } from '@/types';

interface SiteImportCardProps {
  categories: Category[];
  onComplete: () => void;
}

export function SiteImportCard({ categories, onComplete }: SiteImportCardProps) {
  const [siteUrl, setSiteUrl] = useState('https://www.cavalariashop.com.br/');
  const [categoryId, setCategoryId] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const { data: activeJob, refetch: refetchJob } = useActiveImportJob('site-import');

  const handleStart = async () => {
    if (!siteUrl.trim()) {
      toast.error('Digite a URL do site');
      return;
    }

    setIsStarting(true);
    try {
      // Create import job
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

      // Trigger edge function
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

      toast.success('Importação iniciada em background!');
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
    refetchJob();
    toast.info('Importação cancelada');
  };

  const isRunning = activeJob?.status === 'running' || activeJob?.status === 'pending';
  const progress = activeJob?.total_items 
    ? Math.round((activeJob.processed_items / activeJob.total_items) * 100) 
    : 0;

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
                {(activeJob.results as any)?.skipped ? ` | ⏭️ ${(activeJob.results as any).skipped} duplicados` : ''}
              </span>
            </div>
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
              <p className="text-muted-foreground">Total processado: {activeJob.processed_items}</p>
            </div>
            <Button onClick={() => { refetchJob(); onComplete(); }}>
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
            {activeJob.success_count > 0 && (
              <p className="text-sm">Mesmo assim, {activeJob.success_count} produtos foram importados antes do erro.</p>
            )}
            <Button onClick={() => refetchJob()}>
              Tentar Novamente
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
              <p>2. Extrair nome, preço, imagem e descrição de cada produto</p>
              <p>3. Ignorar produtos duplicados (por nome)</p>
              <p>4. Inserir os novos produtos no banco de dados</p>
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
