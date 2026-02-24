import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSiteSettings, useUpdateSiteSetting } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';
import {
  Save, Image, LayoutDashboard, Type, BarChart3, Megaphone,
  Plus, Trash2, GripVertical, ArrowUp, ArrowDown,
} from 'lucide-react';

interface HeroBanner {
  id: string;
  desktopImage: string;
  mobileImage: string;
  title: string;
  link: string;
  active: boolean;
}

interface MidBannerConfig {
  image: string;
  alt: string;
  link: string;
  active: boolean;
}

interface StatItem {
  icon: string;
  value: string;
  label: string;
}

interface CtaConfig {
  badge: string;
  title: string;
  titleHighlight: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  secondButtonText: string;
  secondButtonLink: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
}

interface HomepageConfig {
  heroBanners: HeroBanner[];
  midBanners: {
    ofertas: MidBannerConfig;
    chapeus: MidBannerConfig;
    selas: MidBannerConfig;
    jeans: MidBannerConfig;
  };
  stats: StatItem[];
  cta: CtaConfig;
  sections: {
    categorias: boolean;
    mantas: boolean;
    ofertas: boolean;
    chapeus: boolean;
    selas: boolean;
    jeans: boolean;
    cta: boolean;
    estatisticas: boolean;
    depoimentos: boolean;
  };
}

const defaultConfig: HomepageConfig = {
  heroBanners: [],
  midBanners: {
    ofertas: { image: '', alt: 'Ofertas Imperdíveis', link: '/produtos', active: true },
    chapeus: { image: '', alt: 'Chapéus Country', link: '/categoria/vestuario-chapeus', active: true },
    selas: { image: '', alt: 'Selas e Acessórios', link: '/categoria/selaria-selas-e-acessorios', active: true },
    jeans: { image: '', alt: 'Calças Jeans Country', link: '/categoria/vestuario-calcas', active: true },
  },
  stats: [
    { icon: 'Package', value: '1500+', label: 'Produtos Disponíveis' },
    { icon: 'Award', value: '10+', label: 'Anos de Experiência' },
    { icon: 'Leaf', value: '100%', label: 'Qualidade Garantida' },
    { icon: 'Timer', value: '24h', label: 'Atendimento Rápido' },
  ],
  cta: {
    badge: 'Oferta Especial',
    title: 'Tudo Para Sua',
    titleHighlight: 'Propriedade Rural',
    description: 'Encontre os melhores produtos agrícolas com preços imbatíveis. Qualidade garantida e entrega rápida para todo o Brasil.',
    buttonText: 'Ver Todos os Produtos',
    buttonLink: '/produtos',
    secondButtonText: 'Fale Conosco',
    secondButtonLink: '/contato',
    stat1Value: '500+', stat1Label: 'Produtos',
    stat2Value: '1000+', stat2Label: 'Clientes',
    stat3Value: '50+', stat3Label: 'Cidades',
  },
  sections: {
    categorias: true, mantas: true, ofertas: true, chapeus: true,
    selas: true, jeans: true, cta: true, estatisticas: true, depoimentos: true,
  },
};

