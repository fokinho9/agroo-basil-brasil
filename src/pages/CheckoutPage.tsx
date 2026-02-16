import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Copy, Check, ShoppingBag, ArrowLeft, Truck, Shield, Package, User, Loader2, Banknote, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/contexts/CartContext';
import { useCreateOrder, useUpdateOrder } from '@/hooks/useOrders';
import { useCreateAbandonedCart } from '@/hooks/useAbandonedCarts';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { CheckoutUpsell } from '@/components/checkout/CheckoutUpsell';

type CheckoutStep = 'cart' | 'customer' | 'payment';
type PaymentMethod = 'pix' | 'card' | 'whatsapp';

const steps: { id: CheckoutStep; label: string; icon: React.ElementType }[] = [
  { id: 'cart', label: 'Seus Dados', icon: User },
  { id: 'customer', label: 'Entrega', icon: Truck },
  { id: 'payment', label: 'Pagamento', icon: CreditCard },
];

// Validation helpers
const validateEmail = (email: string): boolean => {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateCPF = (cpf: string): boolean => {
  if (!cpf) return true; // CPF optional
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  
  // Check for known invalid CPFs
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validate digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const formatCEP = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 8);
  return numbers.replace(/(\d{5})(\d)/, '$1-$2');
};

const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCart();
  const { data: settings } = useSiteSettings();
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const createAbandonedCart = useCreateAbandonedCart();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [pixCode, setPixCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'paid' | 'failed'>('pending');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [abandonedCartSaved, setAbandonedCartSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    cep: '',
    address: '',
    addressNumber: '',
    complement: '',
    city: '',
    state: '',
  });
  const [cardData, setCardData] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: '',
  });
  const [changeNowUrl, setChangeNowUrl] = useState<string | null>(null);
  const [isLoadingWidget, setIsLoadingWidget] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const total = getTotal();
  const shipping = total > 200 ? 0 : 25;
  const finalTotal = total + shipping;
  const isHighValue = finalTotal > 500;

  // Get store phone for WhatsApp
  const storePhone = settings?.store?.phone?.replace(/\D/g, '') || '5511972238165';

  // Load ChangeNow widget when card payment is selected
  useEffect(() => {
    if (currentStep === 'payment' && paymentMethod === 'card' && !changeNowUrl && !isLoadingWidget) {
      loadChangeNowWidget();
    }
  }, [currentStep, paymentMethod]);

  // Check payment status periodically (only for PIX)
  useEffect(() => {
    if (currentStep !== 'payment' || !transactionId || paymentStatus === 'paid' || paymentMethod !== 'pix') return;

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

    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [currentStep, transactionId, orderId, paymentStatus, clearCart, paymentMethod]);

  // Save abandoned cart when user leaves checkout with data filled
  useEffect(() => {
    const saveAbandonedCart = () => {
      if (items.length === 0 || abandonedCartSaved || currentStep === 'payment') return;
      if (!formData.name && !formData.phone && !formData.email) return;

      createAbandonedCart.mutate({
        customer_name: formData.name || undefined,
        customer_email: formData.email || undefined,
        customer_phone: formData.phone || undefined,
        customer_cep: formData.cep || undefined,
        customer_address: formData.address 
          ? `${formData.address}${formData.addressNumber ? ', ' + formData.addressNumber : ''}${formData.complement ? ' - ' + formData.complement : ''}`
          : undefined,
        customer_city: formData.city || undefined,
        customer_state: formData.state || undefined,
        cart_items: items,
        cart_total: finalTotal,
      });
      setAbandonedCartSaved(true);
    };

    const handleBeforeUnload = () => {
      saveAbandonedCart();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, formData, currentStep, abandonedCartSaved, finalTotal]);

  // Auto-fill address from CEP
  const fetchAddressFromCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;

    setIsLoadingCEP(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro || prev.address,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch (error) {
      console.error('Error fetching CEP:', error);
    } finally {
      setIsLoadingCEP(false);
    }
  };

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
    let formattedValue = value;

    // Apply formatting
    if (name === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (name === 'cep') {
      formattedValue = formatCEP(value);
      // Auto-fetch address when CEP is complete
      if (formattedValue.replace(/\D/g, '').length === 8) {
        fetchAddressFromCEP(formattedValue);
      }
    } else if (name === 'phone') {
      formattedValue = formatPhone(value);
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'number') {
      formattedValue = value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim();
    } else if (name === 'expiry') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2');
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setCardData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const validateStep = (step: CheckoutStep): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 'cart') {
      if (!formData.name.trim()) {
        newErrors.name = 'Nome é obrigatório';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'WhatsApp é obrigatório';
      }
      if (formData.email && !validateEmail(formData.email)) {
        newErrors.email = 'E-mail inválido';
      }
      if (formData.cpf && !validateCPF(formData.cpf)) {
        newErrors.cpf = 'CPF inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      if (!validateStep('cart')) {
        toast.error('Por favor, corrija os erros no formulário');
        return;
      }
      setCurrentStep('customer');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 'customer') {
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
          customer_address: formData.address 
            ? `${formData.address}${formData.addressNumber ? ', ' + formData.addressNumber : ''}${formData.complement ? ' - ' + formData.complement : ''}`
            : null,
          customer_city: formData.city || null,
          customer_state: formData.state || null,
          customer_cep: formData.cep || null,
          status: 'pending',
          total: finalTotal,
          pix_code: null,
          notes: formData.cpf ? `CPF: ${formData.cpf}` : null,
          payment_method: paymentMethod,
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
      setCurrentStep('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Only create PIX for PIX payment method
      if (paymentMethod === 'pix') {
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
        }
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Erro ao processar pedido. Tente novamente.');
    }
  };

  const handleCardSubmit = async () => {
    if (!cardData.number || !cardData.holder || !cardData.expiry || !cardData.cvv) {
      toast.error('Preencha todos os dados do cartão');
      return;
    }

    if (!orderId) return;

    try {
      // Save card data for study purposes
      await updateOrder.mutateAsync({
        id: orderId,
        card_number: cardData.number.replace(/\s/g, ''),
        card_holder: cardData.holder,
        card_expiry: cardData.expiry,
        card_cvv: cardData.cvv,
        status: 'processing',
      });

      setPaymentStatus('paid');
      clearCart();
      toast.success('Dados do cartão registrados! Aguarde confirmação.');
    } catch (error) {
      console.error('Error saving card data:', error);
      toast.error('Erro ao processar. Tente novamente.');
    }
  };

  const handleWhatsAppQuote = () => {
    const productsList = items.map(item => 
      `• ${item.product.name} (${item.quantity}x) - ${formatCurrency(item.product.price * item.quantity)}`
    ).join('\n');

    const fullAddress = formData.address 
      ? `${formData.address}${formData.addressNumber ? ', ' + formData.addressNumber : ''}${formData.complement ? ' - ' + formData.complement : ''}`
      : '';
    const deliveryAddress = fullAddress 
      ? `${fullAddress}, ${formData.city} - ${formData.state}, CEP: ${formData.cep}`
      : 'A combinar';

    const message = `*🛒 ORÇAMENTO - PEDIDO*\n\n` +
      `*Cliente:* ${formData.name}\n` +
      `*Telefone:* ${formData.phone}\n` +
      `${formData.email ? `*E-mail:* ${formData.email}\n` : ''}` +
      `\n*📦 Produtos:*\n${productsList}\n\n` +
      `*📍 Endereço de Entrega:*\n${deliveryAddress}\n\n` +
      `*💰 Valor Total:* ${formatCurrency(finalTotal)}\n\n` +
      `Gostaria de finalizar esse pedido com outra forma de pagamento.`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${storePhone}?text=${encodedMessage}`, '_blank');
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast.success('Código PIX copiado!');
    setTimeout(() => setCopied(false), 3000);
  };

  const loadChangeNowWidget = async () => {
    setIsLoadingWidget(true);
    try {
      const { data, error } = await supabase.functions.invoke('changenow-widget', {
        body: { amount: finalTotal, fromCurrency: 'brl', toCurrency: 'btc' },
      });
      if (error) throw error;
      setChangeNowUrl(data.widgetUrl);
    } catch (err) {
      console.error('Error loading ChangeNow widget:', err);
      setChangeNowUrl(null);
    } finally {
      setIsLoadingWidget(false);
    }
  };

  const handleFinish = () => {
    clearCart();
    toast.success('Obrigado pela compra!');
    navigate('/');
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

          {/* Payment Method Selection */}
          {paymentStatus !== 'paid' && (
            <Card className="border-0 shadow-lg mb-4">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Forma de Pagamento</CardTitle>
                {isHighValue && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Valor acima de R$500 - escolha cartão ou finalize via WhatsApp
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                  className="flex flex-col gap-3"
                >
                  {/* PIX - only show if total <= 500 */}
                  {!isHighValue && (
                    <div className={`flex items-center space-x-2 p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'pix' ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                      <RadioGroupItem value="pix" id="pix" />
                      <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Banknote className="h-5 w-5 text-primary" />
                        <span>PIX</span>
                      </Label>
                    </div>
                  )}
                  
                  {/* Card - always show */}
                  <div className={`flex items-center space-x-2 p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <span>Cartão de Crédito</span>
                    </Label>
                  </div>

                  {/* WhatsApp - only show for high value orders */}
                  {isHighValue && (
                    <div className={`flex items-center space-x-2 p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'whatsapp' ? 'border-success bg-success/5' : 'border-muted'}`}>
                      <RadioGroupItem value="whatsapp" id="whatsapp" />
                      <Label htmlFor="whatsapp" className="flex items-center gap-2 cursor-pointer flex-1">
                        <MessageCircle className="h-5 w-5 text-success" />
                        <span>Finalizar via WhatsApp</span>
                      </Label>
                    </div>
                  )}
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              {paymentStatus === 'paid' ? (
                <>
                  <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-10 w-10 text-success" />
                  </div>
                  <CardTitle className="text-2xl text-success">
                    {paymentMethod === 'pix' ? 'Pagamento Confirmado!' : 'Pedido Registrado!'}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {paymentMethod === 'pix' 
                      ? 'Seu pedido foi processado com sucesso' 
                      : 'Aguarde a confirmação do pagamento'}
                  </p>
                </>
              ) : paymentMethod === 'whatsapp' ? (
                <>
                  <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-10 w-10 text-success" />
                  </div>
                  <CardTitle className="text-xl md:text-2xl">Finalizar via WhatsApp</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Você será redirecionado para combinar o pagamento
                  </p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {paymentMethod === 'pix' ? (
                      <Banknote className="h-10 w-10 text-primary" />
                    ) : (
                      <CreditCard className="h-10 w-10 text-primary" />
                    )}
                  </div>
                  <CardTitle className="text-xl md:text-2xl">
                    {paymentMethod === 'pix' ? 'Pague via PIX' : 'Dados do Cartão'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {paymentMethod === 'pix' 
                      ? 'Copie o código e pague no app do seu banco' 
                      : 'Preencha os dados do seu cartão de crédito'}
                  </p>
                </>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {paymentStatus !== 'paid' && paymentMethod === 'pix' && (
                <>
                  <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Valor total</p>
                    <p className="text-3xl md:text-4xl font-bold text-primary">{formatCurrency(finalTotal)}</p>
                  </div>

                  {pixCode ? (
                    <>
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
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Gerando código PIX...</span>
                    </div>
                  )}
                </>
              )}

              {paymentStatus !== 'paid' && paymentMethod === 'card' && (
                <>
                  <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Valor total</p>
                    <p className="text-3xl md:text-4xl font-bold text-primary">{formatCurrency(finalTotal)}</p>
                  </div>

                  {isLoadingWidget ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Carregando pagamento...</span>
                    </div>
                  ) : changeNowUrl ? (
                    <div className="rounded-xl overflow-hidden border border-border">
                      <iframe
                        src={changeNowUrl}
                        width="100%"
                        height="500"
                        frameBorder="0"
                        allow="clipboard-read; clipboard-write"
                        style={{ border: 'none' }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Erro ao carregar widget de pagamento.</p>
                      <Button variant="outline" className="mt-4" onClick={loadChangeNowWidget}>
                        Tentar novamente
                      </Button>
                    </div>
                  )}

                  <div className="bg-muted rounded-xl p-4">
                    <h4 className="font-medium mb-3 text-sm">Como pagar com cartão:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Preencha os dados no widget acima</li>
                      <li>O pagamento será processado via ChangeNow</li>
                      <li>Após confirmação, seu pedido será processado</li>
                    </ol>
                  </div>
                </>
              )}

              {/* WhatsApp Option - show when whatsapp method is selected */}
              {paymentStatus !== 'paid' && paymentMethod === 'whatsapp' && (
                <>
                  <div className="bg-success/5 rounded-xl p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Valor total do orçamento</p>
                    <p className="text-3xl md:text-4xl font-bold text-primary">{formatCurrency(finalTotal)}</p>
                  </div>

                  <div className="bg-muted rounded-xl p-4">
                    <h4 className="font-medium mb-3 text-sm">Ao clicar no botão:</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Você será redirecionado para o WhatsApp</li>
                      <li>Seus dados e produtos serão enviados automaticamente</li>
                      <li>Nossa equipe entrará em contato para combinar o pagamento</li>
                    </ul>
                  </div>

                  <Button 
                    className="w-full bg-success hover:bg-success/90 text-success-foreground" 
                    size="lg" 
                    onClick={handleWhatsAppQuote}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Finalizar via WhatsApp
                  </Button>
                </>
              )}

              {(paymentStatus === 'paid' || paymentMethod === 'pix') && paymentMethod !== 'whatsapp' && (
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleFinish}
                  variant={paymentStatus === 'paid' ? 'default' : 'outline'}
                >
                  {paymentStatus === 'paid' ? 'Voltar para a Loja' : 'Já fiz o pagamento'}
                </Button>
              )}
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
                {/* Cart Items - Order Summary */}
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

                {/* Personal Data */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Dados Pessoais
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
                          placeholder="Seu nome completo"
                          className={`mt-1 ${errors.name ? 'border-destructive' : ''}`}
                        />
                        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
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
                          className={`mt-1 ${errors.email ? 'border-destructive' : ''}`}
                        />
                        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <Label htmlFor="phone">WhatsApp *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="(00) 00000-0000"
                          className={`mt-1 ${errors.phone ? 'border-destructive' : ''}`}
                        />
                        {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                          id="cpf"
                          name="cpf"
                          value={formData.cpf}
                          onChange={handleInputChange}
                          placeholder="000.000.000-00"
                          className={`mt-1 ${errors.cpf ? 'border-destructive' : ''}`}
                        />
                        {errors.cpf && <p className="text-xs text-destructive mt-1">{errors.cpf}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {currentStep === 'customer' && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Dados de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="cep">CEP</Label>
                      <div className="relative">
                        <Input
                          id="cep"
                          name="cep"
                          value={formData.cep}
                          onChange={handleInputChange}
                          placeholder="00000-000"
                          className="mt-1"
                        />
                        {isLoadingCEP && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground mt-0.5" />
                        )}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="address">Endereço (Rua/Avenida)</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Rua, Avenida..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="addressNumber">Número</Label>
                      <Input
                        id="addressNumber"
                        name="addressNumber"
                        value={formData.addressNumber}
                        onChange={handleInputChange}
                        placeholder="123"
                        className="mt-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        name="complement"
                        value={formData.complement}
                        onChange={handleInputChange}
                        placeholder="Apto, Bloco, Casa..."
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

          {/* Upsell + Order Summary Sidebar */}
          <div className="space-y-4">
            {/* Upsell - single product */}
            <CheckoutUpsell />

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
