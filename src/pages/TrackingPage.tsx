import { useState } from 'react';
import { Package, Truck, MapPin, CheckCircle2, Search, Clock, Box, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface OrderData {
  id: string;
  customer_name: string;
  customer_city: string | null;
  tracking_code: string | null;
  status: string;
  total: number;
  created_at: string;
}

const getTrackingSteps = (city: string | null) => {
  const customerCity = city || 'sua cidade';
  return [
    { day: 0, title: 'Pedido Confirmado', description: 'Seu pedido foi recebido e confirmado.', icon: CheckCircle2 },
    { day: 1, title: 'Pagamento Aprovado', description: 'Pagamento processado com sucesso.', icon: CheckCircle2 },
    { day: 2, title: 'Preparando Pedido', description: 'Seu pedido está sendo separado no estoque em São Paulo - SP.', icon: Box },
    { day: 3, title: 'Embalagem Concluída', description: 'Produtos embalados e prontos para envio. Centro de Distribuição São Paulo - SP.', icon: Package },
    { day: 4, title: 'Coletado pela Transportadora', description: 'O pacote foi coletado em São Paulo - SP e está a caminho.', icon: Truck },
    { day: 5, title: 'Em Trânsito', description: 'Pacote saiu do centro de distribuição de São Paulo - SP.', icon: Truck },
    { day: 6, title: 'Em Trânsito - Rodovia', description: 'Pacote em deslocamento para o estado de destino.', icon: MapPin },
    { day: 7, title: 'Chegou ao Estado de Destino', description: `Pacote chegou ao centro de distribuição próximo a ${customerCity}.`, icon: MapPin },
    { day: 8, title: 'Em Rota de Entrega', description: `Pacote saiu para entrega em ${customerCity}.`, icon: Truck },
    { day: 9, title: '1ª Tentativa de Entrega', description: `Tentativa de entrega em ${customerCity} não foi bem-sucedida. Destinatário ausente.`, icon: Clock },
    { day: 10, title: 'Em Rota de Entrega', description: `Nova tentativa de entrega programada para ${customerCity}.`, icon: Truck },
    { day: 11, title: '2ª Tentativa de Entrega', description: `Segunda tentativa de entrega em ${customerCity} não foi bem-sucedida. Endereço com dificuldade de acesso.`, icon: Clock },
    { day: 12, title: '3ª Tentativa de Entrega', description: `Terceira tentativa de entrega em ${customerCity}. Aguardando contato com destinatário.`, icon: Clock },
    { day: 13, title: 'Entregue ao Destinatário', description: `Pacote entregue com sucesso em ${customerCity}!`, icon: CheckCircle2 },
  ];
};

export default function TrackingPage() {
  const [searchCode, setSearchCode] = useState('');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchCode.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      // Search by tracking code or order ID prefix
      const cleanCode = searchCode.trim().toUpperCase();
      
      // First try tracking_code exact match
      let { data, error: fetchError } = await supabase
        .from('orders')
        .select('id, customer_name, customer_city, tracking_code, status, total, created_at')
        .eq('tracking_code', cleanCode)
        .limit(1)
        .single();

      // If not found, try matching order ID (full or partial UUID)
      if (fetchError || !data) {
        const lowerCode = cleanCode.toLowerCase();
        const { data: idData, error: idError } = await supabase
          .from('orders')
          .select('id, customer_name, customer_city, tracking_code, status, total, created_at')
          .filter('id::text', 'ilike', `${lowerCode}%`)
          .limit(1)
          .single();
        data = idData;
        fetchError = idError;
      }

      if (fetchError || !data) {
        setError('Pedido não encontrado. Verifique o código e tente novamente.');
        return;
      }

      setOrder(data as OrderData);
    } catch {
      setError('Erro ao buscar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getVisibleSteps = (createdAt: string, city: string | null) => {
    const orderDate = new Date(createdAt);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    const steps = getTrackingSteps(city);
    return steps.filter(step => step.day <= daysPassed);
  };

  const trackingSteps = order ? getTrackingSteps(order.customer_city) : [];
  const visibleSteps = order ? getVisibleSteps(order.created_at, order.customer_city) : [];
  const isDelivered = visibleSteps.length === trackingSteps.length;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Rastreie seu Pedido</h1>
          <p className="text-muted-foreground">
            Acompanhe o status da sua entrega em tempo real
          </p>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Digite o código do pedido ou rastreio"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading} className="gap-2">
                <Search className="h-4 w-4" />
                {loading ? 'Buscando...' : 'Rastrear'}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </CardContent>
        </Card>

        {/* Results */}
        {order && (
          <>
            {/* Order Info */}
            <Card className="border-0 shadow-lg mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Pedido #{order.id.slice(0, 8).toUpperCase()}</span>
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    isDelivered 
                      ? 'bg-success/10 text-success' 
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {isDelivered ? 'Entregue' : 'Em andamento'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium text-primary">{formatCurrency(Number(order.total))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data do pedido:</span>
                  <span>{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                {order.tracking_code && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Código de rastreio:</span>
                    <span className="font-mono font-medium">{order.tracking_code}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Histórico de Rastreio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {visibleSteps.map((step, index) => {
                    const isLast = index === visibleSteps.length - 1;
                    const stepDate = new Date(order.created_at);
                    stepDate.setDate(stepDate.getDate() + step.day);
                    const StepIcon = step.icon;

                    return (
                      <div key={step.day} className="flex gap-4">
                        {/* Timeline line */}
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isLast 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-primary/10 text-primary'
                          }`}>
                            <StepIcon className="h-4 w-4" />
                          </div>
                          {index < visibleSteps.length - 1 && (
                            <div className="w-0.5 h-full min-h-[40px] bg-primary/20" />
                          )}
                        </div>

                        {/* Content */}
                        <div className={`pb-6 ${isLast ? '' : ''}`}>
                          <p className={`font-medium text-sm ${isLast ? 'text-primary' : 'text-foreground'}`}>
                            {step.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {step.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {stepDate.toLocaleDateString('pt-BR')} às {stepDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!isDelivered && (
                  <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                    <p className="text-xs text-warning">
                      📦 Próxima atualização prevista para amanhã. Acompanhe diariamente!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
