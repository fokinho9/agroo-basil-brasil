import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSiteSettings, useUpdateSiteSetting } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();

  const [formData, setFormData] = useState({
    site_name: '',
    site_description: '',
    whatsapp_number: '',
    whatsapp_message: '',
    pix_key: '',
    reclame_enabled: true,
    reclame_link: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        site_name: settings.site_name || '',
        site_description: settings.site_description || '',
        whatsapp_number: settings.whatsapp?.number || '',
        whatsapp_message: settings.whatsapp?.message || '',
        pix_key: settings.pix_key || '',
        reclame_enabled: settings.reclame_aqui?.enabled !== false,
        reclame_link: settings.reclame_aqui?.link || 'https://reclameaqui.com.br',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: 'site_name', value: formData.site_name }),
        updateSetting.mutateAsync({ key: 'site_description', value: formData.site_description }),
        updateSetting.mutateAsync({
          key: 'whatsapp',
          value: {
            number: formData.whatsapp_number,
            message: formData.whatsapp_message,
          },
        }),
        updateSetting.mutateAsync({ key: 'pix_key', value: formData.pix_key }),
        updateSetting.mutateAsync({
          key: 'reclame_aqui',
          value: {
            enabled: formData.reclame_enabled,
            link: formData.reclame_link,
          },
        }),
      ]);
      toast.success('Configurações salvas!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações gerais do site</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Site</CardTitle>
            <CardDescription>Nome e descrição exibidos no site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="site_name">Nome do Site</Label>
              <Input
                id="site_name"
                value={formData.site_name}
                onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                placeholder="AgroShop"
              />
            </div>
            <div>
              <Label htmlFor="site_description">Descrição</Label>
              <Input
                id="site_description"
                value={formData.site_description}
                onChange={(e) => setFormData({ ...formData, site_description: e.target.value })}
                placeholder="Os melhores produtos agrícolas"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WhatsApp</CardTitle>
            <CardDescription>Configurações do botão de WhatsApp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="whatsapp_number">Número do WhatsApp</Label>
              <Input
                id="whatsapp_number"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                placeholder="5511999999999"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formato: código do país + DDD + número (sem espaços ou caracteres especiais)
              </p>
            </div>
            <div>
              <Label htmlFor="whatsapp_message">Mensagem Padrão</Label>
              <Input
                id="whatsapp_message"
                value={formData.whatsapp_message}
                onChange={(e) => setFormData({ ...formData, whatsapp_message: e.target.value })}
                placeholder="Olá! Vim do site e gostaria de mais informações."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagamento</CardTitle>
            <CardDescription>Configurações de pagamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pix_key">Chave PIX</Label>
              <Input
                id="pix_key"
                value={formData.pix_key}
                onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                placeholder="seu-pix@email.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Pode ser CPF, CNPJ, e-mail, telefone ou chave aleatória
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reclame Aqui</CardTitle>
            <CardDescription>Banner de selo do Reclame Aqui nas páginas de produto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="reclame_enabled">Exibir banner do Reclame Aqui</Label>
              <Switch
                id="reclame_enabled"
                checked={formData.reclame_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, reclame_enabled: checked })}
              />
            </div>
            {formData.reclame_enabled && (
              <div>
                <Label htmlFor="reclame_link">Link do perfil</Label>
                <Input
                  id="reclame_link"
                  value={formData.reclame_link}
                  onChange={(e) => setFormData({ ...formData, reclame_link: e.target.value })}
                  placeholder="https://reclameaqui.com.br/empresa/sua-loja"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL completa do perfil da sua loja no Reclame Aqui
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          className="w-full gap-2"
          disabled={updateSetting.isPending}
        >
          <Save className="h-4 w-4" />
          {updateSetting.isPending ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </AdminLayout>
  );
}
