import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings, useUpdateSiteSetting } from '@/hooks/useSiteSettings';
import {
  Ticket, Image, Brain, Megaphone, Plus, Trash2, Pencil, Gift,
  Timer, Users, Mail, TrendingUp, ShoppingBag,
} from 'lucide-react';
import QuizManager from '@/components/admin/QuizManager';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

// ---- Hooks ----

function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

function usePopupBanners() {
  return useQuery({
    queryKey: ['popup-banners'],
    queryFn: async () => {
      const { data, error } = await supabase.from('popup_banners').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

function useEmailCaptures() {
  return useQuery({
    queryKey: ['email-captures'],
    queryFn: async () => {
      const { data, error } = await supabase.from('email_captures').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data || [];
    },
  });
}

// ---- Main ----

export default function AdminMarketingPage() {
  const queryClient = useQueryClient();
  const { data: coupons = [] } = useCoupons();
  const { data: popups = [] } = usePopupBanners();
  const { data: captures = [] } = useEmailCaptures();
  const { data: settings } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();

  // Settings
  const freeShippingMin = (settings?.free_shipping_min as any)?.value || 0;
  const socialProofEnabled = (settings?.social_proof_enabled as any)?.value ?? false;
  const countdownEnd = (settings?.countdown_end as any)?.value || '';
  const countdownText = (settings?.countdown_text as any)?.value || '';

  // Coupon dialog
  const [couponDialog, setCouponDialog] = useState(false);
  const [editCoupon, setEditCoupon] = useState<any>(null);
  const [couponForm, setCouponForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', min_purchase: '', max_uses: '', expires_at: '', active: true });

  // Popup dialog
  const [popupDialog, setPopupDialog] = useState(false);
  const [popupForm, setPopupForm] = useState({ title: '', description: '', image_url: '', button_text: 'Ver Oferta', button_link: '/produtos', popup_type: 'banner', delay_seconds: '3', show_once: true, active: false });

  const resetCouponForm = () => {
    setCouponForm({ code: '', discount_type: 'percentage', discount_value: '', min_purchase: '', max_uses: '', expires_at: '', active: true });
    setEditCoupon(null);
  };

  const saveCoupon = useMutation({
    mutationFn: async () => {
      const data = {
        code: couponForm.code.toUpperCase().trim(),
        discount_type: couponForm.discount_type,
        discount_value: parseFloat(couponForm.discount_value) || 0,
        min_purchase: parseFloat(couponForm.min_purchase) || 0,
        max_uses: couponForm.max_uses ? parseInt(couponForm.max_uses) : null,
        expires_at: couponForm.expires_at || null,
        active: couponForm.active,
      };
      if (editCoupon) {
        const { error } = await supabase.from('coupons').update(data).eq('id', editCoupon.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('coupons').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setCouponDialog(false);
      resetCouponForm();
      toast.success(editCoupon ? 'Cupom atualizado!' : 'Cupom criado!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCoupon = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coupons'] }); toast.success('Cupom excluído'); },
  });

  const toggleCoupon = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('coupons').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  });

  const savePopup = useMutation({
    mutationFn: async () => {
      const data = {
        title: popupForm.title, description: popupForm.description,
        image_url: popupForm.image_url || null, button_text: popupForm.button_text,
        button_link: popupForm.button_link, popup_type: popupForm.popup_type,
        delay_seconds: parseInt(popupForm.delay_seconds) || 3,
        show_once: popupForm.show_once, active: popupForm.active,
      };
      const { error } = await supabase.from('popup_banners').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popup-banners'] });
      setPopupDialog(false);
      toast.success('Popup criado!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePopup = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('popup_banners').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['popup-banners'] }),
  });

  const deletePopup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('popup_banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['popup-banners'] }); toast.success('Popup excluído'); },
  });

  const handleSaveSetting = (key: string, value: any) => {
    updateSetting.mutate({ key, value: { value } }, {
      onSuccess: () => toast.success('Configuração salva!'),
      onError: () => toast.error('Erro ao salvar'),
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Marketing</h1>
          <p className="text-muted-foreground">Cupons, popups, promoções e ferramentas de conversão</p>
        </div>

        <Tabs defaultValue="coupons">
          <TabsList className="w-full justify-start flex-wrap">
            <TabsTrigger value="coupons" className="gap-2"><Ticket className="h-4 w-4" /> Cupons</TabsTrigger>
            <TabsTrigger value="popups" className="gap-2"><Image className="h-4 w-4" /> Popups</TabsTrigger>
            <TabsTrigger value="shipping" className="gap-2"><ShoppingBag className="h-4 w-4" /> Frete Grátis</TabsTrigger>
            <TabsTrigger value="countdown" className="gap-2"><Timer className="h-4 w-4" /> Countdown</TabsTrigger>
            <TabsTrigger value="social" className="gap-2"><Users className="h-4 w-4" /> Social Proof</TabsTrigger>
            <TabsTrigger value="leads" className="gap-2"><Mail className="h-4 w-4" /> Leads</TabsTrigger>
            <TabsTrigger value="quizzes" className="gap-2"><Brain className="h-4 w-4" /> Quizzes</TabsTrigger>
          </TabsList>

          {/* COUPONS */}
          <TabsContent value="coupons" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Cupons de Desconto</h3>
              <Button onClick={() => { resetCouponForm(); setCouponDialog(true); }} className="gap-2" size="sm">
                <Plus className="h-4 w-4" /> Novo Cupom
              </Button>
            </div>

            {coupons.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum cupom criado ainda</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {coupons.map((c: any) => (
                  <Card key={c.id}>
                    <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="font-mono text-base">{c.code}</Badge>
                          {!c.active && <Badge variant="outline" className="text-xs">Inativo</Badge>}
                          {c.expires_at && new Date(c.expires_at) < new Date() && <Badge variant="destructive" className="text-xs">Expirado</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {c.discount_type === 'percentage' ? `${c.discount_value}% de desconto` : `R$ ${Number(c.discount_value).toFixed(2)} de desconto`}
                          {c.min_purchase > 0 && ` • Mínimo R$ ${Number(c.min_purchase).toFixed(2)}`}
                          {c.max_uses && ` • ${c.used_count}/${c.max_uses} usos`}
                          {c.expires_at && ` • Expira: ${format(new Date(c.expires_at), 'dd/MM/yyyy', { locale: ptBR })}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={c.active} onCheckedChange={(active) => toggleCoupon.mutate({ id: c.id, active })} />
                        <Button variant="ghost" size="icon" onClick={() => {
                          setEditCoupon(c);
                          setCouponForm({
                            code: c.code, discount_type: c.discount_type,
                            discount_value: String(c.discount_value), min_purchase: String(c.min_purchase || ''),
                            max_uses: c.max_uses ? String(c.max_uses) : '', expires_at: c.expires_at ? c.expires_at.split('T')[0] : '',
                            active: c.active,
                          });
                          setCouponDialog(true);
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCoupon.mutate(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* POPUPS */}
          <TabsContent value="popups" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Popups do Site</h3>
              <Button onClick={() => { setPopupForm({ title: '', description: '', image_url: '', button_text: 'Ver Oferta', button_link: '/produtos', popup_type: 'banner', delay_seconds: '3', show_once: true, active: false }); setPopupDialog(true); }} className="gap-2" size="sm">
                <Plus className="h-4 w-4" /> Novo Popup
              </Button>
            </div>

            {popups.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum popup criado. Crie popups com banners, captura de email ou countdown.</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {popups.map((p: any) => (
                  <Card key={p.id}>
                    <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                      {p.image_url && <img src={p.image_url} alt="" className="w-16 h-16 rounded object-cover" />}
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{p.title || 'Sem título'}</span>
                          <Badge variant="outline" className="text-xs">{p.popup_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{p.description || '-'} • Delay: {p.delay_seconds}s</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={p.active} onCheckedChange={(active) => togglePopup.mutate({ id: p.id, active })} />
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deletePopup.mutate(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* FREE SHIPPING BAR */}
          <TabsContent value="shipping" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> Barra de Frete Grátis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Mostra uma barra no topo do site indicando quanto falta para frete grátis.</p>
                <div>
                  <Label>Valor mínimo para frete grátis (R$)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      defaultValue={freeShippingMin}
                      id="free-shipping-min"
                      placeholder="Ex: 199.90"
                    />
                    <Button onClick={() => {
                      const val = parseFloat((document.getElementById('free-shipping-min') as HTMLInputElement).value) || 0;
                      handleSaveSetting('free_shipping_min', val);
                    }}>Salvar</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Coloque 0 para desativar a barra.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* COUNTDOWN */}
          <TabsContent value="countdown" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5" /> Countdown de Urgência</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Mostra um timer regressivo no topo do site para criar urgência.</p>
                <div>
                  <Label>Texto da promoção</Label>
                  <Input
                    defaultValue={countdownText}
                    id="countdown-text"
                    placeholder="Ex: Oferta relâmpago! Desconto de 20%"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Data/hora de encerramento</Label>
                  <Input
                    type="datetime-local"
                    defaultValue={countdownEnd}
                    id="countdown-end"
                    className="mt-1"
                  />
                </div>
                <Button onClick={() => {
                  const text = (document.getElementById('countdown-text') as HTMLInputElement).value;
                  const end = (document.getElementById('countdown-end') as HTMLInputElement).value;
                  handleSaveSetting('countdown_text', text);
                  handleSaveSetting('countdown_end', end);
                }}>Salvar</Button>
                <p className="text-xs text-muted-foreground">Deixe a data vazia para desativar o countdown.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SOCIAL PROOF */}
          <TabsContent value="social" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Social Proof</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Mostra notificações de "Fulano de SP comprou X agora" baseado em pedidos recentes reais.</p>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={socialProofEnabled}
                    onCheckedChange={(checked) => handleSaveSetting('social_proof_enabled', checked)}
                  />
                  <Label>Ativar Social Proof</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LEADS */}
          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Leads Capturados ({captures.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {captures.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Nenhum lead capturado ainda. Ative um popup de captura de email.</p>
                ) : (
                  <div className="space-y-2">
                    {captures.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div>
                          {c.name && <span className="text-sm font-medium mr-2">{c.name}</span>}
                          {c.email && <span className="text-sm text-muted-foreground mr-2">{c.email}</span>}
                          {c.phone && <span className="text-sm text-muted-foreground">{c.phone}</span>}
                        </div>
                        <span className="text-xs text-muted-foreground">{format(new Date(c.created_at), 'dd/MM HH:mm', { locale: ptBR })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* QUIZZES */}
          <TabsContent value="quizzes">
            <QuizManager />
          </TabsContent>
        </Tabs>
      </div>

      {/* Coupon Dialog */}
      <Dialog open={couponDialog} onOpenChange={setCouponDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editCoupon ? 'Editar Cupom' : 'Novo Cupom'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Código do Cupom</Label>
              <Input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="Ex: DESCONTO10" className="mt-1 font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Desconto</Label>
                <Select value={couponForm.discount_type} onValueChange={(v) => setCouponForm({ ...couponForm, discount_type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor do Desconto</Label>
                <Input type="number" value={couponForm.discount_value} onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })} placeholder={couponForm.discount_type === 'percentage' ? 'Ex: 10' : 'Ex: 25.00'} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Compra Mínima (R$)</Label>
                <Input type="number" value={couponForm.min_purchase} onChange={(e) => setCouponForm({ ...couponForm, min_purchase: e.target.value })} placeholder="0 = sem mínimo" className="mt-1" />
              </div>
              <div>
                <Label>Limite de Usos</Label>
                <Input type="number" value={couponForm.max_uses} onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value })} placeholder="Vazio = ilimitado" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Data de Expiração</Label>
              <Input type="date" value={couponForm.expires_at} onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })} className="mt-1" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={couponForm.active} onCheckedChange={(active) => setCouponForm({ ...couponForm, active })} />
              <Label>Ativo</Label>
            </div>
            <Button className="w-full" onClick={() => saveCoupon.mutate()} disabled={saveCoupon.isPending}>
              {editCoupon ? 'Salvar' : 'Criar Cupom'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup Dialog */}
      <Dialog open={popupDialog} onOpenChange={setPopupDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Popup</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={popupForm.popup_type} onValueChange={(v) => setPopupForm({ ...popupForm, popup_type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">Banner com Imagem</SelectItem>
                  <SelectItem value="email_capture">Captura de Email</SelectItem>
                  <SelectItem value="countdown">Countdown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título</Label>
              <Input value={popupForm.title} onChange={(e) => setPopupForm({ ...popupForm, title: e.target.value })} placeholder="Ex: Oferta Especial!" className="mt-1" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={popupForm.description} onChange={(e) => setPopupForm({ ...popupForm, description: e.target.value })} placeholder="Texto do popup" className="mt-1" rows={2} />
            </div>
            {popupForm.popup_type === 'banner' && (
              <div>
                <Label>URL da Imagem</Label>
                <Input value={popupForm.image_url} onChange={(e) => setPopupForm({ ...popupForm, image_url: e.target.value })} placeholder="https://..." className="mt-1" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Texto do Botão</Label>
                <Input value={popupForm.button_text} onChange={(e) => setPopupForm({ ...popupForm, button_text: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Link do Botão</Label>
                <Input value={popupForm.button_link} onChange={(e) => setPopupForm({ ...popupForm, button_link: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Delay (segundos)</Label>
                <Input type="number" value={popupForm.delay_seconds} onChange={(e) => setPopupForm({ ...popupForm, delay_seconds: e.target.value })} className="mt-1" />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={popupForm.show_once} onCheckedChange={(v) => setPopupForm({ ...popupForm, show_once: v })} />
                <Label>Mostrar só 1 vez</Label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={popupForm.active} onCheckedChange={(v) => setPopupForm({ ...popupForm, active: v })} />
              <Label>Ativar imediatamente</Label>
            </div>
            <Button className="w-full" onClick={() => savePopup.mutate()} disabled={savePopup.isPending}>Criar Popup</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
