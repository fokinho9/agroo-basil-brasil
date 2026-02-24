import { Seo } from '@/components/seo/Seo';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, MapPin, CheckCircle, Search, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import logoImg from '@/assets/logo-agro-brasil.png';

interface OrderData {
  id: string;
  customer_name: string;
  customer_city: string | null;
  customer_state: string | null;
  customer_address: string | null;
  customer_cep: string | null;
  tracking_code: string | null;
  status: string;
  total: number;
  created_at: string;
}

interface TrackingStep {
  day: number;
  title: string;
  description: string;
  location: string;
  icon: typeof Package;
}

const getTrackingSteps = (city: string | null, state: string | null): TrackingStep[] => {
  const customerCity = city || 'sua cidade';
  const customerState = state || 'seu estado';
  return [
    { day: 0, title: 'Pedido Confirmado', description: 'Seu pedido foi recebido e confirmado.', location: 'Tangará da Serra - MT', icon: CheckCircle },
    { day: 1, title: 'Pagamento Aprovado', description: 'Pagamento processado com sucesso.', location: 'Tangará da Serra - MT', icon: CheckCircle },
    { day: 2, title: 'Preparando Pedido', description: 'Seu pedido está sendo separado no estoque.', location: 'Centro de Distribuição - Tangará da Serra - MT', icon: Package },
    { day: 3, title: 'Embalagem Concluída', description: 'Produtos embalados e prontos para envio.', location: 'Centro de Distribuição - Tangará da Serra - MT', icon: Package },
    { day: 4, title: 'Coletado pela Transportadora', description: 'O pacote foi coletado e está a caminho.', location: 'Tangará da Serra - MT', icon: Truck },
    { day: 5, title: 'Em Trânsito', description: 'Pacote saiu do centro de distribuição.', location: 'Tangará da Serra - MT', icon: Truck },
    { day: 6, title: 'Em Trânsito - Rodovia', description: 'Pacote em deslocamento para o estado de destino.', location: 'Em trânsito', icon: MapPin },
    { day: 7, title: 'Chegou ao Estado de Destino', description: `Pacote chegou ao centro de distribuição próximo a ${customerCity}.`, location: `${customerCity} - ${customerState}`, icon: MapPin },
    { day: 8, title: 'Em Rota de Entrega', description: `Pacote saiu para entrega em ${customerCity}.`, location: `${customerCity} - ${customerState}`, icon: Truck },
    { day: 9, title: '1ª Tentativa de Entrega', description: 'Tentativa de entrega não foi bem-sucedida. Destinatário ausente.', location: `${customerCity} - ${customerState}`, icon: Clock },
    { day: 10, title: 'Em Rota de Entrega', description: `Nova tentativa de entrega programada para ${customerCity}.`, location: `${customerCity} - ${customerState}`, icon: Truck },
    { day: 11, title: '2ª Tentativa de Entrega', description: 'Segunda tentativa de entrega não foi bem-sucedida. Endereço com dificuldade de acesso.', location: `${customerCity} - ${customerState}`, icon: Clock },
    { day: 12, title: '3ª Tentativa de Entrega', description: `Terceira tentativa de entrega em ${customerCity}. Aguardando contato com destinatário.`, location: `${customerCity} - ${customerState}`, icon: Clock },
    { day: 13, title: 'Entregue ao Destinatário', description: `Pacote entregue com sucesso em ${customerCity}!`, location: `${customerCity} - ${customerState}`, icon: CheckCircle },
  ];
};

