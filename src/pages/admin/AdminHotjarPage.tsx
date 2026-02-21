import { useState, useMemo, useEffect, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  MousePointer, MessageSquare, BarChart2, TrendingDown, Plus, Trash2, Star,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

// ---- Hooks ----

function useClickEvents(path: string, days: number) {
  return useQuery({
    queryKey: ['click-events', path, days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      const { data, error } = await supabase
        .from('click_events')
        .select('*')
        .eq('path', path)
        .gte('created_at', since)
        .limit(5000);
      if (error) throw error;
      return data || [];
    },
  });
}

function useScrollEvents(days: number) {
  return useQuery({
    queryKey: ['scroll-events', days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      const { data, error } = await supabase
        .from('scroll_events')
        .select('*')
        .gte('created_at', since)
        .limit(5000);
      if (error) throw error;
      return data || [];
    },
  });
}

function useFeedback(days: number) {
  return useQuery({
    queryKey: ['feedback', days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });
}

function usePolls() {
  return useQuery({
    queryKey: ['polls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

function usePollResponses(pollId: string | null) {
  return useQuery({
    queryKey: ['poll-responses', pollId],
    queryFn: async () => {
      if (!pollId) return [];
      const { data, error } = await supabase
        .from('poll_responses')
        .select('*')
        .eq('poll_id', pollId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!pollId,
  });
}

// ---- Heatmap Canvas ----

function HeatmapCanvas({ clicks, width = 400, height = 700 }: { clicks: any[]; width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || clicks.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Normalize clicks to canvas dimensions
    const maxVW = Math.max(...clicks.map(c => Number(c.viewport_width)), 1);
    const maxVH = Math.max(...clicks.map(c => Number(c.viewport_height)), 1);

    // Create heatmap
    for (const click of clicks) {
      const x = (Number(click.x) / maxVW) * width;
      const y = (Number(click.y) / maxVH) * height;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
      gradient.addColorStop(0, 'rgba(255, 0, 0, 0.15)');
      gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.08)');
      gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - 20, y - 20, 40, 40);
    }

    // Draw dots
    for (const click of clicks) {
      const x = (Number(click.x) / maxVW) * width;
      const y = (Number(click.y) / maxVH) * height;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
      ctx.fill();
    }
  }, [clicks, width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      className="rounded-lg border border-border w-full" 
      style={{ maxWidth: width, height }}
    />
  );
}

// ---- Main Page ----

export default function AdminHotjarPage() {
  const queryClient = useQueryClient();
  const [heatmapPath, setHeatmapPath] = useState('/');
  const [days, setDays] = useState(7);
  const [newPollDialog, setNewPollDialog] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);

  const { data: clickEvents = [] } = useClickEvents(heatmapPath, days);
  const { data: scrollEvents = [] } = useScrollEvents(days);
  const { data: feedback = [] } = useFeedback(days);
  const { data: polls = [] } = usePolls();
  const { data: pollResponses = [] } = usePollResponses(selectedPollId);

  // Scroll depth by page
  const scrollByPage = useMemo(() => {
    const pages: Record<string, { total: number; count: number }> = {};
    for (const e of scrollEvents) {
      if (!pages[e.path]) pages[e.path] = { total: 0, count: 0 };
      pages[e.path].total += e.max_depth;
      pages[e.path].count++;
    }
    return Object.entries(pages)
      .map(([path, { total, count }]) => ({ path, avgDepth: Math.round(total / count), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [scrollEvents]);

  // Feedback stats
  const feedbackStats = useMemo(() => {
    if (feedback.length === 0) return { avg: 0, total: 0, distribution: [0, 0, 0, 0, 0] };
    const dist = [0, 0, 0, 0, 0];
    let sum = 0;
    for (const f of feedback) {
      dist[f.rating - 1]++;
      sum += f.rating;
    }
    return { avg: sum / feedback.length, total: feedback.length, distribution: dist };
  }, [feedback]);

  const createPoll = useMutation({
    mutationFn: async () => {
      const opts = newOptions.filter(o => o.trim());
      if (!newQuestion.trim() || opts.length < 2) throw new Error('Preencha a pergunta e pelo menos 2 opções');
      const { error } = await supabase.from('polls').insert({
        question: newQuestion.trim(),
        options: opts,
        active: true,
        show_on_pages: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      setNewPollDialog(false);
      setNewQuestion('');
      setNewOptions(['', '']);
      toast.success('Enquete criada!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePoll = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('polls').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['polls'] }),
  });

  const deletePoll = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('polls').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      toast.success('Enquete excluída');
    },
  });

  const emojis = ['😡', '😕', '😐', '😊', '🤩'];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Comportamento</h1>
            <p className="text-muted-foreground">Heatmaps, feedback e enquetes</p>
          </div>
          <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <TabsList>
              <TabsTrigger value="1">Hoje</TabsTrigger>
              <TabsTrigger value="7">7 dias</TabsTrigger>
              <TabsTrigger value="30">30 dias</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs defaultValue="heatmap">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="heatmap" className="gap-2">
              <MousePointer className="h-4 w-4" /> Heatmap
            </TabsTrigger>
            <TabsTrigger value="scroll" className="gap-2">
              <TrendingDown className="h-4 w-4" /> Scroll
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2">
              <MessageSquare className="h-4 w-4" /> Feedback
            </TabsTrigger>
            <TabsTrigger value="polls" className="gap-2">
              <BarChart2 className="h-4 w-4" /> Enquetes
            </TabsTrigger>
          </TabsList>

          {/* Heatmap Tab */}
          <TabsContent value="heatmap" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MousePointer className="h-5 w-5" />
                    Mapa de Cliques
                  </span>
                  <Badge variant="outline">{clickEvents.length} cliques</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  {['/', '/produtos', '/checkout'].map((p) => (
                    <Button
                      key={p}
                      variant={heatmapPath === p ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setHeatmapPath(p)}
                    >
                      {p === '/' ? 'Home' : p.slice(1)}
                    </Button>
                  ))}
                  <Input
                    value={heatmapPath}
                    onChange={(e) => setHeatmapPath(e.target.value)}
                    placeholder="/caminho"
                    className="w-40"
                  />
                </div>
                <div className="flex justify-center">
                  {clickEvents.length > 0 ? (
                    <HeatmapCanvas clicks={clickEvents} width={400} height={700} />
                  ) : (
                    <p className="text-center py-16 text-muted-foreground">Nenhum clique registrado nesta página</p>
                  )}
                </div>

                {/* Top clicked elements */}
                {clickEvents.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-sm mb-2">Elementos mais clicados</h4>
                    <div className="space-y-1">
                      {(() => {
                        const counts: Record<string, number> = {};
                        for (const c of clickEvents) {
                          const key = `<${c.element_tag}> ${(c.element_text || '').slice(0, 30)}`;
                          counts[key] = (counts[key] || 0) + 1;
                        }
                        return Object.entries(counts)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 8)
                          .map(([el, count]) => (
                            <div key={el} className="flex justify-between text-sm py-1">
                              <span className="text-muted-foreground truncate max-w-[300px]">{el}</span>
                              <Badge variant="outline">{count}</Badge>
                            </div>
                          ));
                      })()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scroll Depth Tab */}
          <TabsContent value="scroll" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Profundidade de Scroll por Página
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scrollByPage.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Nenhum dado ainda</p>
                ) : (
                  <div className="space-y-3">
                    {scrollByPage.map(({ path, avgDepth, count }) => (
                      <div key={path} className="flex items-center gap-3">
                        <span className="text-sm font-medium truncate flex-1 max-w-[200px]">{path}</span>
                        <div className="w-32 h-3 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${avgDepth}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold w-12 text-right">{avgDepth}%</span>
                        <Badge variant="outline" className="text-xs">{count} sessões</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-5 text-center">
                  <p className="text-3xl font-bold text-foreground">{feedbackStats.avg.toFixed(1)}</p>
                  <div className="flex justify-center mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${s <= Math.round(feedbackStats.avg) ? 'text-amber-400 fill-amber-400' : 'text-muted'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Nota média</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 text-center">
                  <p className="text-3xl font-bold text-foreground">{feedbackStats.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total de respostas</p>
                </CardContent>
              </Card>
              {feedbackStats.distribution.map((count, i) => null)}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {feedbackStats.distribution.map((count, i) => {
                    const pct = feedbackStats.total > 0 ? Math.round((count / feedbackStats.total) * 100) : 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xl w-8">{emojis[i]}</span>
                        <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm w-16 text-right">{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comentários Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {feedback.filter(f => f.comment).length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">Nenhum comentário ainda</p>
                ) : (
                  <div className="space-y-3">
                    {feedback.filter(f => f.comment).slice(0, 20).map((f) => (
                      <div key={f.id} className="border-b border-border/50 pb-3 last:border-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{emojis[f.rating - 1]}</span>
                          <span className="text-xs text-muted-foreground">{f.path}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(new Date(f.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{f.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Polls Tab */}
          <TabsContent value="polls" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Enquetes</h3>
              <Button onClick={() => setNewPollDialog(true)} className="gap-2" size="sm">
                <Plus className="h-4 w-4" /> Nova Enquete
              </Button>
            </div>

            {polls.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhuma enquete criada ainda
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {polls.map((poll: any) => {
                  const opts = Array.isArray(poll.options) ? poll.options as string[] : [];
                  return (
                    <Card key={poll.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>{poll.question}</span>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={poll.active}
                              onCheckedChange={(active) => togglePoll.mutate({ id: poll.id, active })}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => deletePoll.mutate(poll.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2 flex-wrap mb-3">
                          {opts.map((o: string, i: number) => (
                            <Badge key={i} variant="secondary">{o}</Badge>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPollId(poll.id === selectedPollId ? null : poll.id)}
                        >
                          {poll.id === selectedPollId ? 'Ocultar resultados' : 'Ver resultados'}
                        </Button>

                        {poll.id === selectedPollId && pollResponses.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {opts.map((o: string, i: number) => {
                              const count = pollResponses.filter((r: any) => r.option_index === i).length;
                              const pct = pollResponses.length > 0 ? Math.round((count / pollResponses.length) * 100) : 0;
                              return (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="text-sm flex-1">{o}</span>
                                  <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-xs text-muted-foreground w-16 text-right">{count} ({pct}%)</span>
                                </div>
                              );
                            })}
                            <p className="text-xs text-muted-foreground">{pollResponses.length} votos</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* New Poll Dialog */}
      <Dialog open={newPollDialog} onOpenChange={setNewPollDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Enquete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pergunta</Label>
              <Input
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Qual sua pergunta?"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Opções</Label>
              <div className="space-y-2 mt-1">
                {newOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const updated = [...newOptions];
                        updated[i] = e.target.value;
                        setNewOptions(updated);
                      }}
                      placeholder={`Opção ${i + 1}`}
                    />
                    {newOptions.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setNewOptions(newOptions.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {newOptions.length < 4 && (
                  <Button variant="outline" size="sm" onClick={() => setNewOptions([...newOptions, ''])}>
                    + Adicionar opção
                  </Button>
                )}
              </div>
            </div>
            <Button className="w-full" onClick={() => createPoll.mutate()} disabled={createPoll.isPending}>
              Criar Enquete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
