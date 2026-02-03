import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Copy, Check, ShoppingBag, ArrowLeft, Truck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useCreateOrder } from '@/hooks/useOrders';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { formatCurrency, generatePixCode } from '@/lib/utils';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCart();
  const { data: settings } = useSiteSettings();
  const createOrder = useCreateOrder();
  
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [pixCode, setPixCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cep: '',
    address: '',
    city: '',
    state: '',
  });

  const total = getTotal();
  const shipping = total > 200 ? 0 : 25;
  const finalTotal = total + shipping;

  if (items.length === 0 && step === 'form') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Seu carrinho está vazio</h1>
        <p className="text-muted-foreground mb-6">Adicione produtos para continuar com a compra</p>
        <Button onClick={() => navigate('/produtos')}>Ver Produtos</Button>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      const order = await createOrder.mutateAsync({
        order: {
          customer_name: formData.name,
          customer_email: formData.email || null,
          customer_phone: formData.phone,
          customer_address: formData.address || null,
          customer_city: formData.city || null,
          customer_state: formData.state || null,
          customer_cep: formData.cep || null,
          status: 'pending',
          total: finalTotal,
          pix_code: null,
          notes: null,
        },
        items: items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        })),
      });

      const code = generatePixCode(order.id, finalTotal);
      setPixCode(code);
      setStep('payment');
    } catch (error) {
      toast.error('Erro ao processar pedido. Tente novamente.');
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast.success('Código PIX copiado!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleFinish = () => {
    clearCart();
    toast.success('Pedido realizado com sucesso!');
    navigate('/');
  };

  if (step === 'payment') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-success" />
            </div>
            <CardTitle className="text-2xl">Pedido Confirmado!</CardTitle>
            <p className="text-muted-foreground">Realize o pagamento via PIX para finalizar</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Valor total</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(finalTotal)}</p>
            </div>

            <div>
              <Label>Código PIX (Copia e Cola)</Label>
              <div className="flex gap-2 mt-2">
                <Input value={pixCode} readOnly className="font-mono text-sm" />
                <Button variant="outline" onClick={handleCopyPix}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Copie o código e cole no app do seu banco
              </p>
            </div>

            <div className="bg-secondary/20 rounded-lg p-4 text-sm">
              <h4 className="font-medium mb-2">Como pagar:</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Copie o código PIX acima</li>
                <li>Abra o app do seu banco</li>
                <li>Escolha a opção PIX Copia e Cola</li>
                <li>Cole o código e confirme o pagamento</li>
              </ol>
            </div>

            <Button className="w-full" size="lg" onClick={handleFinish}>
              Finalizar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Dados para Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">WhatsApp *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      name="cep"
                      value={formData.cep}
                      onChange={handleInputChange}
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Rua, número, complemento"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Sua cidade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="UF"
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full gap-2" disabled={createOrder.isPending}>
                  <CreditCard className="h-5 w-5" />
                  {createOrder.isPending ? 'Processando...' : 'Ir para Pagamento'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3">
                  <img
                    src={item.product.image_url || '/placeholder.svg'}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity}x {formatCurrency(item.product.price)}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {formatCurrency(item.product.price * item.quantity)}
                  </p>
                </div>
              ))}

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frete</span>
                  <span className={shipping === 0 ? 'text-success' : ''}>
                    {shipping === 0 ? 'Grátis' : formatCurrency(shipping)}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(finalTotal)}</span>
              </div>

              {shipping === 0 && (
                <div className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-lg p-3">
                  <Truck className="h-4 w-4" />
                  Frete grátis para compras acima de R$ 200
                </div>
              )}

              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Shield className="h-4 w-4" />
                Compra 100% segura
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
