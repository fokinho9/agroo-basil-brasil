import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Trash2, Package, Phone, Mail, MapPin, Check, Clock, X } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAbandonedCarts, useUpdateAbandonedCart, useDeleteAbandonedCart } from '@/hooks/useAbandonedCarts';
import { formatCurrency, createWhatsAppLink } from '@/lib/utils';
import { toast } from 'sonner';
import { AbandonedCart } from '@/types';

const STORE_PHONE = '5511972238165';

export default function AdminAbandonedCartsPage() {
  const { data: carts, isLoading } = useAbandonedCarts();
  const updateCart = useUpdateAbandonedCart();
  const deleteCart = useDeleteAbandonedCart();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleWhatsApp = (cart: AbandonedCart) => {
    const productsList = cart.cart_items.map(item => 
      `• ${item.product.name} (${item.quantity}x) - ${formatCurrency(item.product.price * item.quantity)}`
    ).join('\n');

    const message = `Olá${cart.customer_name ? ` ${cart.customer_name.split(' ')[0]}` : ''}! 👋\n\n` +
      `Notamos que você deixou alguns produtos no carrinho da nossa loja:\n\n` +
      `${productsList}\n\n` +
      `*Total: ${formatCurrency(cart.cart_total)}*\n\n` +
      `Posso ajudar a finalizar seu pedido? 🛒`;

    const phone = cart.customer_phone?.replace(/\D/g, '') || '';
    const whatsappUrl = createWhatsAppLink(phone || STORE_PHONE, message);
    window.open(whatsappUrl, '_blank');

    // Mark as contacted
    updateCart.mutate({
      id: cart.id,
      status: 'contacted',
      contacted_at: new Date().toISOString(),
    });
    
    toast.success('Carrinho marcado como contatado');
  };

  const handleDelete = () => {
    if (!deleteId) return;
    
    deleteCart.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Carrinho removido');
        setDeleteId(null);
      },
      onError: () => {
        toast.error('Erro ao remover carrinho');
      },
    });
  };

  const handleMarkRecovered = (id: string) => {
    updateCart.mutate({
      id,
      status: 'recovered',
    }, {
      onSuccess: () => {
        toast.success('Carrinho marcado como recuperado!');
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'abandoned':
        return <Badge variant="destructive" className="gap-1"><Clock className="h-3 w-3" /> Abandonado</Badge>;
      case 'contacted':
        return <Badge variant="secondary" className="gap-1"><MessageCircle className="h-3 w-3" /> Contatado</Badge>;
      case 'recovered':
        return <Badge className="bg-success text-success-foreground gap-1"><Check className="h-3 w-3" /> Recuperado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const abandonedCount = carts?.filter(c => c.status === 'abandoned').length || 0;
  const contactedCount = carts?.filter(c => c.status === 'contacted').length || 0;
  const recoveredCount = carts?.filter(c => c.status === 'recovered').length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Carrinhos Abandonados</h1>
            <p className="text-muted-foreground">
              Recupere vendas contatando clientes que deixaram itens no carrinho
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-destructive">{abandonedCount}</p>
                <p className="text-sm text-muted-foreground">Abandonados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-secondary-foreground">{contactedCount}</p>
                <p className="text-sm text-muted-foreground">Contatados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-success">{recoveredCount}</p>
                <p className="text-sm text-muted-foreground">Recuperados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart list */}
        {!carts || carts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-1">Nenhum carrinho abandonado</h3>
              <p className="text-sm text-muted-foreground">
                Quando clientes deixarem produtos no carrinho, eles aparecerão aqui
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {carts.map((cart) => (
              <Card key={cart.id} className={cart.status === 'recovered' ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          {cart.customer_name || 'Cliente não identificado'}
                        </CardTitle>
                        {getStatusBadge(cart.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(cart.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                        {cart.contacted_at && (
                          <span className="ml-2">
                            • Contatado em {format(new Date(cart.contacted_at), "dd/MM HH:mm")}
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(cart.cart_total)}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer info */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {cart.customer_phone && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {cart.customer_phone}
                      </div>
                    )}
                    {cart.customer_email && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {cart.customer_email}
                      </div>
                    )}
                    {cart.customer_city && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {cart.customer_city} - {cart.customer_state}
                      </div>
                    )}
                  </div>

                  {/* Products */}
                  <div className="bg-muted rounded-lg p-3 space-y-2">
                    {cart.cart_items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <img
                          src={item.product.image_url || '/placeholder.svg'}
                          alt={item.product.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity}x {formatCurrency(item.product.price)}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          {formatCurrency(item.product.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {cart.customer_phone && cart.status !== 'recovered' && (
                      <Button
                        className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
                        onClick={() => handleWhatsApp(cart)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Chamar no WhatsApp
                      </Button>
                    )}
                    {cart.status === 'contacted' && (
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleMarkRecovered(cart.id)}
                      >
                        <Check className="h-4 w-4" />
                        Marcar como Recuperado
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive ml-auto"
                      onClick={() => setDeleteId(cart.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover carrinho?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
