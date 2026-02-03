import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminProducts } from '@/hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';
import { useCategories } from '@/hooks/useCategories';
import { Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { data: products } = useAdminProducts();
  const { data: orders } = useOrders();
  const { data: categories } = useCategories();

  const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
  const pendingOrders = orders?.filter((o) => o.status === 'pending').length || 0;
  const completedOrders = orders?.filter((o) => o.status === 'completed').length || 0;

  const stats = [
    {
      title: 'Produtos',
      value: products?.length || 0,
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Pedidos',
      value: orders?.length || 0,
      icon: ShoppingCart,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      title: 'Receita Total',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Categorias',
      value: categories?.length || 0,
      icon: TrendingUp,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  const recentOrders = orders?.slice(0, 5) || [];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua loja</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Status dos Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pendentes</span>
                  <span className="font-bold text-warning">{pendingOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Concluídos</span>
                  <span className="font-bold text-success">{completedOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">{orders?.length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhum pedido ainda</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-foreground">{order.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className="font-bold text-primary">{formatCurrency(Number(order.total))}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