export default function TrackingPage() {
  const [searchCode, setSearchCode] = useState('');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchCode.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    setSearched(true);

    try {
      const cleanCode = searchCode.trim().toUpperCase();

      const { data, error: fetchError } = await supabase
        .rpc('find_order_by_code', { search_code: cleanCode })
        .limit(1)
        .single();

      if (fetchError || !data) {
        setError('not_found');
        return;
      }

      setOrder(data as OrderData);
    } catch {
      setError('error');
    } finally {
      setLoading(false);
    }
  };

  const getVisibleSteps = (createdAt: string, city: string | null, state: string | null) => {
    const orderDate = new Date(createdAt);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    const steps = getTrackingSteps(city, state);
    return steps.filter(step => step.day <= daysPassed);
  };

  const trackingSteps = order ? getTrackingSteps(order.customer_city, order.customer_state) : [];
  const visibleSteps = order ? getVisibleSteps(order.created_at, order.customer_city, order.customer_state) : [];
  const isDelivered = visibleSteps.length === trackingSteps.length;
  const deliveryAttempts = visibleSteps.filter(s => s.title.includes('Tentativa')).length;

  const getNextUpdateMessage = () => {
    if (isDelivered) return null;
    if (deliveryAttempts >= 3) return 'Produto será devolvido ao remetente.';
    return 'Próxima atualização prevista para amanhã.';
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Seo title="Rastrear Pedido" description="Rastreie seu pedido da Agro Brasil. Digite o código do pedido e acompanhe a entrega." canonicalPath="/rastreio" />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={logoImg} alt="Agro Brasil" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Rastrear Pedido</h1>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto mb-8">
          <p className="text-sm text-muted-foreground text-center mb-3">
            Digite o código do pedido ou código de rastreio
          </p>
          <div className="flex gap-2">
            <Input
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Digite o código do pedido"
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Loading */}
        {loading && (
          <div className="max-w-2xl mx-auto space-y-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        )}

        {/* Not found */}
        {searched && !loading && error && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pedido não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              Não encontramos nenhum pedido com este código. Verifique e tente novamente.
            </p>
            <Link to="/">
              <Button>Voltar para a loja</Button>
            </Link>
          </div>
        )}

        {/* Results */}
        {order && !loading && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Order header */}
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pedido</p>
                  <p className="font-mono font-semibold text-lg">#{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <Badge
                  variant={isDelivered ? 'default' : 'secondary'}
                  className={isDelivered ? 'bg-success text-success-foreground' : 'bg-warning/20 text-warning'}
                >
                  {isDelivered ? 'Entregue' : 'Em andamento'}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
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
              </div>
            </div>

            {/* Tracking card */}
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <Truck className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Rastreio do Pedido</h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      {order.tracking_code || order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>
                {deliveryAttempts > 0 && !isDelivered ? (
                  <Badge variant="secondary" className="bg-warning/20 text-warning">
                    {deliveryAttempts}/3 Tentativas
                  </Badge>
                ) : isDelivered ? (
                  <Badge className="bg-success text-success-foreground">Entregue</Badge>
                ) : (
                  <Badge variant="secondary">Em Trânsito</Badge>
                )}
              </div>

              {/* Current status */}
              {visibleSteps.length > 0 && (
                <div className="bg-muted p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="font-semibold text-sm">{visibleSteps[visibleSteps.length - 1].title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {visibleSteps[visibleSteps.length - 1].description}
                  </p>
                  {getNextUpdateMessage() && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      {getNextUpdateMessage()}
                    </p>
                  )}
                </div>
              )}

              {/* Warning for delivery attempts */}
              {deliveryAttempts > 0 && !isDelivered && (
                <div className="bg-warning/10 border border-warning/30 p-4 rounded-lg mb-4">
                  <p className="text-sm text-warning">
                    <strong>Atenção:</strong> Já foram realizadas {deliveryAttempts} tentativa(s) de entrega. 
                    Após 3 tentativas sem sucesso, o produto será devolvido ao remetente.
                  </p>
                </div>
              )}

              {/* Timeline */}
              <div className="space-y-0">
                <h4 className="text-sm font-semibold mb-3">Histórico de Movimentação</h4>
                {[...visibleSteps].reverse().map((step, index) => {
                  const stepDate = new Date(order.created_at);
                  stepDate.setDate(stepDate.getDate() + step.day);
                  const isFirst = index === 0;

                  return (
                    <div key={step.day} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${isFirst ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                        {index < visibleSteps.length - 1 && (
                          <div className="w-0.5 h-full min-h-[40px] bg-muted-foreground/20" />
                        )}
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <span>{stepDate.toLocaleDateString('pt-BR')}</span>
                          <span>•</span>
                          <span>{stepDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className={`font-medium text-sm ${isFirst ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {step.location}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery address */}
            {order.customer_address && (
              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="font-semibold mb-4">Endereço de Entrega</h3>
                <p className="text-sm text-muted-foreground">
                  {order.customer_name}<br />
                  {order.customer_address}<br />
                  {order.customer_city} - {order.customer_state}<br />
                  {order.customer_cep && `CEP: ${order.customer_cep}`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!searched && !loading && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Rastreie seu pedido</h2>
            <p className="text-muted-foreground">
              Digite o código do pedido acima para ver o status da entrega.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
