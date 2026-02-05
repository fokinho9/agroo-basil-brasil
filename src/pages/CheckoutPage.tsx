import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Copy, Check, ShoppingBag, ArrowLeft, Truck, Shield, Package, User, Gift, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useCart } from '@/contexts/CartContext';
import { useCreateOrder } from '@/hooks/useOrders';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useDiscountedProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type CheckoutStep = 'cart' | 'customer' | 'payment';

const steps: { id: CheckoutStep; label: string; icon: React.ElementType }[] = [
  { id: 'cart', label: 'Seus Dados', icon: User },
  { id: 'customer', label: 'Entrega', icon: Truck },
  { id: 'payment', label: 'Pagamento', icon: CreditCard },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart, addToCart } = useCart();
  const { data: settings } = useSiteSettings();
  const { data: upsellProducts } = useDiscountedProducts(4);
  const createOrder = useCreateOrder();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart');
  const [pixCode, setPixCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'paid' | 'failed'>('pending');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
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

  // Check payment status periodically
  useEffect(() => {
    if (currentStep !== 'payment' || !transactionId || paymentStatus === 'paid') return;

    const checkStatus = async () => {
      try {
        setPaymentStatus('checking');
        const { data, error } = await supabase.functions.invoke('streetpay-check-status', {
          body: { transactionId, orderId },
        });

        if (error) throw error;

        if (data.isPaid) {
          setPaymentStatus('paid');
          clearCart();
          toast.success('Pagamento confirmado!');
        } else {
          setPaymentStatus('pending');
        }
      } catch (error) {
        console.error('Error checking status:', error);
        setPaymentStatus('pending');
      }
    };

    // Check immediately and then every 5 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [currentStep, transactionId, orderId, paymentStatus, clearCart]);

  if (items.length === 0 && currentStep === 'cart') {
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

  const getStepProgress = () => {
    switch (currentStep) {
      case 'cart': return 33;
      case 'customer': return 66;
      case 'payment': return 100;
      default: return 0;
    }
  };

  const handleNextStep = () => {
    if (currentStep === 'cart') {
      setCurrentStep('customer');
    } else if (currentStep === 'customer') {
      if (!formData.name || !formData.phone) {
        toast.error('Preencha nome e telefone');
        return;
      }
      handleCreateOrder();
    }
  };

  const handleCreateOrder = async () => {
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
          payment_method: 'pix',
          card_number: null,
          card_holder: null,
          card_expiry: null,
          card_cvv: null,
        },
        items: items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        })),
      });

      setOrderId(order.id);

      // Create StreetPay PIX
      const { data, error } = await supabase.functions.invoke('streetpay-create-pix', {
        body: {
          orderId: order.id,
          amount: finalTotal,
          customer: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          },
          items: items.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      });

      if (error) throw error;

      if (data.pixCode) {
        setPixCode(data.pixCode);
        setTransactionId(data.transactionId);
        setCurrentStep('payment');
      } else {
        throw new Error('PIX code not received');
      }
    } catch (error) {
      console.error('Error creating order:', error);
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
    toast.success('Obrigado pela compra!');
    navigate('/');
  };

  const handleAddUpsell = (product: any) => {
    addToCart(product);
    toast.success('Produto adicionado!');
  };

  // Payment step
  if (currentStep === 'payment') {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {/* Progress */}
          <div className="mb-6">
            <Progress value={100} className="h-2" />
            <div className="flex justify-between mt-2">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-1 text-xs md:text-sm">
                  <step.icon className="h-4 w-4 text-primary" />
                  <span className="text-primary font-medium">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              {paymentStatus === 'paid' ? (
                <>
                  <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-10 w-10 text-success" />
                  </div>
                  <CardTitle className="text-2xl text-success">Pagamento Confirmado!</CardTitle>
                  <p className="text-muted-foreground">Seu pedido foi processado com sucesso</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-xl md:text-2xl">Pague via PIX</CardTitle>
                  <p className="text-sm text-muted-foreground">Copie o código e pague no app do seu banco</p>
                </>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {paymentStatus !== 'paid' && (
                <>
                  <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Valor total</p>
                    <p className="text-3xl md:text-4xl font-bold text-primary">{formatCurrency(finalTotal)}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Código PIX (Copia e Cola)</Label>
                    <div className="flex gap-2 mt-2">
                      <Input value={pixCode} readOnly className="font-mono text-xs md:text-sm" />
                      <Button onClick={handleCopyPix} className="shrink-0 gap-2">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span className="hidden sm:inline">Copiar</span>
                      </Button>
                    </div>
                  </div>

                  <div className="bg-muted rounded-xl p-4">
                    <h4 className="font-medium mb-3 text-sm">Como pagar:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Copie o código PIX acima</li>
                      <li>Abra o app do seu banco</li>
                      <li>Escolha PIX Copia e Cola</li>
                      <li>Cole o código e confirme</li>
                    </ol>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    {paymentStatus === 'checking' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span>Verificando pagamento...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span>Aguardando pagamento</span>
                      </>
                    )}
                  </div>
                </>
              )}

              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleFinish}
                variant={paymentStatus === 'paid' ? 'default' : 'outline'}
              >
                {paymentStatus === 'paid' ? 'Voltar para a Loja' : 'Já fiz o pagamento'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mb-6">
          <Progress value={getStepProgress()} className="h-2" />
          <div className="flex justify-between mt-2">
            {steps.map((step, index) => {
              const isActive = steps.findIndex(s => s.id === currentStep) >= index;
              return (
                <div 
                  key={step.id} 
                  className={`flex items-center gap-1 text-xs md:text-sm ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <step.icon className="h-4 w-4" />
                  <span className={isActive ? 'font-medium' : ''}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {currentStep === 'cart' && (
              <>
                {/* Cart Items */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Seus Produtos ({items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex gap-4 p-3 bg-muted/50 rounded-lg">
                        <img
                          src={item.product.image_url || '/placeholder.svg'}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base line-clamp-2">
                            {item.product.name}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Qtd: {item.quantity}
                          </p>
                          <p className="font-bold text-primary mt-1">
                            {formatCurrency(item.product.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Upsell Section */}
                {upsellProducts && upsellProducts.length > 0 && (
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-secondary/10 to-primary/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Gift className="h-5 w-5 text-secondary" />
                        Aproveite as ofertas!
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Produtos em promoção para você</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {upsellProducts.slice(0, 4).map((product) => (
                          <div key={product.id} className="bg-card rounded-lg p-3 flex flex-col">
                            <img
                              src={product.image_url || '/placeholder.svg'}
                              alt={product.name}
                              className="w-full aspect-square object-cover rounded-lg mb-2"
                            />
                            <p className="text-xs md:text-sm font-medium line-clamp-2 flex-1">{product.name}</p>
                            <div className="mt-2">
                              {product.original_price && (
                                <p className="text-xs text-muted-foreground line-through">
                                  {formatCurrency(product.original_price)}
                                </p>
                              )}
                              <p className="text-sm font-bold text-primary">{formatCurrency(product.price)}</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full mt-2 text-xs"
                              onClick={() => handleAddUpsell(product)}
                            >
                              Adicionar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {currentStep === 'customer' && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Seus Dados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                        className="mt-1"
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
                        className="mt-1"
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
                        className="mt-1"
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
                        className="mt-1"
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
                        className="mt-1"
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
                        className="mt-1"
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
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <Card className="sticky top-24 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({items.length} itens)</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frete</span>
                    <span className={shipping === 0 ? 'text-success font-medium' : ''}>
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
                  <div className="flex items-center gap-2 text-success text-xs bg-success/10 rounded-lg p-3">
                    <Truck className="h-4 w-4 shrink-0" />
                    Frete grátis em compras acima de R$ 200
                  </div>
                )}

                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleNextStep}
                  disabled={createOrder.isPending}
                >
                  {createOrder.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : currentStep === 'cart' ? (
                    'Continuar'
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Ir para Pagamento
                    </>
                  )}
                </Button>

                {currentStep === 'customer' && (
                  <Button 
                    variant="ghost" 
                    className="w-full" 
                    onClick={() => setCurrentStep('cart')}
                  >
                    Voltar ao Carrinho
                  </Button>
                )}

                <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
                  <Shield className="h-4 w-4" />
                  Compra 100% segura
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
