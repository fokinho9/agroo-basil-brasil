import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSiteSettings, useUpdateSiteSetting } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';
import { Save, Search, Globe } from 'lucide-react';

interface PageSeo {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
}

const defaultPages: { key: string; label: string; path: string }[] = [
  { key: 'home', label: 'Página Inicial', path: '/' },
  { key: 'products', label: 'Listagem de Produtos', path: '/produtos' },
  { key: 'about', label: 'Sobre Nós', path: '/sobre' },
  { key: 'contact', label: 'Contato', path: '/contato' },
  { key: 'faq', label: 'FAQ', path: '/faq' },
  { key: 'returns', label: 'Trocas e Devoluções', path: '/trocas' },
  { key: 'terms', label: 'Termos de Uso', path: '/termos' },
  { key: 'privacy', label: 'Política de Privacidade', path: '/privacidade' },
  { key: 'tracking', label: 'Rastrear Pedido', path: '/rastreio' },
];

export default function AdminSeoPage() {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();

  const [seoData, setSeoData] = useState<Record<string, PageSeo>>({});
  const [globalSeo, setGlobalSeo] = useState({
    siteName: 'Agro Brasil',
    defaultOgImage: '',
    gscVerification: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      const loaded = settings.seo_pages || {};
      const data: Record<string, PageSeo> = {};
      defaultPages.forEach((p) => {
        data[p.key] = loaded[p.key] || { title: '', description: '', keywords: '', ogImage: '' };
      });
      setSeoData(data);
      setGlobalSeo({
        siteName: settings.seo_site_name || 'Agro Brasil',
        defaultOgImage: settings.seo_default_og_image || '',
        gscVerification: settings.seo_gsc_verification || '',
      });
    }
  }, [settings]);

  const updatePage = (key: string, field: keyof PageSeo, value: string) => {
    setSeoData((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: 'seo_pages', value: seoData }),
        updateSetting.mutateAsync({ key: 'seo_site_name', value: globalSeo.siteName }),
        updateSetting.mutateAsync({ key: 'seo_default_og_image', value: globalSeo.defaultOgImage }),
        updateSetting.mutateAsync({ key: 'seo_gsc_verification', value: globalSeo.gscVerification }),
      ]);
      toast.success('Configurações de SEO salvas!');
    } catch {
      toast.error('Erro ao salvar configurações de SEO');
    } finally {
      setSaving(false);
    }
  };

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
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Search className="h-7 w-7" />
              SEO & Indexação
            </h1>
            <p className="text-muted-foreground">Gerencie as metatags de cada página para melhorar o posicionamento no Google</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Tudo'}
          </Button>
        </div>

        {/* Global SEO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Configurações Globais
            </CardTitle>
            <CardDescription>Configurações que afetam todo o site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome do Site (aparece no título)</Label>
              <Input
                value={globalSeo.siteName}
                onChange={(e) => setGlobalSeo({ ...globalSeo, siteName: e.target.value })}
                placeholder="Agro Brasil"
              />
              <p className="text-xs text-muted-foreground mt-1">Ex: "Título da Página | Nome do Site"</p>
            </div>
            <div>
              <Label>Imagem OG padrão (URL)</Label>
              <Input
                value={globalSeo.defaultOgImage}
                onChange={(e) => setGlobalSeo({ ...globalSeo, defaultOgImage: e.target.value })}
                placeholder="https://seudominio.com.br/og-image.png"
              />
              <p className="text-xs text-muted-foreground mt-1">Imagem exibida ao compartilhar links sem imagem específica</p>
            </div>
            <div>
              <Label>Google Search Console (verificação)</Label>
              <Input
                value={globalSeo.gscVerification}
                onChange={(e) => setGlobalSeo({ ...globalSeo, gscVerification: e.target.value })}
                placeholder="Cole o código de verificação do GSC"
              />
              <p className="text-xs text-muted-foreground mt-1">Meta tag google-site-verification</p>
            </div>
          </CardContent>
        </Card>

        {/* Per-page SEO */}
        <Card>
          <CardHeader>
            <CardTitle>SEO por Página</CardTitle>
            <CardDescription>Defina título, descrição e keywords para cada página. Se vazio, o padrão definido no código será usado.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="home">
              <TabsList className="flex flex-wrap h-auto gap-1 mb-6">
                {defaultPages.map((p) => (
                  <TabsTrigger key={p.key} value={p.key} className="text-xs">
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {defaultPages.map((page) => (
                <TabsContent key={page.key} value={page.key} className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Rota: <code className="bg-muted px-2 py-0.5 rounded">{page.path}</code>
                  </p>
                  <div>
                    <Label>Título (max 60 caracteres)</Label>
                    <Input
                      value={seoData[page.key]?.title || ''}
                      onChange={(e) => updatePage(page.key, 'title', e.target.value)}
                      placeholder="Título da página"
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {(seoData[page.key]?.title || '').length}/60 caracteres
                    </p>
                  </div>
                  <div>
                    <Label>Descrição (max 160 caracteres)</Label>
                    <Textarea
                      value={seoData[page.key]?.description || ''}
                      onChange={(e) => updatePage(page.key, 'description', e.target.value)}
                      placeholder="Descrição para mecanismos de busca"
                      maxLength={160}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {(seoData[page.key]?.description || '').length}/160 caracteres
                    </p>
                  </div>
                  <div>
                    <Label>Keywords (separadas por vírgula)</Label>
                    <Input
                      value={seoData[page.key]?.keywords || ''}
                      onChange={(e) => updatePage(page.key, 'keywords', e.target.value)}
                      placeholder="selaria, mantas, vestuário country"
                    />
                  </div>
                  <div>
                    <Label>Imagem OG (URL - opcional)</Label>
                    <Input
                      value={seoData[page.key]?.ogImage || ''}
                      onChange={(e) => updatePage(page.key, 'ogImage', e.target.value)}
                      placeholder="URL da imagem para compartilhamento"
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Todas as Configurações de SEO'}
        </Button>
      </div>
    </AdminLayout>
  );
}
