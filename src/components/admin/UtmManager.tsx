import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSiteSettings, useUpdateSiteSetting } from '@/hooks/useSiteSettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Copy, Link2, BarChart3, Settings, Save,
  ExternalLink, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { Step, CopySnippet, TipsCard } from './guides/GuideComponents';

// ---- UTM Generator ----

function UtmGenerator() {
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
  const [form, setForm] = useState({
    url: siteUrl + '/produtos',
    source: '',
    medium: '',
    campaign: '',
    term: '',
    content: '',
  });

  const generatedUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (form.source) params.set('utm_source', form.source);
    if (form.medium) params.set('utm_medium', form.medium);
    if (form.campaign) params.set('utm_campaign', form.campaign);
    if (form.term) params.set('utm_term', form.term);
    if (form.content) params.set('utm_content', form.content);
    const qs = params.toString();
    return qs ? `${form.url}?${qs}` : form.url;
  }, [form]);

  const presets = [
    { label: 'Google Ads', source: 'google', medium: 'cpc' },
    { label: 'Facebook Ads', source: 'facebook', medium: 'cpc' },
    { label: 'Instagram Ads', source: 'instagram', medium: 'cpc' },
    { label: 'TikTok Ads', source: 'tiktok', medium: 'cpc' },
    { label: 'WhatsApp', source: 'whatsapp', medium: 'social' },
    { label: 'E-mail Marketing', source: 'email', medium: 'email' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Gerador de URL com UTM
        </CardTitle>
        <CardDescription>Crie URLs com parâmetros UTM para rastrear suas campanhas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Presets */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Atalhos rápidos:</Label>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <Button
                key={p.label}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setForm({ ...form, source: p.source, medium: p.medium })}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>URL de destino</Label>
            <Input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://seusite.com.br/produtos"
            />
          </div>
          <div>
            <Label>Campaign Name <span className="text-xs text-muted-foreground">(nome da campanha)</span></Label>
            <Input
              value={form.campaign}
              onChange={(e) => setForm({ ...form, campaign: e.target.value })}
              placeholder="ex: black-friday-2026"
            />
          </div>
          <div>
            <Label>Source <span className="text-xs text-muted-foreground">(origem)</span></Label>
            <Input
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder="ex: google, facebook, instagram"
            />
          </div>
          <div>
            <Label>Medium <span className="text-xs text-muted-foreground">(meio)</span></Label>
            <Input
              value={form.medium}
              onChange={(e) => setForm({ ...form, medium: e.target.value })}
              placeholder="ex: cpc, social, email"
            />
          </div>
          <div>
            <Label>Term <span className="text-xs text-muted-foreground">(palavra-chave, opcional)</span></Label>
            <Input
              value={form.term}
              onChange={(e) => setForm({ ...form, term: e.target.value })}
              placeholder="ex: bota-country"
            />
          </div>
          <div>
            <Label>Content <span className="text-xs text-muted-foreground">(variação do anúncio, opcional)</span></Label>
            <Input
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="ex: banner-vermelho"
            />
          </div>
        </div>

        {/* Result */}
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-medium">URL Gerada:</Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => { navigator.clipboard.writeText(generatedUrl); toast.success('URL copiada!'); }}
            >
              <Copy className="h-3 w-3" /> Copiar
            </Button>
          </div>
          <code className="text-xs break-all text-foreground block">{generatedUrl}</code>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- UTM Dashboard ----

function UtmDashboard() {
  const [days, setDays] = useState(7);

  const { data: pageViews = [] } = useQuery({
    queryKey: ['utm-dashboard', days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      let all: any[] = [];
      let offset = 0;
      while (true) {
        const { data, error } = await supabase
          .from('page_views')
          .select('utm_source, utm_medium, utm_campaign, utm_term, utm_content, session_id, path, created_at')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .range(offset, offset + 999);
        if (error) throw error;
        all = all.concat(data || []);
        if (!data || data.length < 1000) break;
        offset += 1000;
      }
      return all;
    },
    refetchInterval: 60000,
  });

  const withUtm = useMemo(() => pageViews.filter((v: any) => v.utm_source || v.utm_medium || v.utm_campaign), [pageViews]);

  const byCampaign = useMemo(() => {
    const map: Record<string, { sessions: Set<string>; views: number }> = {};
    for (const v of withUtm) {
      const key = v.utm_campaign || '(sem campanha)';
      if (!map[key]) map[key] = { sessions: new Set(), views: 0 };
      map[key].sessions.add(v.session_id);
      map[key].views++;
    }
    return Object.entries(map)
      .map(([campaign, data]) => ({ campaign, sessions: data.sessions.size, views: data.views }))
      .sort((a, b) => b.sessions - a.sessions);
  }, [withUtm]);

  const bySource = useMemo(() => {
    const map: Record<string, { sessions: Set<string>; views: number }> = {};
    for (const v of withUtm) {
      const key = `${v.utm_source || '(direto)'} / ${v.utm_medium || '(nenhum)'}`;
      if (!map[key]) map[key] = { sessions: new Set(), views: 0 };
      map[key].sessions.add(v.session_id);
      map[key].views++;
    }
    return Object.entries(map)
      .map(([source, data]) => ({ source, sessions: data.sessions.size, views: data.views }))
      .sort((a, b) => b.sessions - a.sessions);
  }, [withUtm]);

  const byContent = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of withUtm) {
      if (v.utm_content) {
        map[v.utm_content] = (map[v.utm_content] || 0) + 1;
      }
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [withUtm]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <TabsList>
              <TabsTrigger value="1">Hoje</TabsTrigger>
              <TabsTrigger value="7">7 dias</TabsTrigger>
              <TabsTrigger value="30">30 dias</TabsTrigger>
            </TabsList>
          </Tabs>
          <Badge variant="outline">{withUtm.length} visitas com UTM</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By Source/Medium */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Por Origem / Meio</CardTitle>
          </CardHeader>
          <CardContent>
            {bySource.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma visita com UTM no período</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {bySource.map((s) => (
                  <div key={s.source} className="flex justify-between items-center text-sm p-2 rounded bg-muted/50">
                    <span className="font-medium truncate mr-2">{s.source}</span>
                    <div className="flex gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">{s.sessions} sessões</Badge>
                      <Badge variant="secondary" className="text-xs">{s.views} views</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Campaign */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Por Campanha</CardTitle>
          </CardHeader>
          <CardContent>
            {byCampaign.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma campanha rastreada</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {byCampaign.map((c) => (
                  <div key={c.campaign} className="flex justify-between items-center text-sm p-2 rounded bg-muted/50">
                    <span className="font-medium truncate mr-2">{c.campaign}</span>
                    <div className="flex gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">{c.sessions} sessões</Badge>
                      <Badge variant="secondary" className="text-xs">{c.views} views</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* By Content */}
      {byContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Por Conteúdo (utm_content)</CardTitle>
            <CardDescription className="text-xs">Útil para comparar variações de anúncios (A/B test)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {byContent.map(([content, count]) => (
                <div key={content} className="flex justify-between items-center text-sm p-2 rounded bg-muted/50">
                  <span className="font-medium">{content}</span>
                  <Badge variant="outline" className="text-xs">{count} views</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---- UTM ROI Report ----

function UtmRoiReport() {
  const [days, setDays] = useState(30);

  const { data: pageViews = [] } = useQuery({
    queryKey: ['utm-roi-views', days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      let all: any[] = [];
      let offset = 0;
      while (true) {
        const { data, error } = await supabase
          .from('page_views')
          .select('utm_source, utm_medium, utm_campaign, session_id, created_at')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .range(offset, offset + 999);
        if (error) throw error;
        all = all.concat(data || []);
        if (!data || data.length < 1000) break;
        offset += 1000;
      }
      return all;
    },
    refetchInterval: 120000,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['utm-roi-orders', days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      const { data, error } = await supabase
        .from('orders')
        .select('id, total, status, created_at, customer_name')
        .gte('created_at', since)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 120000,
  });

  // Build session -> UTM mapping
  const sessionUtm = useMemo(() => {
    const map: Record<string, { source: string; medium: string; campaign: string }> = {};
    for (const v of pageViews) {
      if (v.utm_source || v.utm_campaign) {
        if (!map[v.session_id]) {
          map[v.session_id] = {
            source: v.utm_source || '(direto)',
            medium: v.utm_medium || '(nenhum)',
            campaign: v.utm_campaign || '(sem campanha)',
          };
        }
      }
    }
    return map;
  }, [pageViews]);

  // Attribution: match orders to UTM sessions by time proximity
  // Simple last-touch: find the most recent UTM session before each order
  const attributedOrders = useMemo(() => {
    const utmSessions = Object.entries(sessionUtm);
    if (utmSessions.length === 0) return [];

    // Get session timestamps
    const sessionTimes: Record<string, Date> = {};
    for (const v of pageViews) {
      if (sessionUtm[v.session_id]) {
        const t = new Date(v.created_at);
        if (!sessionTimes[v.session_id] || t > sessionTimes[v.session_id]) {
          sessionTimes[v.session_id] = t;
        }
      }
    }

    return orders.map((order: any) => {
      const orderTime = new Date(order.created_at);
      // Find closest UTM session within 24h before order
      let bestSession: string | null = null;
      let bestDiff = Infinity;
      for (const [sid, time] of Object.entries(sessionTimes)) {
        const diff = orderTime.getTime() - time.getTime();
        if (diff >= 0 && diff < 24 * 60 * 60 * 1000 && diff < bestDiff) {
          bestDiff = diff;
          bestSession = sid;
        }
      }
      return {
        ...order,
        utm: bestSession ? sessionUtm[bestSession] : null,
      };
    });
  }, [orders, sessionUtm, pageViews]);

  // Aggregate by campaign
  const roiByCampaign = useMemo(() => {
    const map: Record<string, { source: string; medium: string; orders: number; revenue: number; sessions: number }> = {};
    
    // Count sessions per campaign
    const campaignSessions: Record<string, Set<string>> = {};
    for (const v of pageViews) {
      if (v.utm_campaign) {
        const key = v.utm_campaign;
        if (!campaignSessions[key]) campaignSessions[key] = new Set();
        campaignSessions[key].add(v.session_id);
        if (!map[key]) {
          map[key] = { source: v.utm_source || '', medium: v.utm_medium || '', orders: 0, revenue: 0, sessions: 0 };
        }
      }
    }

    // Count orders per campaign
    for (const order of attributedOrders) {
      if (order.utm) {
        const key = order.utm.campaign;
        if (!map[key]) {
          map[key] = { source: order.utm.source, medium: order.utm.medium, orders: 0, revenue: 0, sessions: 0 };
        }
        map[key].orders++;
        map[key].revenue += order.total || 0;
      }
    }

    // Set session counts
    for (const [key, sessions] of Object.entries(campaignSessions)) {
      if (map[key]) map[key].sessions = sessions.size;
    }

    return Object.entries(map)
      .map(([campaign, data]) => ({
        campaign,
        ...data,
        conversionRate: data.sessions > 0 ? (data.orders / data.sessions * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [pageViews, attributedOrders]);

  // By source
  const roiBySource = useMemo(() => {
    const map: Record<string, { orders: number; revenue: number; sessions: number }> = {};
    const sourceSessions: Record<string, Set<string>> = {};
    
    for (const v of pageViews) {
      if (v.utm_source) {
        const key = `${v.utm_source} / ${v.utm_medium || '(nenhum)'}`;
        if (!sourceSessions[key]) sourceSessions[key] = new Set();
        sourceSessions[key].add(v.session_id);
        if (!map[key]) map[key] = { orders: 0, revenue: 0, sessions: 0 };
      }
    }

    for (const order of attributedOrders) {
      if (order.utm) {
        const key = `${order.utm.source} / ${order.utm.medium}`;
        if (!map[key]) map[key] = { orders: 0, revenue: 0, sessions: 0 };
        map[key].orders++;
        map[key].revenue += order.total || 0;
      }
    }

    for (const [key, sessions] of Object.entries(sourceSessions)) {
      if (map[key]) map[key].sessions = sessions.size;
    }

    return Object.entries(map)
      .map(([source, data]) => ({
        source,
        ...data,
        conversionRate: data.sessions > 0 ? (data.orders / data.sessions * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [pageViews, attributedOrders]);

  const totalAttributed = attributedOrders.filter(o => o.utm).length;
  const totalRevenue = attributedOrders.filter(o => o.utm).reduce((s, o) => s + (o.total || 0), 0);
  const totalOrders = orders.length;

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatório de ROI por UTM
          </h3>
          <p className="text-xs text-muted-foreground">Atribuição last-touch: pedidos vinculados à sessão UTM mais recente (24h)</p>
        </div>
        <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <TabsList>
            <TabsTrigger value="7">7 dias</TabsTrigger>
            <TabsTrigger value="30">30 dias</TabsTrigger>
            <TabsTrigger value="90">90 dias</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{totalOrders}</p>
            <p className="text-xs text-muted-foreground">Pedidos Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{totalAttributed}</p>
            <p className="text-xs text-muted-foreground">Atribuídos a UTM</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">Receita UTM</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {totalOrders > 0 ? Math.round(totalAttributed / totalOrders * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Taxa Atribuição</p>
          </CardContent>
        </Card>
      </div>

      {/* By Campaign */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">ROI por Campanha</CardTitle>
          <CardDescription className="text-xs">Campanhas ordenadas por receita gerada</CardDescription>
        </CardHeader>
        <CardContent>
          {roiByCampaign.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma campanha com dados no período</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Sessões</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">Conv. %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roiByCampaign.map((r) => (
                    <TableRow key={r.campaign}>
                      <TableCell className="font-medium text-sm">{r.campaign}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.source}/{r.medium}</TableCell>
                      <TableCell className="text-right text-sm">{r.sessions}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{r.orders}</TableCell>
                      <TableCell className="text-right text-sm font-bold text-primary">{formatCurrency(r.revenue)}</TableCell>
                      <TableCell className="text-right text-sm">
                        <Badge variant={r.conversionRate > 2 ? 'default' : 'secondary'} className="text-xs">
                          {r.conversionRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* By Source */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">ROI por Origem / Meio</CardTitle>
        </CardHeader>
        <CardContent>
          {roiBySource.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origem / Meio</TableHead>
                    <TableHead className="text-right">Sessões</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">Conv. %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roiBySource.map((r) => (
                    <TableRow key={r.source}>
                      <TableCell className="font-medium text-sm">{r.source}</TableCell>
                      <TableCell className="text-right text-sm">{r.sessions}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{r.orders}</TableCell>
                      <TableCell className="text-right text-sm font-bold text-primary">{formatCurrency(r.revenue)}</TableCell>
                      <TableCell className="text-right text-sm">
                        <Badge variant={r.conversionRate > 2 ? 'default' : 'secondary'} className="text-xs">
                          {r.conversionRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Default UTM Settings ----

function UtmDefaultSettings() {
  const { data: settings } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();

  const defaults = (settings?.utm_defaults as any) || {
    whatsapp_source: 'whatsapp',
    whatsapp_medium: 'social',
    share_source: 'share',
    share_medium: 'social',
  };

  const [form, setForm] = useState(defaults);

  const handleSave = async () => {
    try {
      await updateSetting.mutateAsync({ key: 'utm_defaults', value: form });
      toast.success('UTMs padrão salvos!');
    } catch {
      toast.error('Erro ao salvar');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          UTMs Padrão do Site
        </CardTitle>
        <CardDescription>
          Defina os UTMs que serão adicionados automaticamente aos links de compartilhamento do site
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 p-4 rounded-lg border">
            <h4 className="font-medium text-sm">Links de WhatsApp</h4>
            <div>
              <Label className="text-xs">utm_source</Label>
              <Input
                value={form.whatsapp_source || ''}
                onChange={(e) => setForm({ ...form, whatsapp_source: e.target.value })}
                placeholder="whatsapp"
              />
            </div>
            <div>
              <Label className="text-xs">utm_medium</Label>
              <Input
                value={form.whatsapp_medium || ''}
                onChange={(e) => setForm({ ...form, whatsapp_medium: e.target.value })}
                placeholder="social"
              />
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-lg border">
            <h4 className="font-medium text-sm">Compartilhamento Social</h4>
            <div>
              <Label className="text-xs">utm_source</Label>
              <Input
                value={form.share_source || ''}
                onChange={(e) => setForm({ ...form, share_source: e.target.value })}
                placeholder="share"
              />
            </div>
            <div>
              <Label className="text-xs">utm_medium</Label>
              <Input
                value={form.share_medium || ''}
                onChange={(e) => setForm({ ...form, share_medium: e.target.value })}
                placeholder="social"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={updateSetting.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {updateSetting.isPending ? 'Salvando...' : 'Salvar UTMs Padrão'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ---- UTM Guide ----

function UtmGuide() {
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

  return (
    <div className="space-y-6">
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-primary">O que são UTMs?</CardTitle>
          <CardDescription>
            UTM (Urchin Tracking Module) são parâmetros adicionados às URLs que permitem rastrear de onde vem cada visitante do seu site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Exemplo de URL com UTMs:</p>
            <code className="text-xs break-all text-foreground">
              {siteUrl}/produtos?<span className="text-primary font-bold">utm_source</span>=google&<span className="text-primary font-bold">utm_medium</span>=cpc&<span className="text-primary font-bold">utm_campaign</span>=black-friday
            </code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guia dos 5 Parâmetros UTM</CardTitle>
        </CardHeader>
        <CardContent>
          <Step number={1} title="utm_source — De onde vem o tráfego" badge="Obrigatório">
            <p>Identifica a <strong>origem</strong> do visitante.</p>
            <div className="bg-muted rounded-lg p-3 mt-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">Exemplos comuns:</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span><code className="bg-background px-1 rounded">google</code> — Google Ads / Orgânico</span>
                <span><code className="bg-background px-1 rounded">facebook</code> — Facebook Ads</span>
                <span><code className="bg-background px-1 rounded">instagram</code> — Instagram</span>
                <span><code className="bg-background px-1 rounded">tiktok</code> — TikTok Ads</span>
                <span><code className="bg-background px-1 rounded">email</code> — Newsletter</span>
                <span><code className="bg-background px-1 rounded">whatsapp</code> — WhatsApp</span>
              </div>
            </div>
          </Step>

          <Step number={2} title="utm_medium — Qual o tipo de tráfego" badge="Obrigatório">
            <p>Identifica o <strong>meio/canal</strong> de marketing.</p>
            <div className="bg-muted rounded-lg p-3 mt-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">Valores padrão:</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span><code className="bg-background px-1 rounded">cpc</code> — Anúncio pago (custo por clique)</span>
                <span><code className="bg-background px-1 rounded">social</code> — Rede social orgânica</span>
                <span><code className="bg-background px-1 rounded">email</code> — E-mail marketing</span>
                <span><code className="bg-background px-1 rounded">referral</code> — Site parceiro</span>
                <span><code className="bg-background px-1 rounded">display</code> — Banners</span>
                <span><code className="bg-background px-1 rounded">affiliate</code> — Afiliados</span>
              </div>
            </div>
          </Step>

          <Step number={3} title="utm_campaign — Nome da campanha" badge="Recomendado">
            <p>Nome da campanha para agrupar anúncios.</p>
            <p><strong>Dica:</strong> Use nomes descritivos e padronizados.</p>
            <div className="bg-muted rounded-lg p-3 mt-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">Exemplos:</p>
              <div className="text-xs space-y-0.5">
                <p><code className="bg-background px-1 rounded">black-friday-2026</code></p>
                <p><code className="bg-background px-1 rounded">lancamento-botas-vimar</code></p>
                <p><code className="bg-background px-1 rounded">remarketing-carrinho-abandonado</code></p>
              </div>
            </div>
          </Step>

          <Step number={4} title="utm_term — Palavra-chave" badge="Opcional">
            <p>Identifica a <strong>palavra-chave</strong> usada no anúncio pago.</p>
            <p>Muito útil para Google Ads quando você quer saber qual termo de busca trouxe o visitante.</p>
            <div className="bg-muted rounded-lg p-3 mt-1 text-xs">
              <p>Exemplos: <code className="bg-background px-1 rounded">bota-country</code>, <code className="bg-background px-1 rounded">sela-cavalo</code>, <code className="bg-background px-1 rounded">manta-importada</code></p>
            </div>
          </Step>

          <Step number={5} title="utm_content — Variação do anúncio" badge="Opcional">
            <p>Diferencia anúncios que apontam para a mesma URL. Perfeito para <strong>testes A/B</strong>.</p>
            <div className="bg-muted rounded-lg p-3 mt-1 text-xs">
              <p>Exemplos: <code className="bg-background px-1 rounded">banner-vermelho</code>, <code className="bg-background px-1 rounded">video-curto</code>, <code className="bg-background px-1 rounded">carrossel-3-fotos</code></p>
            </div>
          </Step>
        </CardContent>
      </Card>

      <TipsCard tips={[
        'Use SEMPRE letras minúsculas e hífens nos UTMs — evite espaços, acentos e maiúsculas.',
        'Padronize os valores de source e medium em toda a equipe. "facebook" é diferente de "Facebook".',
        'O Google Ads com auto-tagging (gclid) já rastreia automaticamente, mas UTMs dão redundância.',
        'No Facebook Ads, use o campo "Parâmetros da URL" no nível do anúncio para adicionar UTMs.',
        'No TikTok Ads, adicione os UTMs manualmente no campo de URL de destino.',
        'Crie uma planilha de naming convention (padrão de nomenclatura) antes de lançar campanhas.',
        'Use utm_content para testar variações: "imagem-A" vs "imagem-B" ajudam a identificar o que converte mais.',
        'Links de WhatsApp e e-mail marketing SEMPRE devem ter UTMs para saber que canal funciona melhor.',
      ]} />

      <Card>
        <CardHeader>
          <CardTitle>Exemplos Prontos para Copiar</CardTitle>
          <CardDescription>URLs prontas para cada canal — substitua "nome-da-campanha" pelo nome real</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CopySnippet label="Google Ads" code={`${siteUrl}/produtos?utm_source=google&utm_medium=cpc&utm_campaign=nome-da-campanha&utm_term=palavra-chave`} />
          <CopySnippet label="Facebook / Instagram Ads" code={`${siteUrl}/produtos?utm_source=facebook&utm_medium=cpc&utm_campaign=nome-da-campanha&utm_content=variacao-anuncio`} />
          <CopySnippet label="TikTok Ads" code={`${siteUrl}/produtos?utm_source=tiktok&utm_medium=cpc&utm_campaign=nome-da-campanha`} />
          <CopySnippet label="WhatsApp" code={`${siteUrl}/produtos?utm_source=whatsapp&utm_medium=social&utm_campaign=divulgacao`} />
          <CopySnippet label="E-mail Marketing" code={`${siteUrl}/produtos?utm_source=email&utm_medium=email&utm_campaign=newsletter-semanal`} />
          <CopySnippet label="Instagram Bio / Stories" code={`${siteUrl}?utm_source=instagram&utm_medium=social&utm_campaign=bio-link`} />
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Main Export ----

export function UtmManager() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="generator">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="generator" className="gap-2">
            <Link2 className="h-4 w-4" /> Gerador
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="roi" className="gap-2">
            <BarChart3 className="h-4 w-4" /> ROI
          </TabsTrigger>
          <TabsTrigger value="defaults" className="gap-2">
            <Settings className="h-4 w-4" /> UTMs Padrão
          </TabsTrigger>
          <TabsTrigger value="guide" className="gap-2">
            <CheckCircle2 className="h-4 w-4" /> Guia & Dicas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          <UtmGenerator />
        </TabsContent>

        <TabsContent value="dashboard">
          <UtmDashboard />
        </TabsContent>

        <TabsContent value="roi">
          <UtmRoiReport />
        </TabsContent>

        <TabsContent value="defaults">
          <UtmDefaultSettings />
        </TabsContent>

        <TabsContent value="guide">
          <UtmGuide />
        </TabsContent>
      </Tabs>
    </div>
  );
}
