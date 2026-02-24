import { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePageViewsByRange, useRealtimeVisitors, PageView } from '@/hooks/usePageViews';
import {
  Users, Eye, Monitor, Globe,
  TrendingUp, Activity, BarChart3,
  ArrowUpRight, ArrowDownRight, CalendarDays, MousePointerClick,
  FileText, Layers, Download, Link2, LogIn, LogOut, Clock,
  Zap, MapPin,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, AreaChart, Area,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, differenceInDays, eachDayOfInterval, eachHourOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { AnalyticsGlobe } from '@/components/analytics/AnalyticsGlobe';

const SOURCE_COLORS: Record<string, string> = {
  'Direto': '#6366f1', 'Google': '#ef4444', 'Instagram': '#ec4899',
  'Facebook': '#3b82f6', 'TikTok': '#000000', 'YouTube': '#dc2626',
  'WhatsApp': '#22c55e', 'Twitter/X': '#1d9bf0', 'Telegram': '#0088cc',
  'Kwai': '#ff6600', 'Bing': '#00809d', 'Pinterest': '#e60023', 'Outro Site': '#94a3b8',
};
const PIE_COLORS = ['#6366f1', '#ec4899', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4'];

type RangePreset = 'today' | '7d' | '30d' | '90d';

function getColor(source: string) { return SOURCE_COLORS[source] || '#94a3b8'; }

function getRangeFromPreset(preset: RangePreset) {
  const now = new Date();
  const end = endOfDay(now);
  switch (preset) {
    case 'today': return { start: startOfDay(now), end };
    case '7d': return { start: startOfDay(subDays(now, 6)), end };
    case '30d': return { start: startOfDay(subDays(now, 29)), end };
    case '90d': return { start: startOfDay(subDays(now, 89)), end };
  }
}

function formatCompact(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function computeMetrics(views: PageView[]) {
  const sessions = new Map<string, PageView[]>();
  for (const v of views) {
    const arr = sessions.get(v.session_id) || [];
    arr.push(v);
    sessions.set(v.session_id, arr);
  }
  const totalSessions = sessions.size;
  const totalPageViews = views.length;
  const pagesPerSession = totalSessions > 0 ? totalPageViews / totalSessions : 0;
  let bounces = 0;
  let totalDurationMs = 0;
  let durableSessions = 0;
  for (const [, arr] of sessions) {
    if (arr.length === 1) bounces++;
    if (arr.length >= 2) {
      const sorted = arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const dur = new Date(sorted[sorted.length - 1].created_at).getTime() - new Date(sorted[0].created_at).getTime();
      totalDurationMs += dur;
      durableSessions++;
    }
  }
  const bounceRate = totalSessions > 0 ? (bounces / totalSessions) * 100 : 0;
  const avgDurationSec = durableSessions > 0 ? totalDurationMs / durableSessions / 1000 : 0;
  return { totalSessions, totalPageViews, pagesPerSession, bounceRate, avgDurationSec };
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

export default function AdminAnalyticsPage() {
  const [preset, setPreset] = useState<RangePreset>('today');
  const { start, end } = getRangeFromPreset(preset);
  const rangeDays = differenceInDays(end, start) + 1;
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = startOfDay(subDays(prevEnd, rangeDays - 1));

  const { data: currentViews = [], isLoading } = usePageViewsByRange(start.toISOString(), end.toISOString());
  const { data: previousViews = [] } = usePageViewsByRange(prevStart.toISOString(), prevEnd.toISOString());
  const { data: onlineVisitors = [] } = useRealtimeVisitors();
  const { data: products = [] } = useQuery({
    queryKey: ['all-products-names'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name').eq('active', true);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Build a map of product slug/id to product name for display
  const productNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of products) {
      // Match paths like /produto/product-id or /produto/slug
      map[p.id] = p.name;
      if (p.name) {
        const slug = p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();
        map[slug] = p.name;
      }
    }
    return map;
  }, [products]);

  const getPageLabel = (path: string): string => {
    // Product pages: /produto/xxx
    const productMatch = path.match(/^\/produto\/(.+)$/);
    if (productMatch) {
      const key = productMatch[1];
      const name = productNameMap[key];
      return name ? `🛒 ${name}` : path;
    }
    // Category pages
    const catMatch = path.match(/^\/categoria\/(.+)$/);
    if (catMatch) return `📁 ${catMatch[1].replace(/-/g, ' ')}`;
    // Known pages
    const labels: Record<string, string> = {
      '/': '🏠 Página Inicial',
      '/produtos': '🛍️ Todos os Produtos',
      '/checkout': '💳 Checkout',
      '/sobre': 'ℹ️ Sobre',
      '/contato': '📞 Contato',
      '/faq': '❓ FAQ',
      '/rastreio': '📦 Rastreio',
    };
    return labels[path] || path;
  };

  const current = useMemo(() => computeMetrics(currentViews), [currentViews]);
  const previous = useMemo(() => computeMetrics(previousViews), [previousViews]);

  const sessionChange = previous.totalSessions > 0 ? ((current.totalSessions - previous.totalSessions) / previous.totalSessions) * 100 : 0;
  const pvChange = previous.totalPageViews > 0 ? ((current.totalPageViews - previous.totalPageViews) / previous.totalPageViews) * 100 : 0;
  const bounceChange = previous.bounceRate > 0 ? current.bounceRate - previous.bounceRate : 0;
  const ppsChange = previous.pagesPerSession > 0 ? ((current.pagesPerSession - previous.pagesPerSession) / previous.pagesPerSession) * 100 : 0;
  const durationChange = previous.avgDurationSec > 0 ? ((current.avgDurationSec - previous.avgDurationSec) / previous.avgDurationSec) * 100 : 0;

  // Source breakdown
  const sourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of currentViews) counts[v.source_label] = (counts[v.source_label] || 0) + 1;
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [currentViews]);

  // Device breakdown
  const deviceData = useMemo(() => {
    const counts: Record<string, number> = {};
    const sessions = new Map<string, string>();
    for (const v of currentViews) {
      if (!sessions.has(v.session_id)) sessions.set(v.session_id, v.device_type || 'desktop');
    }
    for (const [, device] of sessions) counts[device] = (counts[device] || 0) + 1;
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [currentViews]);

  // Timeline
  const timelineData = useMemo(() => {
    if (preset === 'today') {
      const hours = eachHourOfInterval({ start, end: new Date() });
      return hours.map(h => {
        const hEnd = new Date(h.getTime() + 60 * 60 * 1000);
        const filtered = currentViews.filter(v => { const t = new Date(v.created_at); return t >= h && t < hEnd; });
        return { label: format(h, 'HH:mm'), visitas: filtered.length, sessoes: new Set(filtered.map(v => v.session_id)).size };
      });
    } else {
      const days = eachDayOfInterval({ start, end });
      return days.map(d => {
        const dEnd = endOfDay(d);
        const filtered = currentViews.filter(v => { const t = new Date(v.created_at); return t >= d && t <= dEnd; });
        return { label: format(d, 'dd/MM', { locale: ptBR }), visitas: filtered.length, sessoes: new Set(filtered.map(v => v.session_id)).size };
      });
    }
  }, [currentViews, preset, start, end]);

  // Top pages
  const topPages = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of currentViews) counts[v.path] = (counts[v.path] || 0) + 1;
    return Object.entries(counts).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [currentViews]);

  // Browser breakdown
  const browserData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of currentViews) { const b = v.browser || 'Desconhecido'; counts[b] = (counts[b] || 0) + 1; }
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [currentViews]);

  // Online by source
  const onlineBySource = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of onlineVisitors) counts[v.source_label] = (counts[v.source_label] || 0) + 1;
    return Object.entries(counts).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);
  }, [onlineVisitors]);

  // UTM Campaign breakdown
  const campaignData = useMemo(() => {
    const counts: Record<string, { views: number; sessions: Set<string> }> = {};
    for (const v of currentViews) {
      const campaign = v.utm_campaign || v.utm_source || null;
      if (!campaign) continue;
      if (!counts[campaign]) counts[campaign] = { views: 0, sessions: new Set() };
      counts[campaign].views++;
      counts[campaign].sessions.add(v.session_id);
    }
    return Object.entries(counts).map(([name, { views, sessions }]) => ({ name, views, sessions: sessions.size })).sort((a, b) => b.views - a.views).slice(0, 10);
  }, [currentViews]);

  // Detailed UTM
  const utmDetailData = useMemo(() => {
    const map: Record<string, { source: string; medium: string; campaign: string; views: number; sessions: Set<string> }> = {};
    for (const v of currentViews) {
      if (!v.utm_source && !v.utm_medium && !v.utm_campaign) continue;
      const key = `${v.utm_source || '-'}|${v.utm_medium || '-'}|${v.utm_campaign || '-'}`;
      if (!map[key]) map[key] = { source: v.utm_source || '-', medium: v.utm_medium || '-', campaign: v.utm_campaign || '-', views: 0, sessions: new Set() };
      map[key].views++;
      map[key].sessions.add(v.session_id);
    }
    return Object.values(map).map(d => ({ ...d, sessionsCount: d.sessions.size })).sort((a, b) => b.views - a.views).slice(0, 20);
  }, [currentViews]);

  // Conversion funnel
  const funnelData = useMemo(() => {
    const sessions = new Map<string, Set<string>>();
    for (const v of currentViews) {
      if (!sessions.has(v.session_id)) sessions.set(v.session_id, new Set());
      sessions.get(v.session_id)!.add(v.path);
    }
    let home = 0, product = 0, checkout = 0;
    for (const [, paths] of sessions) {
      if (paths.has('/')) home++;
      for (const p of paths) { if (p.startsWith('/produto/')) { product++; break; } }
      if (paths.has('/checkout')) checkout++;
    }
    return [{ etapa: 'Home', valor: home }, { etapa: 'Produto', valor: product }, { etapa: 'Checkout', valor: checkout }];
  }, [currentViews]);

  // *** NEW: Landing Pages ***
  const landingPages = useMemo(() => {
    const sessionFirst = new Map<string, { path: string; time: number }>();
    for (const v of currentViews) {
      const t = new Date(v.created_at).getTime();
      const existing = sessionFirst.get(v.session_id);
      if (!existing || t < existing.time) sessionFirst.set(v.session_id, { path: v.path, time: t });
    }
    const counts: Record<string, number> = {};
    for (const [, { path }] of sessionFirst) counts[path] = (counts[path] || 0) + 1;
    return Object.entries(counts).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [currentViews]);

  // *** NEW: Exit Pages ***
  const exitPages = useMemo(() => {
    const sessionLast = new Map<string, { path: string; time: number }>();
    for (const v of currentViews) {
      const t = new Date(v.created_at).getTime();
      const existing = sessionLast.get(v.session_id);
      if (!existing || t > existing.time) sessionLast.set(v.session_id, { path: v.path, time: t });
    }
    const counts: Record<string, number> = {};
    for (const [, { path }] of sessionLast) counts[path] = (counts[path] || 0) + 1;
    return Object.entries(counts).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [currentViews]);

  // *** NEW: Hourly Heatmap (day of week x hour) ***
  const hourlyHeatmap = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const v of currentViews) {
      const d = new Date(v.created_at);
      grid[d.getDay()][d.getHours()]++;
    }
    return grid;
  }, [currentViews]);

  const heatmapMax = useMemo(() => Math.max(1, ...hourlyHeatmap.flat()), [hourlyHeatmap]);

  // *** Country data for globe ***
  const countryData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of currentViews) {
      const c = v.country || 'Brasil';
      counts[c] = (counts[c] || 0) + 1;
    }
    return Object.entries(counts).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count);
  }, [currentViews]);

  // *** City/Region data for map ***
  const cityData = useMemo(() => {
    const counts: Record<string, { city: string; region: string; country: string; count: number }> = {};
    for (const v of currentViews) {
      const city = v.city;
      const region = v.region || '';
      const country = v.country || 'Brasil';
      if (!city) continue;
      const key = `${city}|${region}|${country}`;
      if (!counts[key]) counts[key] = { city, region, country, count: 0 };
      counts[key].count++;
    }
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [currentViews]);

  // *** NEW: Referrer detail breakdown ***
  const referrerData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of currentViews) {
      if (!v.referrer) continue;
      try {
        const host = new URL(v.referrer).hostname.replace('www.', '');
        if (host === window.location.hostname) continue;
        counts[host] = (counts[host] || 0) + 1;
      } catch { }
    }
    return Object.entries(counts).map(([domain, count]) => ({ domain, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [currentViews]);

  // *** NEW: Engagement Score ***
  const engagementScore = useMemo(() => {
    // Score 0-100 based on: pages/session, bounce rate, duration
    const ppsScore = Math.min(current.pagesPerSession / 5, 1) * 40;
    const bounceScore = (1 - current.bounceRate / 100) * 30;
    const durScore = Math.min(current.avgDurationSec / 300, 1) * 30;
    return Math.round(ppsScore + bounceScore + durScore);
  }, [current]);

  // Export CSV
  const handleExportCSV = () => {
    if (currentViews.length === 0) return;
    const headers = ['Data', 'Session ID', 'Página', 'Referrer', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Fonte', 'Dispositivo', 'Navegador', 'País'];
    const rows = currentViews.map(v => [
      format(new Date(v.created_at), 'dd/MM/yyyy HH:mm:ss'),
      v.session_id, v.path, v.referrer || '', v.utm_source || '', v.utm_medium || '',
      v.utm_campaign || '', v.source_label, v.device_type, v.browser || '', v.country || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${preset}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ChangeIndicator = ({ value, inverted = false }: { value: number; inverted?: boolean }) => {
    const isPositive = inverted ? value < 0 : value > 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    if (Math.abs(value) < 0.1) return null;
    return (
      <span className={`inline-flex items-center text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
        <Icon className="h-3 w-3" />
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">
              {format(start, "dd 'de' MMM", { locale: ptBR })} — {format(end, "dd 'de' MMM, yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1" disabled={currentViews.length === 0}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <Tabs value={preset} onValueChange={(v) => setPreset(v as RangePreset)}>
              <TabsList>
                <TabsTrigger value="today">Hoje</TabsTrigger>
                <TabsTrigger value="7d">7 dias</TabsTrigger>
                <TabsTrigger value="30d">30 dias</TabsTrigger>
                <TabsTrigger value="90d">90 dias</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Real-time */}
        {onlineVisitors.length > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Activity className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-sm font-medium">
                  <span className="text-primary font-bold text-lg">{onlineVisitors.length}</span>
                  {' '}online agora
                </span>
                <div className="flex items-center gap-1 ml-auto flex-wrap">
                  {onlineBySource.slice(0, 4).map(({ source, count }) => (
                    <Badge key={source} variant="secondary" className="text-xs">
                      <span className="w-2 h-2 rounded-full mr-1 inline-block" style={{ backgroundColor: getColor(source) }} />
                      {source} ({count})
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards - 6 cards now */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Sessões</p>
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-bold text-foreground">{formatCompact(current.totalSessions)}</p>
                <ChangeIndicator value={sessionChange} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Page Views</p>
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-bold text-foreground">{formatCompact(current.totalPageViews)}</p>
                <ChangeIndicator value={pvChange} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Pág/Sessão</p>
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-bold text-foreground">{current.pagesPerSession.toFixed(1)}</p>
                <ChangeIndicator value={ppsChange} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Bounce</p>
                <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-bold text-foreground">{current.bounceRate.toFixed(1)}%</p>
                <ChangeIndicator value={bounceChange} inverted />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Duração Média</p>
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-bold text-foreground">{formatDuration(current.avgDurationSec)}</p>
                <ChangeIndicator value={durationChange} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Engajamento</p>
                <Zap className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold text-foreground">{engagementScore}<span className="text-sm text-muted-foreground">/100</span></p>
            </CardContent>
          </Card>
        </div>

        {/* Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {preset === 'today' ? 'Tráfego por Hora' : 'Tráfego Diário'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSessoes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="visitas" stroke="hsl(var(--primary))" fill="url(#colorVisitas)" strokeWidth={2} name="Page Views" />
                  <Area type="monotone" dataKey="sessoes" stroke="#22c55e" fill="url(#colorSessoes)" strokeWidth={2} name="Sessões" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 3D Globe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Mapa Mundial de Acessos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsGlobe countryData={countryData} cityData={cityData} />
            {/* City/Region breakdown */}
            {cityData.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Cidades com mais acessos</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {cityData.slice(0, 12).map(({ city, region, count }) => (
                    <div key={`${city}-${region}`} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                      <div className="truncate">
                        <span className="font-medium">{city}</span>
                        {region && <span className="text-xs text-muted-foreground ml-1">({region})</span>}
                      </div>
                      <Badge variant="outline" className="ml-1 flex-shrink-0">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {cityData.length === 0 && countryData.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {countryData.slice(0, 8).map(({ country, count }) => (
                  <div key={country} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                    <span className="font-medium truncate">{country}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hourly Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Mapa de Calor — Horário de Atividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="flex gap-0.5 mb-1 pl-10">
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="flex-1 text-center text-[9px] text-muted-foreground">{String(i).padStart(2, '0')}</div>
                  ))}
                </div>
                {dayNames.map((day, di) => (
                  <div key={day} className="flex gap-0.5 items-center mb-0.5">
                    <span className="w-9 text-xs text-muted-foreground text-right pr-1">{day}</span>
                    {hourlyHeatmap[di].map((val, hi) => {
                      const intensity = val / heatmapMax;
                      return (
                        <div
                          key={hi}
                          className="flex-1 h-6 rounded-sm transition-colors cursor-default"
                          style={{
                            backgroundColor: val === 0
                              ? 'hsl(var(--muted))'
                              : `rgba(99, 102, 241, ${Math.max(0.15, intensity)})`,
                          }}
                          title={`${day} ${String(hi).padStart(2, '0')}h: ${val} views`}
                        />
                      );
                    })}
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-3 justify-end">
                  <span className="text-xs text-muted-foreground">Menos</span>
                  {[0.1, 0.3, 0.5, 0.7, 1].map((op) => (
                    <div key={op} className="w-4 h-4 rounded-sm" style={{ backgroundColor: `rgba(99, 102, 241, ${op})` }} />
                  ))}
                  <span className="text-xs text-muted-foreground">Mais</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 h-40 justify-center">
              {funnelData.map((step, i) => {
                const maxVal = Math.max(...funnelData.map(s => s.valor), 1);
                const height = (step.valor / maxVal) * 100;
                const convRate = i > 0 && funnelData[i - 1].valor > 0 ? ((step.valor / funnelData[i - 1].valor) * 100).toFixed(1) : null;
                return (
                  <div key={step.etapa} className="flex flex-col items-center gap-2 flex-1 max-w-[200px]">
                    {convRate && <span className="text-xs text-muted-foreground">{convRate}% →</span>}
                    <div className="w-full rounded-t-lg transition-all" style={{ height: `${Math.max(height, 8)}%`, background: `hsl(var(--primary) / ${1 - i * 0.25})` }} />
                    <div className="text-center">
                      <p className="text-sm font-medium">{step.etapa}</p>
                      <p className="text-lg font-bold">{step.valor}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Fontes de Tráfego</CardTitle>
            </CardHeader>
            <CardContent>
              {sourceData.length === 0 ? <p className="text-center py-8 text-muted-foreground">Nenhum dado</p> : (
                <div className="space-y-3">
                  {sourceData.map(({ name, value }) => {
                    const pct = current.totalPageViews > 0 ? Math.round((value / current.totalPageViews) * 100) : 0;
                    return (
                      <div key={name} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: getColor(name) }} />
                        <span className="text-sm font-medium flex-1 truncate">{name}</span>
                        <span className="text-sm text-muted-foreground tabular-nums">{value}</span>
                        <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: getColor(name) }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Device Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5" /> Dispositivos</CardTitle>
            </CardHeader>
            <CardContent>
              {deviceData.length === 0 ? <p className="text-center py-8 text-muted-foreground">Nenhum dado</p> : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={deviceData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {deviceData.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Landing & Exit Pages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LogIn className="h-5 w-5" /> Páginas de Entrada (Landing)</CardTitle>
            </CardHeader>
            <CardContent>
              {landingPages.length === 0 ? <p className="text-center py-8 text-muted-foreground">Nenhum dado</p> : (
                <div className="space-y-2">
                  {landingPages.map(({ path, count }, i) => (
                    <div key={path} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5 tabular-nums">{i + 1}.</span>
                        <span className="text-sm truncate max-w-[250px]">{path}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LogOut className="h-5 w-5" /> Páginas de Saída (Exit)</CardTitle>
            </CardHeader>
            <CardContent>
              {exitPages.length === 0 ? <p className="text-center py-8 text-muted-foreground">Nenhum dado</p> : (
                <div className="space-y-2">
                  {exitPages.map(({ path, count }, i) => (
                    <div key={path} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5 tabular-nums">{i + 1}.</span>
                        <span className="text-sm truncate max-w-[250px]">{path}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Referrer Details */}
        {referrerData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" /> Referrers (Domínios de Origem)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {referrerData.map(({ domain, count }, i) => (
                  <div key={domain} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-5 tabular-nums">{i + 1}.</span>
                      <span className="text-sm font-medium">{domain}</span>
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Google Ads Section */}
        <Card className="border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google Ads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const googleViews = currentViews.filter(v => (v as any).gclid || v.utm_source?.toLowerCase()?.includes('google'));
              if (googleViews.length === 0) return <p className="text-center py-6 text-muted-foreground text-sm">Nenhum acesso via Google Ads detectado. Dados aparecerão com links <code className="bg-muted px-1 rounded">gclid</code> ou <code className="bg-muted px-1 rounded">utm_source=google</code>.</p>;
              const sessions = new Set(googleViews.map(v => v.session_id)).size;
              const campaigns: Record<string, { views: number; sessions: Set<string>; terms: Set<string> }> = {};
              for (const v of googleViews) {
                const campaign = v.utm_campaign || '(não definida)';
                if (!campaigns[campaign]) campaigns[campaign] = { views: 0, sessions: new Set(), terms: new Set() };
                campaigns[campaign].views++;
                campaigns[campaign].sessions.add(v.session_id);
                const term = (v as any).utm_term;
                if (term) campaigns[campaign].terms.add(term);
              }
              const sorted = Object.entries(campaigns).sort((a, b) => b[1].views - a[1].views);
              const bounceSessions = new Set(googleViews.filter(v => currentViews.filter(cv => cv.session_id === v.session_id).length === 1).map(v => v.session_id)).size;
              const bounceRate = sessions > 0 ? ((bounceSessions / sessions) * 100).toFixed(1) : '0';
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center p-3 rounded-lg bg-muted/50"><p className="text-lg font-bold">{sessions}</p><p className="text-xs text-muted-foreground">Sessões</p></div>
                    <div className="text-center p-3 rounded-lg bg-muted/50"><p className="text-lg font-bold">{googleViews.length}</p><p className="text-xs text-muted-foreground">Page Views</p></div>
                    <div className="text-center p-3 rounded-lg bg-muted/50"><p className="text-lg font-bold">{sessions > 0 ? (googleViews.length / sessions).toFixed(1) : '-'}</p><p className="text-xs text-muted-foreground">Pág/Sessão</p></div>
                    <div className="text-center p-3 rounded-lg bg-muted/50"><p className="text-lg font-bold">{bounceRate}%</p><p className="text-xs text-muted-foreground">Bounce Rate</p></div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border"><th className="text-left py-2 font-medium text-muted-foreground">Campanha</th><th className="text-left py-2 font-medium text-muted-foreground">Palavras-chave</th><th className="text-right py-2 font-medium text-muted-foreground">Sessões</th><th className="text-right py-2 font-medium text-muted-foreground">Views</th><th className="text-right py-2 font-medium text-muted-foreground">Pág/Sessão</th></tr></thead>
                      <tbody>{sorted.map(([name, d]) => (<tr key={name} className="border-b border-border/50 last:border-0"><td className="py-2 font-medium truncate max-w-[180px]">{name}</td><td className="py-2 text-muted-foreground text-xs truncate max-w-[150px]">{d.terms.size > 0 ? Array.from(d.terms).join(', ') : '-'}</td><td className="py-2 text-right tabular-nums">{d.sessions.size}</td><td className="py-2 text-right tabular-nums">{d.views}</td><td className="py-2 text-right tabular-nums">{d.sessions.size > 0 ? (d.views / d.sessions.size).toFixed(1) : '-'}</td></tr>))}</tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Meta Ads Section */}
        <Card className="border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12z" fill="#1877F2"/></svg>
              Meta Ads (Facebook / Instagram)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const metaViews = currentViews.filter(v => (v as any).fbclid || ['facebook','instagram','fb','ig','meta'].some(s => v.utm_source?.toLowerCase()?.includes(s)));
              if (metaViews.length === 0) return <p className="text-center py-6 text-muted-foreground text-sm">Nenhum acesso via Meta Ads detectado. Dados aparecerão com links <code className="bg-muted px-1 rounded">fbclid</code> ou <code className="bg-muted px-1 rounded">utm_source=facebook</code>.</p>;
              const sessions = new Set(metaViews.map(v => v.session_id)).size;
              const campaigns: Record<string, { views: number; sessions: Set<string>; contents: Set<string> }> = {};
              for (const v of metaViews) {
                const campaign = v.utm_campaign || '(não definida)';
                if (!campaigns[campaign]) campaigns[campaign] = { views: 0, sessions: new Set(), contents: new Set() };
                campaigns[campaign].views++;
                campaigns[campaign].sessions.add(v.session_id);
                const content = (v as any).utm_content;
                if (content) campaigns[campaign].contents.add(content);
              }
              const sorted = Object.entries(campaigns).sort((a, b) => b[1].views - a[1].views);
              const bounceSessions = new Set(metaViews.filter(v => currentViews.filter(cv => cv.session_id === v.session_id).length === 1).map(v => v.session_id)).size;
              const bounceRate = sessions > 0 ? ((bounceSessions / sessions) * 100).toFixed(1) : '0';
              const deviceCounts: Record<string, number> = {};
              const metaSessions = new Map<string, string>();
              for (const v of metaViews) { if (!metaSessions.has(v.session_id)) metaSessions.set(v.session_id, v.device_type || 'desktop'); }
              for (const [, device] of metaSessions) deviceCounts[device] = (deviceCounts[device] || 0) + 1;
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center p-3 rounded-lg bg-muted/50"><p className="text-lg font-bold">{sessions}</p><p className="text-xs text-muted-foreground">Sessões</p></div>
                    <div className="text-center p-3 rounded-lg bg-muted/50"><p className="text-lg font-bold">{metaViews.length}</p><p className="text-xs text-muted-foreground">Page Views</p></div>
                    <div className="text-center p-3 rounded-lg bg-muted/50"><p className="text-lg font-bold">{sessions > 0 ? (metaViews.length / sessions).toFixed(1) : '-'}</p><p className="text-xs text-muted-foreground">Pág/Sessão</p></div>
                    <div className="text-center p-3 rounded-lg bg-muted/50"><p className="text-lg font-bold">{bounceRate}%</p><p className="text-xs text-muted-foreground">Bounce Rate</p></div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-muted-foreground">Dispositivos:</span>
                    {Object.entries(deviceCounts).map(([device, count]) => (<Badge key={device} variant="outline" className="text-xs">{device}: {count} ({sessions > 0 ? ((count / sessions) * 100).toFixed(0) : 0}%)</Badge>))}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border"><th className="text-left py-2 font-medium text-muted-foreground">Campanha</th><th className="text-left py-2 font-medium text-muted-foreground">Criativos (Content)</th><th className="text-right py-2 font-medium text-muted-foreground">Sessões</th><th className="text-right py-2 font-medium text-muted-foreground">Views</th><th className="text-right py-2 font-medium text-muted-foreground">Pág/Sessão</th></tr></thead>
                      <tbody>{sorted.map(([name, d]) => (<tr key={name} className="border-b border-border/50 last:border-0"><td className="py-2 font-medium truncate max-w-[180px]">{name}</td><td className="py-2 text-muted-foreground text-xs truncate max-w-[150px]">{d.contents.size > 0 ? Array.from(d.contents).join(', ') : '-'}</td><td className="py-2 text-right tabular-nums">{d.sessions.size}</td><td className="py-2 text-right tabular-nums">{d.views}</td><td className="py-2 text-right tabular-nums">{d.sessions.size > 0 ? (d.views / d.sessions.size).toFixed(1) : '-'}</td></tr>))}</tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* UTM Campaigns */}
        {campaignData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Todas as Campanhas UTM</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium text-muted-foreground">Campanha</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Sessões</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Views</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Pág/Sessão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignData.map(({ name, views, sessions }) => (
                      <tr key={name} className="border-b border-border/50 last:border-0">
                        <td className="py-2 font-medium truncate max-w-[200px]">{name}</td>
                        <td className="py-2 text-right tabular-nums">{sessions}</td>
                        <td className="py-2 text-right tabular-nums">{views}</td>
                        <td className="py-2 text-right tabular-nums">{sessions > 0 ? (views / sessions).toFixed(1) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed UTM */}
        {utmDetailData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" /> Detalhamento UTM Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium text-muted-foreground">Source</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Medium</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Campaign</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Sessões</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Views</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Pág/Sessão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utmDetailData.map((d, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-2 font-medium">{d.source}</td>
                        <td className="py-2 text-muted-foreground">{d.medium}</td>
                        <td className="py-2 text-muted-foreground truncate max-w-[200px]">{d.campaign}</td>
                        <td className="py-2 text-right tabular-nums">{d.sessionsCount}</td>
                        <td className="py-2 text-right tabular-nums">{d.views}</td>
                        <td className="py-2 text-right tabular-nums">{d.sessionsCount > 0 ? (d.views / d.sessionsCount).toFixed(1) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Páginas Mais Visitadas</CardTitle>
            </CardHeader>
            <CardContent>
              {topPages.length === 0 ? <p className="text-center py-8 text-muted-foreground">Nenhum dado</p> : (
                <div className="space-y-2">
                  {topPages.map(({ path, count }, i) => (
                    <div key={path} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5 tabular-nums">{i + 1}.</span>
                        <span className="text-sm truncate max-w-[250px]" title={path}>{getPageLabel(path)}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Browsers */}
          <Card>
            <CardHeader>
              <CardTitle>Navegadores</CardTitle>
            </CardHeader>
            <CardContent>
              {browserData.length === 0 ? <p className="text-center py-8 text-muted-foreground">Nenhum dado</p> : (
                <div className="space-y-3">
                  {browserData.map(({ name, value }) => {
                    const pct = current.totalPageViews > 0 ? Math.round((value / current.totalPageViews) * 100) : 0;
                    return (
                      <div key={name} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground tabular-nums">{value}</span>
                          <span className="text-xs text-muted-foreground">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Online Visitors */}
        {onlineVisitors.length > 0 && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary animate-pulse" />
                Visitantes Online ({onlineVisitors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {onlineVisitors.slice(0, 15).map((v: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-muted-foreground truncate max-w-[200px]">{v.path}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{v.source_label}</Badge>
                      <span className="text-xs text-muted-foreground">{v.device_type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
