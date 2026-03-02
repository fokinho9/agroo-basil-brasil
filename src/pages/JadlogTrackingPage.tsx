import { Seo } from '@/components/seo/Seo';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, Truck, MapPin, CheckCircle, Search, Clock, AlertCircle, RotateCcw, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface TrackingEvent {
  id: string;
  tracking_code: string;
  status_code: string;
  status_label: string;
  location_city: string | null;
  location_state: string | null;
  location_postcode: string | null;
  occurred_at: string;
}

const statusIconMap: Record<string, typeof Package> = {
  POSTED: Package,
  PICKUP: Truck,
  IN_TRANSIT: Truck,
  ARRIVED_HUB: Building2,
  SORTING: Building2,
  DISPATCHED: Truck,
  ARRIVED_LOCAL: MapPin,
  OUT_FOR_DELIVERY: Truck,
  DELIVERY_FAILED_1: AlertCircle,
  DELIVERY_FAILED_2: AlertCircle,
  DELIVERY_FAILED_3: AlertCircle,
  RE_SCHEDULED: Clock,
  RETURN_INIT: RotateCcw,
  RETURN_TRANSIT: RotateCcw,
  RETURN_ARRIVED: Building2,
  RETURNED: RotateCcw,
  DELIVERED: CheckCircle,
};

const statusColorMap: Record<string, string> = {
  POSTED: 'bg-blue-500',
  PICKUP: 'bg-blue-500',
  IN_TRANSIT: 'bg-blue-500',
  ARRIVED_HUB: 'bg-blue-500',
  SORTING: 'bg-blue-500',
  DISPATCHED: 'bg-blue-500',
  ARRIVED_LOCAL: 'bg-blue-500',
  OUT_FOR_DELIVERY: 'bg-amber-500',
  DELIVERY_FAILED_1: 'bg-red-500',
  DELIVERY_FAILED_2: 'bg-red-500',
  DELIVERY_FAILED_3: 'bg-red-500',
  RE_SCHEDULED: 'bg-amber-500',
  RETURN_INIT: 'bg-red-600',
  RETURN_TRANSIT: 'bg-red-600',
  RETURN_ARRIVED: 'bg-red-600',
  RETURNED: 'bg-red-700',
  DELIVERED: 'bg-green-600',
};

export default function JadlogTrackingPage() {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';
  const [searchCode, setSearchCode] = useState(initialCode);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (code?: string) => {
    const query = (code || searchCode).trim().toUpperCase();
    if (!query) return;
    setLoading(true);
    setSearched(true);
    setEvents([]);

    try {
      // Search by tracking_code or order_id prefix
      const { data, error } = await supabase
        .from('tracking_events')
        .select('*')
        .or(`tracking_code.eq.${query},order_id.eq.${query}`)
        .order('occurred_at', { ascending: true });

      if (error) throw error;

      // Filter visible events (only show events that have occurred)
      const now = new Date();
      const visible = (data || []).filter(e => new Date(e.occurred_at) <= now);
      setEvents(visible as TrackingEvent[]);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) handleSearch(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastEvent = events.length > 0 ? events[events.length - 1] : null;
  const isDelivered = lastEvent?.status_code === 'DELIVERED';
  const isReturned = lastEvent?.status_code === 'RETURNED';
  const hasFailed = events.some(e => e.status_code.startsWith('DELIVERY_FAILED'));

  const getOverallStatus = () => {
    if (isDelivered) return { label: 'Entregue', color: 'bg-green-600 text-white' };
    if (isReturned) return { label: 'Devolvido ao Remetente', color: 'bg-red-600 text-white' };
    if (lastEvent?.status_code.startsWith('RETURN')) return { label: 'Em Devolução', color: 'bg-red-500 text-white' };
    if (hasFailed) return { label: 'Tentativa de Entrega', color: 'bg-amber-500 text-white' };
    if (lastEvent?.status_code === 'OUT_FOR_DELIVERY') return { label: 'Saiu para Entrega', color: 'bg-amber-500 text-white' };
    return { label: 'Em Trânsito', color: 'bg-blue-500 text-white' };
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <Seo title="Rastreamento Jadlog" description="Rastreie seu pedido pela Jadlog." noindex />
      
      {/* Jadlog Header */}
      <div style={{ backgroundColor: '#ed1c24' }} className="text-white py-3">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3">
            <Truck className="h-7 w-7" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">JADLOG</h1>
              <p className="text-xs opacity-80">Rastreamento de Encomendas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Rastrear Encomenda</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-2">
            <Input
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Digite o código de rastreio"
              className="flex-1 border-gray-300"
            />
            <Button type="submit" disabled={loading} style={{ backgroundColor: '#ed1c24' }} className="text-white hover:opacity-90">
              <Search className="h-4 w-4 mr-1" /> Rastrear
            </Button>
          </form>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {searched && !loading && events.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Objeto não encontrado</h3>
            <p className="text-sm text-gray-500">Verifique o código informado e tente novamente.</p>
          </div>
        )}

        {events.length > 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {/* Status header */}
            <div className="p-6 border-b" style={{ backgroundColor: '#fafafa' }}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Código de Rastreio</p>
                  <p className="font-mono font-bold text-lg text-gray-800">{events[0].tracking_code}</p>
                </div>
                <Badge className={getOverallStatus().color}>
                  {getOverallStatus().label}
                </Badge>
              </div>

              {/* Last update */}
              {lastEvent && (
                <div className="mt-4 p-3 rounded-md" style={{ backgroundColor: '#f0f0f0' }}>
                  <p className="text-sm font-medium text-gray-700">{lastEvent.status_label}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {lastEvent.location_city && `${lastEvent.location_city}${lastEvent.location_state ? ` - ${lastEvent.location_state}` : ''}`}
                    {lastEvent.location_postcode && ` • CEP: ${lastEvent.location_postcode}`}
                    {' • '}
                    {new Date(lastEvent.occurred_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="p-6">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">Histórico de Movimentação</h3>
              <div className="space-y-0">
                {[...events].reverse().map((event, index) => {
                  const Icon = statusIconMap[event.status_code] || Package;
                  const dotColor = statusColorMap[event.status_code] || 'bg-gray-400';
                  const isFirst = index === 0;
                  const isLast = index === events.length - 1;

                  return (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${isFirst ? dotColor : 'bg-gray-300'}`} />
                        {!isLast && <div className="w-0.5 h-full min-h-[48px] bg-gray-200" />}
                      </div>
                      <div className="pb-5">
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-0.5">
                          <span>{new Date(event.occurred_at).toLocaleDateString('pt-BR')}</span>
                          <span>•</span>
                          <span>{new Date(event.occurred_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 shrink-0 ${isFirst ? 'text-gray-700' : 'text-gray-400'}`} />
                          <p className={`text-sm ${isFirst ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                            {event.status_label}
                          </p>
                        </div>
                        {(event.location_city || event.location_postcode) && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 ml-6">
                            <MapPin className="h-3 w-3" />
                            {event.location_city}{event.location_state ? ` - ${event.location_state}` : ''}
                            {event.location_postcode && ` • CEP: ${event.location_postcode}`}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 text-center border-t" style={{ backgroundColor: '#fafafa' }}>
              <p className="text-xs text-gray-400">Jadlog Logística S.A. • CNPJ: 04.884.082/0001-35</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
