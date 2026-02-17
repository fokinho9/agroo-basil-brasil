import { useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePageViews24h, useRealtimeVisitors } from '@/hooks/usePageViews';
import {
  Users, Eye, Monitor, Smartphone, Tablet, Globe,
  TrendingUp, Clock, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const SOURCE_COLORS: Record<string, string> = {
  'Direto': '#6366f1',
  'Google': '#ef4444',
  'Instagram': '#ec4899',
  'Facebook': '#3b82f6',
  'TikTok': '#000000',
  'YouTube': '#dc2626',
  'WhatsApp': '#22c55e',
  'Twitter/X': '#1d9bf0',
  'Telegram': '#0088cc',
  'Kwai': '#ff6600',
  'Bing': '#00809d',
  'Pinterest': '#e60023',
  'Outro Site': '#94a3b8',
};

const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

function getColor(source: string) {
  return SOURCE_COLORS[source] || '#94a3b8';
}

export default function AdminAnalyticsPage() {
  const { data: views24h = [], isLoading } = usePageViews24h();
  const { data: onlineVisitors = [] } = useRealtimeVisitors();

  // Source breakdown (24h)
  const sourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of views24h) {
      counts[v.source_label] = (counts[v.source_label] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [views24h]);

  // Unique sessions (24h)
  const uniqueSessions = useMemo(() => {
    return new Set(views24h.map(v => v.session_id)).size;
  }, [views24h]);

  // Device breakdown
  const deviceData = useMemo(() => {
    const counts: Record<string, number> = {};
    const sessions = new Map<string, string>();
    for (const v of views24h) {
      if (!sessions.has(v.session_id)) {
        sessions.set(v.session_id, v.device_type || 'desktop');
      }
    }
    for (const [, device] of sessions) {
      counts[device] = (counts[device] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [views24h]);

  // Hourly chart (24h)
  const hourlyData = useMemo(() => {
    const now = new Date();
    const hours: { hour: string; visitas: number }[] = [];
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      const label = `${String(d.getHours()).padStart(2, '0')}h`;
      const start = new Date(d);
      start.setMinutes(0, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const count = views24h.filter(v => {
        const t = new Date(v.created_at);
        return t >= start && t < end;
      }).length;
      hours.push({ hour: label, visitas: count });
    }
    return hours;
  }, [views24h]);

  // Top pages
  const topPages = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of views24h) {
      counts[v.path] = (counts[v.path] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [views24h]);

  // Browser breakdown
  const browserData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of views24h) {
      const b = v.browser || 'Desconhecido';
      counts[b] = (counts[b] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [views24h]);

  // Online visitors source breakdown
  const onlineBySource = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of onlineVisitors) {
      counts[v.source_label] = (counts[v.source_label] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  }, [onlineVisitors]);

  const PIE_COLORS = ['#6366f1', '#ec4899', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Visitantes e fontes de tráfego em tempo real</p>
        </div>

        {/* Real-time Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Online Agora</p>
                  <p className="text-3xl font-bold text-primary">{onlineVisitors.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">últimos 5 min</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-primary animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Visitantes (24h)</p>
                  <p className="text-3xl font-bold text-foreground">{uniqueSessions}</p>
                  <p className="text-xs text-muted-foreground mt-1">sessões únicas</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Page Views (24h)</p>
                  <p className="text-3xl font-bold text-foreground">{views24h.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">total de visualizações</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fontes de Tráfego</p>
                  <p className="text-3xl font-bold text-foreground">{sourceData.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">origens diferentes</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Online Visitors Detail */}
        {onlineVisitors.length > 0 && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary animate-pulse" />
                Visitantes Online Agora ({onlineVisitors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {onlineBySource.map(({ source, count }) => (
                  <div key={source} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getColor(source) }}
                      />
                      <span className="text-sm font-medium">{source}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {onlineVisitors.slice(0, 10).map((v, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-muted-foreground">{v.path}</span>
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

        {/* Hourly Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Visitas por Hora (últimas 24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="visitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Fontes de Tráfego (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sourceData.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nenhum dado ainda</p>
              ) : (
                <div className="space-y-3">
                  {sourceData.map(({ name, value }) => {
                    const pct = Math.round((value / views24h.length) * 100);
                    return (
                      <div key={name} className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: getColor(name) }}
                        />
                        <span className="text-sm font-medium flex-1 truncate">{name}</span>
                        <span className="text-sm text-muted-foreground">{value}</span>
                        <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: getColor(name) }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
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
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Dispositivos (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deviceData.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nenhum dado ainda</p>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {deviceData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Páginas Mais Visitadas (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              {topPages.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nenhum dado ainda</p>
              ) : (
                <div className="space-y-2">
                  {topPages.map(({ path, count }, i) => (
                    <div key={path} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                        <span className="text-sm truncate max-w-[250px]">{path}</span>
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
              <CardTitle>Navegadores (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              {browserData.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nenhum dado ainda</p>
              ) : (
                <div className="space-y-3">
                  {browserData.map(({ name, value }) => {
                    const pct = Math.round((value / views24h.length) * 100);
                    return (
                      <div key={name} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{value}</span>
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
      </div>
    </AdminLayout>
  );
}
