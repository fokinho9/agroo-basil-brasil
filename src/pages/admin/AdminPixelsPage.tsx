import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSiteSettings, useUpdateSiteSetting } from '@/hooks/useSiteSettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Save, Download, Code, Eye, ShoppingCart, CreditCard,
  Facebook, Chrome, Tv, Camera, Share2, Zap, BookOpen,
} from 'lucide-react';
import { GoogleAdsGuide } from '@/components/admin/GoogleAdsGuide';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PixelConfig {
  enabled: boolean;
  id: string;
  conversionLabel?: string;
}

interface AllPixels {
  facebook: PixelConfig;
  google_analytics: PixelConfig;
  google_ads: PixelConfig;
  gtm: PixelConfig;
  tiktok: PixelConfig;
  kwai: PixelConfig;
  pinterest: PixelConfig;
  twitter: PixelConfig;
  snapchat: PixelConfig;
  bing: PixelConfig;
}

const defaultPixels: AllPixels = {
  facebook: { enabled: false, id: '' },
  google_analytics: { enabled: false, id: '' },
  google_ads: { enabled: false, id: '' },
  gtm: { enabled: false, id: '' },
  tiktok: { enabled: false, id: '' },
  kwai: { enabled: false, id: '' },
  pinterest: { enabled: false, id: '' },
  twitter: { enabled: false, id: '' },
  snapchat: { enabled: false, id: '' },
  bing: { enabled: false, id: '' },
};

const pixelMeta: Record<string, { label: string; placeholder: string; icon: any; color: string }> = {
  facebook: { label: 'Facebook Pixel (Meta)', placeholder: 'Ex: 123456789012345', icon: Facebook, color: '#1877F2' },
  google_analytics: { label: 'Google Analytics (GA4)', placeholder: 'Ex: G-XXXXXXXXXX', icon: Chrome, color: '#4285F4' },
  google_ads: { label: 'Google Ads', placeholder: 'Ex: AW-XXXXXXXXXX', icon: Chrome, color: '#34A853' },
  gtm: { label: 'Google Tag Manager', placeholder: 'Ex: GTM-XXXXXXX', icon: Code, color: '#246FDB' },
  tiktok: { label: 'TikTok Pixel', placeholder: 'Ex: CXXXXXXXXXXXXXXXXX', icon: Tv, color: '#000000' },
  kwai: { label: 'Kwai Pixel', placeholder: 'Ex: 123456', icon: Zap, color: '#FF6600' },
  pinterest: { label: 'Pinterest Tag', placeholder: 'Ex: 1234567890123', icon: Camera, color: '#E60023' },
  twitter: { label: 'Twitter/X Pixel', placeholder: 'Ex: oXXXX', icon: Share2, color: '#1DA1F2' },
  snapchat: { label: 'Snapchat Pixel', placeholder: 'Ex: abc123-xxxx-xxxx', icon: Camera, color: '#FFFC00' },
  bing: { label: 'Microsoft/Bing UET', placeholder: 'Ex: 12345678', icon: Chrome, color: '#00809D' },
};

