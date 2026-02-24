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
import { usePageViewsByRange, PageView } from '@/hooks/usePageViews';
import {
  MousePointer, MessageSquare, BarChart2, TrendingDown, Plus, Trash2, Star,
  Clock, ArrowRight, Eye, Layers, Route,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
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

function useSectionViews(days: number) {
  return useQuery({
    queryKey: ['section-views', days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      const { data, error } = await supabase
        .from('section_views')
        .select('*')
        .gte('created_at', since)
        .limit(5000);
      if (error) throw error;
      return (data || []) as { id: string; session_id: string; path: string; section_id: string; time_visible_ms: number; created_at: string }[];
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
      const { data, error } = await supabase.from('polls').select('*').order('created_at', { ascending: false });
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
      const { data, error } = await supabase.from('poll_responses').select('*').eq('poll_id', pollId);
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
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    const maxVW = Math.max(...clicks.map(c => Number(c.viewport_width)), 1);
    const maxVH = Math.max(...clicks.map(c => Number(c.viewport_height)), 1);

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

function formatMs(ms: number) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
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

  const now = new Date();
  const start = startOfDay(subDays(now, days - 1));
  const end = endOfDay(now);

  const { data: clickEvents = [] } = useClickEvents(heatmapPath, days);
  const { data: scrollEvents = [] } = useScrollEvents(days);
  const { data: sectionViews = [] } = useSectionViews(days);
  const { data: feedback = [] } = useFeedback(days);
  const { data: polls = [] } = usePolls();
  const { data: pollResponses = [] } = usePollResponses(selectedPollId);
  const { data: pageViews = [] } = usePageViewsByRange(start.toISOString(), end.toISOString());

  // ---- TIME ON PAGE per page ----
  const timeOnPage = useMemo(() => {
    const sessions = new Map<string, PageView[]>();
    for (const v of pageViews) {
      const arr = sessions.get(v.session_id) || [];
      arr.push(v);
      sessions.set(v.session_id, arr);
    }

    const pageData: Record<string, { totalSec: number; count: number }> = {};
    for (const [, views] of sessions) {
      const sorted = views.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      for (let i = 0; i < sorted.length; i++) {
        const path = sorted[i].path;
        let durationSec: number;
        if (i < sorted.length - 1) {
          durationSec = (new Date(sorted[i + 1].created_at).getTime() - new Date(sorted[i].created_at).getTime()) / 1000;
          if (durationSec > 1800) durationSec = 30; // cap at 30min, assume 30s
        } else {
          durationSec = 30; // last page default 30s
        }
        if (!pageData[path]) pageData[path] = { totalSec: 0, count: 0 };
        pageData[path].totalSec += durationSec;
        pageData[path].count++;
      }
    }
    return Object.entries(pageData)
      .map(([path, { totalSec, count }]) => ({ path, avgSec: totalSec / count, views: count }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);
  }, [pageViews]);

  // ---- USER FLOW (from each page, where they go next) ----
  const userFlow = useMemo(() => {
    const sessions = new Map<string, PageView[]>();
    for (const v of pageViews) {
      const arr = sessions.get(v.session_id) || [];
      arr.push(v);
      sessions.set(v.session_id, arr);
    }

    const transitions: Record<string, Record<string, number>> = {};
    for (const [, views] of sessions) {
      const sorted = views.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      for (let i = 0; i < sorted.length - 1; i++) {
        const from = sorted[i].path;
        const to = sorted[i + 1].path;
        if (!transitions[from]) transitions[from] = {};
        transitions[from][to] = (transitions[from][to] || 0) + 1;
      }
    }

    // Get top flows from homepage
    const result: { from: string; to: string; count: number }[] = [];
    for (const [from, tos] of Object.entries(transitions)) {
      for (const [to, count] of Object.entries(tos)) {
        result.push({ from, to, count });
      }
    }
    return result.sort((a, b) => b.count - a.count).slice(0, 20);
  }, [pageViews]);

  // ---- HOME-specific flow ----
  const homeFlow = useMemo(() => {
    return userFlow.filter(f => f.from === '/').slice(0, 10);
  }, [userFlow]);

  // ---- SECTION VISIBILITY ----
  const sectionStats = useMemo(() => {
    const sections: Record<string, { totalMs: number; count: number }> = {};
    for (const sv of sectionViews) {
      const key = `${sv.path}|${sv.section_id}`;
      if (!sections[key]) sections[key] = { totalMs: 0, count: 0 };
      sections[key].totalMs += sv.time_visible_ms;
      sections[key].count++;
    }
    return Object.entries(sections)
      .map(([key, { totalMs, count }]) => {
        const [path, sectionId] = key.split('|');
        return { path, sectionId, avgMs: totalMs / count, views: count };
      })
      .sort((a, b) => b.views - a.views);
  }, [sectionViews]);

  const homeSections = useMemo(() =>
    sectionStats.filter(s => s.path === '/').sort((a, b) => b.avgMs - a.avgMs),
    [sectionStats]
  );

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
    for (const f of feedback) { dist[f.rating - 1]++; sum += f.rating; }
    return { avg: sum / feedback.length, total: feedback.length, distribution: dist };
  }, [feedback]);

  const createPoll = useMutation({
    mutationFn: async () => {
      const opts = newOptions.filter(o => o.trim());
      if (!newQuestion.trim() || opts.length < 2) throw new Error('Preencha a pergunta e pelo menos 2 opções');
      const { error } = await supabase.from('polls').insert({ question: newQuestion.trim(), options: opts, active: true, show_on_pages: [] });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      setNewPollDialog(false); setNewQuestion(''); setNewOptions(['', '']);
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['polls'] }); toast.success('Enquete excluída'); },
  });

  const emojis = ['😡', '😕', '😐', '😊', '🤩'];

  // Section name mapping for readability
  const sectionNames: Record<string, string> = {
    'hero-banners': 'Banners Principais',
    'categorias': 'Categorias',
    'mantas': 'Mantas',
    'promocoes': 'Promoções',
    'ultimos-produtos': 'Últimos Produtos',
    'selas': 'Selas e Acessórios',
    'calcas-jeans': 'Calças Jeans',
    'cta-banner': 'Banner CTA',
    'estatisticas': 'Estatísticas',
    'depoimentos': 'Depoimentos',
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Comportamento</h1>
            <p className="text-muted-foreground">Tempo por página, fluxo de navegação, heatmaps e mais</p>
          </div>
          <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <TabsList>
              <TabsTrigger value="1">Hoje</TabsTrigger>
              <TabsTrigger value="7">7 dias</TabsTrigger>
              <TabsTrigger value="30">30 dias</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs defaultValue="time">
          <TabsList className="w-full justify-start flex-wrap">
            <TabsTrigger value="time" className="gap-2"><Clock className="h-4 w-4" /> Tempo por Página</TabsTrigger>
            <TabsTrigger value="flow" className="gap-2"><Route className="h-4 w-4" /> Fluxo de Navegação</TabsTrigger>
            <TabsTrigger value="sections" className="gap-2"><Layers className="h-4 w-4" /> Seções da Home</TabsTrigger>
            <TabsTrigger value="heatmap" className="gap-2"><MousePointer className="h-4 w-4" /> Heatmap</TabsTrigger>
            <TabsTrigger value="scroll" className="gap-2"><TrendingDown className="h-4 w-4" /> Scroll</TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2"><MessageSquare className="h-4 w-4" /> Feedback</TabsTrigger>
            <TabsTrigger value="polls" className="gap-2"><BarChart2 className="h-4 w-4" /> Enquetes</TabsTrigger>
          </TabsList>

          {/* TIME ON PAGE Tab */}
          <TabsContent value="time" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Tempo Médio por Página
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timeOnPage.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Nenhum dado ainda</p>
                ) : (
                  <>
                    <div className="h-72 mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={timeOnPage.slice(0, 10)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                          <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v)}s`} />
                          <YAxis dataKey="path" type="category" width={120} tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                            formatter={(value: number) => [formatDuration(value), 'Tempo médio']}
                          />
                          <Bar dataKey="avgSec" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2">
                      {timeOnPage.map(({ path, avgSec, views }) => (
                        <div key={path} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                          <span className="text-sm font-medium truncate flex-1 max-w-[250px]">{path}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(avgSec)}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Eye className="h-3 w-3" />
                              {views}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* USER FLOW Tab */}
          <TabsContent value="flow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  Da Home, para onde vão?
                </CardTitle>
              </CardHeader>
              <CardContent>
                {homeFlow.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Nenhum dado de fluxo ainda</p>
                ) : (
                  <div className="space-y-2">
                    {homeFlow.map(({ to, count }, i) => {
                      const total = homeFlow.reduce((s, f) => s + f.count, 0);
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={to} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-5 tabular-nums">{i + 1}.</span>
                          <span className="text-sm font-medium">/</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium truncate flex-1 max-w-[200px]">{to}</span>
                          <div className="w-24 h-3 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                          <Badge variant="outline">{count} ({pct}%)</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  Fluxo Completo (Top Transições)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userFlow.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Nenhum dado</p>
                ) : (
                  <div className="space-y-2">
                    {userFlow.map(({ from, to, count }, i) => (
                      <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
                        <span className="text-xs text-muted-foreground w-5 tabular-nums">{i + 1}.</span>
                        <span className="text-sm truncate max-w-[120px]">{from}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate max-w-[120px]">{to}</span>
                        <Badge variant="outline" className="ml-auto">{count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECTIONS Tab */}
          <TabsContent value="sections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Tempo de Visualização por Seção (Home)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {homeSections.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">Nenhum dado de seção ainda</p>
                    <p className="text-xs text-muted-foreground">Os dados aparecerão conforme os visitantes navegam pela home</p>
                  </div>
                ) : (
                  <>
                    <div className="h-64 mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={homeSections.map(s => ({ ...s, name: sectionNames[s.sectionId] || s.sectionId, avgSec: s.avgMs / 1000 }))} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                          <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(0)}s`} />
                          <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                            formatter={(value: number) => [formatDuration(value), 'Tempo médio']}
                          />
                          <Bar dataKey="avgSec" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                      {homeSections.map(({ sectionId, avgMs, views }) => (
                        <div key={sectionId} className="flex items-center gap-3">
                          <span className="text-sm font-medium flex-1">{sectionNames[sectionId] || sectionId}</span>
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {formatMs(avgMs)}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Eye className="h-3 w-3" />
                            {views} sessões
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* All pages section data */}
            {sectionStats.filter(s => s.path !== '/').length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Seções em Outras Páginas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sectionStats.filter(s => s.path !== '/').slice(0, 15).map(({ path, sectionId, avgMs, views }) => (
                      <div key={`${path}-${sectionId}`} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
                        <span className="text-xs text-muted-foreground">{path}</span>
                        <span className="text-sm font-medium flex-1 truncate">{sectionNames[sectionId] || sectionId}</span>
                        <Badge variant="secondary" className="text-xs">{formatMs(avgMs)}</Badge>
                        <Badge variant="outline" className="text-xs">{views}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Heatmap Tab */}
          <TabsContent value="heatmap" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><MousePointer className="h-5 w-5" /> Mapa de Cliques</span>
                  <Badge variant="outline">{clickEvents.length} cliques</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4 flex-wrap">
                  {['/', '/produtos', '/checkout'].map((p) => (
                    <Button key={p} variant={heatmapPath === p ? 'default' : 'outline'} size="sm" onClick={() => setHeatmapPath(p)}>
                      {p === '/' ? 'Home' : p.slice(1)}
                    </Button>
                  ))}
                  <Input value={heatmapPath} onChange={(e) => setHeatmapPath(e.target.value)} placeholder="/caminho" className="w-40" />
                </div>
                <div className="flex justify-center">
                  {clickEvents.length > 0 ? (
                    <HeatmapCanvas clicks={clickEvents} width={400} height={700} />
                  ) : (
                    <p className="text-center py-16 text-muted-foreground">Nenhum clique registrado nesta página</p>
                  )}
                </div>
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
                        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([el, count]) => (
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
                <CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5" /> Profundidade de Scroll por Página</CardTitle>
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
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${avgDepth}%` }} />
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
                      <Star key={s} className={`h-4 w-4 ${s <= Math.round(feedbackStats.avg) ? 'text-amber-400 fill-amber-400' : 'text-muted'}`} />
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
            </div>

            <Card>
              <CardHeader><CardTitle>Distribuição</CardTitle></CardHeader>
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
              <CardHeader><CardTitle>Comentários Recentes</CardTitle></CardHeader>
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
                          <span className="text-xs text-muted-foreground ml-auto">{format(new Date(f.created_at), 'dd/MM HH:mm', { locale: ptBR })}</span>
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
              <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma enquete criada ainda</CardContent></Card>
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
                            <Switch checked={poll.active} onCheckedChange={(active) => togglePoll.mutate({ id: poll.id, active })} />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePoll.mutate(poll.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2 flex-wrap mb-3">
                          {opts.map((o: string, i: number) => <Badge key={i} variant="secondary">{o}</Badge>)}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSelectedPollId(poll.id === selectedPollId ? null : poll.id)}>
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
          <DialogHeader><DialogTitle>Nova Enquete</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pergunta</Label>
              <Input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="Qual sua pergunta?" className="mt-1" />
            </div>
            <div>
              <Label>Opções</Label>
              <div className="space-y-2 mt-1">
                {newOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={opt} onChange={(e) => { const u = [...newOptions]; u[i] = e.target.value; setNewOptions(u); }} placeholder={`Opção ${i + 1}`} />
                    {newOptions.length > 2 && (
                      <Button variant="ghost" size="icon" onClick={() => setNewOptions(newOptions.filter((_, j) => j !== i))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {newOptions.length < 4 && (
                  <Button variant="outline" size="sm" onClick={() => setNewOptions([...newOptions, ''])}>+ Adicionar opção</Button>
                )}
              </div>
            </div>
            <Button className="w-full" onClick={() => createPoll.mutate()} disabled={createPoll.isPending}>Criar Enquete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