export default function AdminHomepagePage() {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const [config, setConfig] = useState<HomepageConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?.homepage_config) {
      setConfig({ ...defaultConfig, ...settings.homepage_config as any });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSetting.mutateAsync({ key: 'homepage_config', value: config });
      toast.success('Homepage atualizada! Recarregue o site para ver as alterações.');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  // Hero banner helpers
  const addHeroBanner = () => {
    setConfig({
      ...config,
      heroBanners: [...config.heroBanners, {
        id: crypto.randomUUID(),
        desktopImage: '',
        mobileImage: '',
        title: '',
        link: '/produtos',
        active: true,
      }],
    });
  };

  const updateHeroBanner = (index: number, field: keyof HeroBanner, value: any) => {
    const updated = [...config.heroBanners];
    updated[index] = { ...updated[index], [field]: value };
    setConfig({ ...config, heroBanners: updated });
  };

  const removeHeroBanner = (index: number) => {
    setConfig({ ...config, heroBanners: config.heroBanners.filter((_, i) => i !== index) });
  };

  const moveHeroBanner = (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= config.heroBanners.length) return;
    const updated = [...config.heroBanners];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setConfig({ ...config, heroBanners: updated });
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
              <LayoutDashboard className="h-7 w-7" />
              Editor da Homepage
            </h1>
            <p className="text-muted-foreground">Edite banners, seções, textos e estatísticas da página inicial</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Tudo'}
          </Button>
        </div>

        <Tabs defaultValue="hero">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="hero"><Image className="h-4 w-4 mr-1" /> Carrossel</TabsTrigger>
            <TabsTrigger value="mid-banners"><Image className="h-4 w-4 mr-1" /> Banners Meio</TabsTrigger>
            <TabsTrigger value="cta"><Type className="h-4 w-4 mr-1" /> CTA</TabsTrigger>
            <TabsTrigger value="stats"><BarChart3 className="h-4 w-4 mr-1" /> Estatísticas</TabsTrigger>
            <TabsTrigger value="sections"><Megaphone className="h-4 w-4 mr-1" /> Seções</TabsTrigger>
          </TabsList>

          {/* HERO BANNERS */}
          <TabsContent value="hero" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Banners do Carrossel Principal</h3>
                <p className="text-xs text-muted-foreground">Se vazio, os banners padrão do código serão usados</p>
              </div>
              <Button onClick={addHeroBanner} size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Adicionar Banner
              </Button>
            </div>

            {config.heroBanners.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum banner customizado. Os banners padrão do código serão usados.
                </CardContent>
              </Card>
            )}

            {config.heroBanners.map((banner, index) => (
              <Card key={banner.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">Banner {index + 1}</span>
                      <Switch
                        checked={banner.active}
                        onCheckedChange={(v) => updateHeroBanner(index, 'active', v)}
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveHeroBanner(index, -1)} disabled={index === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveHeroBanner(index, 1)} disabled={index === config.heroBanners.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeHeroBanner(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Imagem Desktop (URL)</Label>
                      <Input
                        value={banner.desktopImage}
                        onChange={(e) => updateHeroBanner(index, 'desktopImage', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Imagem Mobile (URL)</Label>
                      <Input
                        value={banner.mobileImage}
                        onChange={(e) => updateHeroBanner(index, 'mobileImage', e.target.value)}
                        placeholder="https://... (se vazio, usa a desktop)"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Título (alt text)</Label>
                      <Input
                        value={banner.title}
                        onChange={(e) => updateHeroBanner(index, 'title', e.target.value)}
                        placeholder="Descrição do banner"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Link</Label>
                      <Input
                        value={banner.link}
                        onChange={(e) => updateHeroBanner(index, 'link', e.target.value)}
                        placeholder="/produtos"
                      />
                    </div>
                  </div>
                  {banner.desktopImage && (
                    <img src={banner.desktopImage} alt={banner.title} className="w-full h-24 object-cover rounded-lg border" />
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* MID BANNERS */}
          <TabsContent value="mid-banners" className="space-y-4">
            <p className="text-sm text-muted-foreground">Banners que aparecem entre as seções de produtos. Se a URL da imagem estiver vazia, o banner padrão do código será usado.</p>
            {Object.entries(config.midBanners).map(([key, banner]) => (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm capitalize">{key === 'ofertas' ? 'Ofertas' : key === 'chapeus' ? 'Chapéus' : key === 'selas' ? 'Selas' : 'Jeans'}</CardTitle>
                    <Switch
                      checked={banner.active}
                      onCheckedChange={(v) => setConfig({
                        ...config,
                        midBanners: { ...config.midBanners, [key]: { ...banner, active: v } },
                      })}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Imagem (URL)</Label>
                      <Input
                        value={banner.image}
                        onChange={(e) => setConfig({
                          ...config,
                          midBanners: { ...config.midBanners, [key]: { ...banner, image: e.target.value } },
                        })}
                        placeholder="https://... (vazio = padrão)"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Alt Text</Label>
                      <Input
                        value={banner.alt}
                        onChange={(e) => setConfig({
                          ...config,
                          midBanners: { ...config.midBanners, [key]: { ...banner, alt: e.target.value } },
                        })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Link</Label>
                      <Input
                        value={banner.link}
                        onChange={(e) => setConfig({
                          ...config,
                          midBanners: { ...config.midBanners, [key]: { ...banner, link: e.target.value } },
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* CTA */}
          <TabsContent value="cta" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Seção CTA (Call to Action)</CardTitle>
                <CardDescription>Textos e links da seção de destaque</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Badge</Label>
                    <Input value={config.cta.badge} onChange={(e) => setConfig({ ...config, cta: { ...config.cta, badge: e.target.value } })} />
                  </div>
                  <div>
                    <Label>Título</Label>
                    <Input value={config.cta.title} onChange={(e) => setConfig({ ...config, cta: { ...config.cta, title: e.target.value } })} />
                  </div>
                  <div>
                    <Label>Destaque do Título (colorido)</Label>
                    <Input value={config.cta.titleHighlight} onChange={(e) => setConfig({ ...config, cta: { ...config.cta, titleHighlight: e.target.value } })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Descrição</Label>
                    <Textarea value={config.cta.description} onChange={(e) => setConfig({ ...config, cta: { ...config.cta, description: e.target.value } })} rows={2} />
                  </div>
                  <div>
                    <Label>Botão Principal</Label>
                    <Input value={config.cta.buttonText} onChange={(e) => setConfig({ ...config, cta: { ...config.cta, buttonText: e.target.value } })} />
                  </div>
                  <div>
                    <Label>Link do Botão</Label>
                    <Input value={config.cta.buttonLink} onChange={(e) => setConfig({ ...config, cta: { ...config.cta, buttonLink: e.target.value } })} />
                  </div>
                  <div>
                    <Label>Botão Secundário</Label>
                    <Input value={config.cta.secondButtonText} onChange={(e) => setConfig({ ...config, cta: { ...config.cta, secondButtonText: e.target.value } })} />
                  </div>
                  <div>
                    <Label>Link Secundário</Label>
                    <Input value={config.cta.secondButtonLink} onChange={(e) => setConfig({ ...config, cta: { ...config.cta, secondButtonLink: e.target.value } })} />
                  </div>
                </div>
                <div className="border-t pt-4">
                  <Label className="mb-2 block">Mini Estatísticas do CTA</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="space-y-2">
                        <Input
                          value={(config.cta as any)[`stat${n}Value`]}
                          onChange={(e) => setConfig({ ...config, cta: { ...config.cta, [`stat${n}Value`]: e.target.value } })}
                          placeholder="Valor"
                        />
                        <Input
                          value={(config.cta as any)[`stat${n}Label`]}
                          onChange={(e) => setConfig({ ...config, cta: { ...config.cta, [`stat${n}Label`]: e.target.value } })}
                          placeholder="Label"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STATS */}
          <TabsContent value="stats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas da Homepage</CardTitle>
                <CardDescription>Os 4 números exibidos na seção de estatísticas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {config.stats.map((stat, i) => (
                    <div key={i} className="p-4 border rounded-lg space-y-2">
                      <Label className="text-xs">Ícone ({stat.icon})</Label>
                      <Input
                        value={stat.icon}
                        onChange={(e) => {
                          const updated = [...config.stats];
                          updated[i] = { ...stat, icon: e.target.value };
                          setConfig({ ...config, stats: updated });
                        }}
                        placeholder="Package, Award, Leaf, Timer"
                      />
                      <Label className="text-xs">Valor</Label>
                      <Input
                        value={stat.value}
                        onChange={(e) => {
                          const updated = [...config.stats];
                          updated[i] = { ...stat, value: e.target.value };
                          setConfig({ ...config, stats: updated });
                        }}
                        placeholder="1500+"
                      />
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={stat.label}
                        onChange={(e) => {
                          const updated = [...config.stats];
                          updated[i] = { ...stat, label: e.target.value };
                          setConfig({ ...config, stats: updated });
                        }}
                        placeholder="Produtos Disponíveis"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECTIONS TOGGLE */}
          <TabsContent value="sections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Seções Visíveis</CardTitle>
                <CardDescription>Ative ou desative seções inteiras da homepage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { key: 'categorias', label: 'Categorias em Destaque' },
                    { key: 'mantas', label: 'Seção de Mantas' },
                    { key: 'ofertas', label: 'Ofertas / Promoções' },
                    { key: 'chapeus', label: 'Chapéus' },
                    { key: 'selas', label: 'Selas e Acessórios' },
                    { key: 'jeans', label: 'Calças Jeans' },
                    { key: 'cta', label: 'Banner CTA (Call to Action)' },
                    { key: 'estatisticas', label: 'Estatísticas' },
                    { key: 'depoimentos', label: 'Depoimentos' },
                  ].map((section) => (
                    <div key={section.key} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium text-sm">{section.label}</span>
                      <Switch
                        checked={config.sections[section.key as keyof typeof config.sections]}
                        onCheckedChange={(v) => setConfig({
                          ...config,
                          sections: { ...config.sections, [section.key]: v },
                        })}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Todas as Configurações'}
        </Button>
      </div>
    </AdminLayout>
  );
}