function usePixelEvents(days: number) {
  return useQuery({
    queryKey: ['pixel-events', days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      let all: any[] = [];
      let offset = 0;
      while (true) {
        const { data, error } = await supabase
          .from('pixel_events')
          .select('*')
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
}

export default function AdminPixelsPage() {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const [pixels, setPixels] = useState<AllPixels>(defaultPixels);
  const [eventDays, setEventDays] = useState(7);
  const { data: pixelEvents = [] } = usePixelEvents(eventDays);

  useEffect(() => {
    if (settings?.pixels) {
      setPixels({ ...defaultPixels, ...settings.pixels });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSetting.mutateAsync({ key: 'pixels', value: pixels });
      toast.success('Pixels salvos! As alterações entrarão em vigor imediatamente.');
    } catch {
      toast.error('Erro ao salvar pixels');
    }
  };

  const eventsByPlatform = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of pixelEvents) {
      map[e.pixel_platform] = (map[e.pixel_platform] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [pixelEvents]);

  const eventsByName = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of pixelEvents) {
      map[e.event_name] = (map[e.event_name] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [pixelEvents]);

  const downloadCSV = () => {
    if (pixelEvents.length === 0) {
      toast.error('Nenhum evento para exportar');
      return;
    }
    const headers = ['Data', 'Plataforma', 'Evento', 'Página', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Dispositivo', 'Session ID'];
    const rows = pixelEvents.map((e: any) => [
      format(new Date(e.created_at), 'dd/MM/yyyy HH:mm:ss'),
      e.pixel_platform,
      e.event_name,
      e.path,
      e.utm_source || '',
      e.utm_medium || '',
      e.utm_campaign || '',
      e.device_type || '',
      e.session_id,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixel-events-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado!');
  };

  const downloadAnalyticsCSV = async () => {
    toast.info('Exportando dados de analytics...');
    const since = subDays(new Date(), eventDays).toISOString();
    let allViews: any[] = [];
    let offset = 0;
    while (true) {
      const { data, error } = await supabase
        .from('page_views')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .range(offset, offset + 999);
      if (error) { toast.error('Erro ao exportar'); return; }
      allViews = allViews.concat(data || []);
      if (!data || data.length < 1000) break;
      offset += 1000;
    }
    const headers = ['Data', 'Session ID', 'Página', 'Referrer', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Fonte', 'Dispositivo', 'Navegador'];
    const rows = allViews.map((v: any) => [
      format(new Date(v.created_at), 'dd/MM/yyyy HH:mm:ss'),
      v.session_id,
      v.path,
      v.referrer || '',
      v.utm_source || '',
      v.utm_medium || '',
      v.utm_campaign || '',
      v.source_label || '',
      v.device_type || '',
      v.browser || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics CSV exportado!');
  };

  const activeCount = Object.values(pixels).filter(p => p.enabled && p.id).length;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pixels & Rastreamento</h1>
            <p className="text-muted-foreground">
              Configure pixels de todas as plataformas e exporte dados
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={activeCount > 0 ? 'default' : 'secondary'}>
              {activeCount} pixel{activeCount !== 1 ? 's' : ''} ativo{activeCount !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="config">
          <TabsList>
            <TabsTrigger value="config" className="gap-2">
              <Code className="h-4 w-4" /> Configurar Pixels
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Eye className="h-4 w-4" /> Eventos Disparados
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Download className="h-4 w-4" /> Exportar Dados
            </TabsTrigger>
            <TabsTrigger value="google-ads-guide" className="gap-2">
              <BookOpen className="h-4 w-4" /> Guia Google Ads
            </TabsTrigger>
          </TabsList>

          {/* Config Tab */}
          <TabsContent value="config" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.entries(pixelMeta).map(([key, meta]) => {
                const pixel = pixels[key as keyof AllPixels];
                const Icon = meta.icon;
                return (
                  <Card key={key} className={pixel.enabled && pixel.id ? 'border-primary/30' : ''}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: meta.color + '20' }}>
                            <Icon className="h-4 w-4" style={{ color: meta.color }} />
                          </div>
                          <span className="font-medium text-sm">{meta.label}</span>
                        </div>
                        <Switch
                          checked={pixel.enabled}
                          onCheckedChange={(checked) =>
                            setPixels({ ...pixels, [key]: { ...pixel, enabled: checked } })
                          }
                        />
                      </div>
                      <Input
                        placeholder={meta.placeholder}
                        value={pixel.id}
                        onChange={(e) =>
                          setPixels({ ...pixels, [key]: { ...pixel, id: e.target.value } })
                        }
                        disabled={!pixel.enabled}
                        className="text-sm"
                      />
                      {key === 'google_ads' && pixel.enabled && (
                        <div className="mt-2">
                          <Input
                            placeholder="Conversion Label (ex: AbCdEfGhIjKlMn)"
                            value={pixel.conversionLabel || ''}
                            onChange={(e) =>
                              setPixels({ ...pixels, [key]: { ...pixel, conversionLabel: e.target.value } })
                            }
                            className="text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Rótulo de conversão do Google Ads (veja o Guia Google Ads)
                          </p>
                        </div>
                      )}
                      {pixel.enabled && pixel.id && (
                        <Badge variant="outline" className="mt-2 text-xs text-green-600 border-green-300">
                          ✓ Ativo
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Button onClick={handleSave} className="w-full gap-2" disabled={updateSetting.isPending}>
              <Save className="h-4 w-4" />
              {updateSetting.isPending ? 'Salvando...' : 'Salvar Pixels'}
            </Button>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Tabs value={String(eventDays)} onValueChange={(v) => setEventDays(Number(v))}>
                <TabsList>
                  <TabsTrigger value="1">Hoje</TabsTrigger>
                  <TabsTrigger value="7">7 dias</TabsTrigger>
                  <TabsTrigger value="30">30 dias</TabsTrigger>
                </TabsList>
              </Tabs>
              <Badge variant="outline">{pixelEvents.length} eventos</Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Por Plataforma</CardTitle>
                </CardHeader>
                <CardContent>
                  {eventsByPlatform.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Nenhum evento ainda</p>
                  ) : (
                    <div className="space-y-2">
                      {eventsByPlatform.map(([platform, count]) => (
                        <div key={platform} className="flex justify-between items-center text-sm">
                          <span className="font-medium capitalize">{platform.replace('_', ' ')}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Por Tipo de Evento</CardTitle>
                </CardHeader>
                <CardContent>
                  {eventsByName.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Nenhum evento ainda</p>
                  ) : (
                    <div className="space-y-2">
                      {eventsByName.map(([name, count]) => (
                        <div key={name} className="flex justify-between items-center text-sm">
                          <span className="font-medium">{name}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent events table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  Eventos Recentes
                  <Button size="sm" variant="outline" onClick={downloadCSV} className="gap-1">
                    <Download className="h-3 w-3" /> CSV
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pixelEvents.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum evento registrado. Configure e ative os pixels acima.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Plataforma</TableHead>
                          <TableHead>Evento</TableHead>
                          <TableHead>Página</TableHead>
                          <TableHead>UTM</TableHead>
                          <TableHead>Dispositivo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pixelEvents.slice(0, 50).map((e: any) => (
                          <TableRow key={e.id}>
                            <TableCell className="text-xs whitespace-nowrap">
                              {format(new Date(e.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs capitalize">
                                {e.pixel_platform.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs font-medium">{e.event_name}</TableCell>
                            <TableCell className="text-xs truncate max-w-[150px]">{e.path}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {e.utm_source || '-'}
                            </TableCell>
                            <TableCell className="text-xs">{e.device_type || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Label>Período:</Label>
              <Tabs value={String(eventDays)} onValueChange={(v) => setEventDays(Number(v))}>
                <TabsList>
                  <TabsTrigger value="1">Hoje</TabsTrigger>
                  <TabsTrigger value="7">7 dias</TabsTrigger>
                  <TabsTrigger value="30">30 dias</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={downloadCSV}>
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Eventos de Pixel</h3>
                  <p className="text-sm text-muted-foreground">
                    Todos os disparos de pixel ({pixelEvents.length} eventos)
                  </p>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" /> Download CSV
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={downloadAnalyticsCSV}>
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                    <Eye className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="font-semibold">Page Views & UTMs</h3>
                  <p className="text-sm text-muted-foreground">
                    Visualizações, sessões, UTMs e origens
                  </p>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" /> Download CSV
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={async () => {
                toast.info('Exportando cliques...');
                const since = subDays(new Date(), eventDays).toISOString();
                const { data, error } = await supabase
                  .from('click_events')
                  .select('*')
                  .gte('created_at', since)
                  .order('created_at', { ascending: false })
                  .limit(5000);
                if (error) { toast.error('Erro'); return; }
                if (!data?.length) { toast.error('Nenhum dado'); return; }
                const headers = ['Data', 'Session ID', 'Página', 'X', 'Y', 'Elemento', 'Texto', 'Viewport W', 'Viewport H'];
                const rows = data.map((c: any) => [
                  format(new Date(c.created_at), 'dd/MM/yyyy HH:mm:ss'),
                  c.session_id, c.path, c.x, c.y, c.element_tag || '', (c.element_text || '').replace(/"/g, "'"),
                  c.viewport_width, c.viewport_height,
                ]);
                const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `clicks-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success('Cliques exportados!');
              }}>
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                    <ShoppingCart className="h-6 w-6 text-red-500" />
                  </div>
                  <h3 className="font-semibold">Mapa de Cliques</h3>
                  <p className="text-sm text-muted-foreground">
                    Todos os cliques rastreados
                  </p>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" /> Download CSV
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Google Ads Guide Tab */}
          <TabsContent value="google-ads-guide">
            <GoogleAdsGuide />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
