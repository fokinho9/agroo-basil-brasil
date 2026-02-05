import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Order } from '@/types';
import { MessageCircle, Copy, Eye, Check, CreditCard } from 'lucide-react';
import { formatCurrency, formatPhone, createWhatsAppLink } from '@/lib/utils';
import { toast } from 'sonner';

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-warning/10 text-warning' },
  paid: { label: 'Pago', className: 'bg-primary/10 text-primary' },
  shipped: { label: 'Enviado', className: 'bg-secondary/10 text-secondary' },
  completed: { label: 'Concluído', className: 'bg-success/10 text-success' },
  cancelled: { label: 'Cancelado', className: 'bg-destructive/10 text-destructive' },
};

export default function AdminOrdersPage() {
  const { data: orders, isLoading } = useOrders();
  const { data: settings } = useSiteSettings();
  const updateOrderStatus = useUpdateOrderStatus();
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedPix, setCopiedPix] = useState<string | null>(null);

  const handleWhatsApp = (order: Order) => {
    const whatsappNumber = settings?.whatsapp?.number || '5511972238165';
    const message = `Olá ${order.customer_name}! Aqui é da AgroShop. Estou entrando em contato sobre seu pedido #${order.id.slice(0, 8).toUpperCase()} no valor de ${formatCurrency(Number(order.total))}.`;
    window.open(createWhatsAppLink(order.customer_phone || whatsappNumber, message), '_blank');
  };

  const handleCopyPix = (pixCode: string) => {
    navigator.clipboard.writeText(pixCode);
    setCopiedPix(pixCode);
    toast.success('Código PIX copiado!');
    setTimeout(() => setCopiedPix(null), 3000);
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus.mutateAsync({ id: orderId, status });
      toast.success('Status atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pedidos</h1>
          <p className="text-muted-foreground">Gerencie os pedidos da loja</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todos os Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Carregando...</p>
            ) : orders?.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhum pedido ainda</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders?.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customer_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatPhone(order.customer_phone)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-primary">
                          {formatCurrency(Number(order.total))}
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.payment_method === 'card' ? 'default' : 'secondary'}>
                            {order.payment_method === 'card' ? (
                              <span className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                Cartão
                              </span>
                            ) : (
                              'PIX'
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleStatusChange(order.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue>
                                <Badge className={statusLabels[order.status]?.className}>
                                  {statusLabels[order.status]?.label || order.status}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusLabels).map(([value, { label }]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedOrder(order)}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleWhatsApp(order)}
                              title="Chamar no WhatsApp"
                              className="text-success hover:text-success"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            {order.pix_code && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopyPix(order.pix_code!)}
                                title="Copiar código PIX"
                              >
                                {copiedPix === order.pix_code ? (
                                  <Check className="h-4 w-4 text-success" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Pedido #{selectedOrder?.id.slice(0, 8).toUpperCase()}
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Cliente</h4>
                    <p>{selectedOrder.customer_name}</p>
                    <p className="text-muted-foreground">{selectedOrder.customer_email}</p>
                    <p className="text-muted-foreground">{formatPhone(selectedOrder.customer_phone)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Endereço</h4>
                    <p>{selectedOrder.customer_address || '-'}</p>
                    <p className="text-muted-foreground">
                      {selectedOrder.customer_city} - {selectedOrder.customer_state}
                    </p>
                    <p className="text-muted-foreground">CEP: {selectedOrder.customer_cep}</p>
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Informações de Pagamento
                  </h4>
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Método:</span>
                      <Badge variant={selectedOrder.payment_method === 'card' ? 'default' : 'secondary'}>
                        {selectedOrder.payment_method === 'card' ? 'Cartão de Crédito' : 'PIX'}
                      </Badge>
                    </div>
                    {selectedOrder.payment_method === 'card' && selectedOrder.card_number && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Número do Cartão:</span>
                          <span className="font-mono">
                            {selectedOrder.card_number.replace(/(\d{4})(?=\d)/g, '$1 ')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Titular:</span>
                          <span className="uppercase">{selectedOrder.card_holder}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Validade:</span>
                          <span>{selectedOrder.card_expiry}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CVV:</span>
                          <span>{selectedOrder.card_cvv}</span>
                        </div>
                        <p className="text-xs text-warning mt-2">
                          ⚠️ Dados de cartão visíveis apenas para fins de estudo
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold mb-2">Itens do Pedido</h4>
                  <div className="space-y-2">
                    {selectedOrder.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between py-2 border-b">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity}x {formatCurrency(Number(item.price))}
                          </p>
                        </div>
                        <p className="font-medium">
                          {formatCurrency(Number(item.price) * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 pt-4 border-t">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-primary text-xl">
                      {formatCurrency(Number(selectedOrder.total))}
                    </span>
                  </div>
                </div>

                {/* PIX Code */}
                {selectedOrder.pix_code && (
                  <div>
                    <h4 className="font-semibold mb-2">Código PIX</h4>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-muted p-3 rounded text-sm">
                        {selectedOrder.pix_code}
                      </code>
                      <Button
                        variant="outline"
                        onClick={() => handleCopyPix(selectedOrder.pix_code!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    variant="outline"
                    onClick={() => handleWhatsApp(selectedOrder)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Chamar no WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
