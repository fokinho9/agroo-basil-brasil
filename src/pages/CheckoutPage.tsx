import { Seo } from '@/components/seo/Seo';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Copy, Check, ShoppingBag, ArrowLeft, Truck, Shield, Package, User, Loader2, Banknote, MessageCircle, Lock, Star, BadgeCheck, Clock } from 'lucide-react';
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
import reclameAquiImg from '@/assets/banners/reclame-aqui.png';

type CheckoutStep = 'cart' | 'customer' | 'payment';
type PaymentMethod = 'pix' | 'card' | 'whatsapp';
type ShippingOption = 'express' | 'free';

const steps: { id: CheckoutStep; label: string; icon: React.ElementType }[] = [
  { id: 'cart', label: 'Seus Dados', icon: User },
  { id: 'customer', label: 'Entrega', icon: Truck },
  { id: 'payment', label: 'Pagamento', icon: CreditCard },
];

// Validation helpers
const validateEmail = (email: string): boolean => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateCPF = (cpf: string): boolean => {
  if (!cpf) return true;
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean.charAt(i)) * (10 - i);
  let r = (sum * 10) % 11;
  if (r >= 10) r = 0;
  if (r !== parseInt(clean.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean.charAt(i)) * (11 - i);
  r = (sum * 10) % 11;
  if (r >= 10) r = 0;
  if (r !== parseInt(clean.charAt(10))) return false;
  return true;
};

const formatCPF = (value: string): string => {
  const n = value.replace(/\D/g, '').slice(0, 11);
  return n.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const formatCEP = (value: string): string => {
  const n = value.replace(/\D/g, '').slice(0, 8);
  return n.replace(/(\d{5})(\d)/, '$1-$2');
};

const formatPhone = (value: string): string => {
  const n = value.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 10) return n.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return n.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
};

// Installment calculation
const PIX_DISCOUNT = 0.15;
const INTEREST_RATE = 0.0299; // 2.99% per month for installments > 5

function calculateInstallments(total: number) {
  const installments = [];
  for (let i = 1; i <= 12; i++) {
    if (i <= 5) {
      installments.push({ qty: i, value: total / i, total, interest: false });
    } else {
      const withInterest = total * Math.pow(1 + INTEREST_RATE, i);
      installments.push({ qty: i, value: withInterest / i, total: withInterest, interest: true });
    }
  }
  return installments;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCart();
  const { data: settings } = useSiteSettings();
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const createAbandonedCart = useCreateAbandonedCart();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [shippingOption, setShippingOption] = useState<ShippingOption>('free');
  const [pixCode, setPixCode] = useState('');
  const [pixQrImage, setPixQrImage] = useState('');
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'paid' | 'failed'>('pending');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [abandonedCartSaved, setAbandonedCartSaved] = useState(false);
  const [isCreatingPix, setIsCreatingPix] = useState(false);
  const [isPollingStatus, setIsPollingStatus] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(1);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', cpf: '',
    cep: '', address: '', addressNumber: '', complement: '', city: '', state: '',
  });
  const [cardData, setCardData] = useState({ number: '', holder: '', expiry: '', cvv: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = getTotal();
  const shippingCost = shippingOption === 'express' ? 34.9 : 0;
  const totalBeforeDiscount = subtotal + shippingCost;
  const pixTotal = totalBeforeDiscount * (1 - PIX_DISCOUNT);
  const finalTotal = paymentMethod === 'pix' ? pixTotal : totalBeforeDiscount;

  // Admin settings
  const paymentGateway = settings?.payment_gateway || 'manual'; // 'podpay' or 'manual'
  const whatsappLimit = (settings?.whatsapp_purchase_limit as any)?.value || 0; // 0 = disabled
  const storePhone = settings?.whatsapp?.number || '5511972238165';
  const reclameEnabled = settings?.reclame_aqui?.enabled !== false;
  const reclameLink = settings?.reclame_aqui?.link || 'https://reclameaqui.com.br';

  // Check if above WhatsApp limit (will redirect to WhatsApp on pay)
  const aboveWhatsAppLimit = whatsappLimit > 0 && totalBeforeDiscount >= whatsappLimit;
  const [pixGenerated, setPixGenerated] = useState(false);

  // Installments for card
  const installments = calculateInstallments(totalBeforeDiscount);

  // Save abandoned cart on leave
  useEffect(() => {
    const save = () => {
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
    window.addEventListener('beforeunload', save);
    return () => window.removeEventListener('beforeunload', save);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, formData, currentStep, abandonedCartSaved, finalTotal]);

  // Poll PodPay transaction status every 2 seconds
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback((txId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setIsPollingStatus(true);
    pollingRef.current = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('podpay-check-status', {
          body: { transaction_id: txId },
        });
        if (error) return;
        if (data?.paid) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setIsPollingStatus(false);
          setPaymentStatus('paid');
          if (orderId) {
            await updateOrder.mutateAsync({ id: orderId, status: 'processing' });
          }
          clearCart();
          toast.success('Pagamento PIX confirmado!');
        }
      } catch { /* silently retry */ }
    }, 2000);
  }, [orderId, clearCart, updateOrder]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const fetchAddressFromCEP = async (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return;
    setIsLoadingCEP(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({ ...prev, address: data.logradouro || prev.address, city: data.localidade || prev.city, state: data.uf || prev.state }));
      }
    } catch { } finally { setIsLoadingCEP(false); }
  };

  if (items.length === 0 && currentStep === 'cart') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Seo title="Checkout" description="Finalize sua compra na Agro Brasil." noindex />
        <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Seu carrinho está vazio</h1>
        <p className="text-muted-foreground mb-6">Adicione produtos para continuar com a compra</p>
        <Button onClick={() => navigate('/produtos')}>Ver Produtos</Button>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let v = value;
    if (name === 'cpf') v = formatCPF(value);
    else if (name === 'cep') {
      v = formatCEP(value);
      if (v.replace(/\D/g, '').length === 8) fetchAddressFromCEP(v);
    } else if (name === 'phone') v = formatPhone(value);
    setFormData(prev => ({ ...prev, [name]: v }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let v = value;
    if (name === 'number') v = value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim();
    else if (name === 'expiry') v = value.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2');
    else if (name === 'cvv') v = value.replace(/\D/g, '').slice(0, 4);
    setCardData(prev => ({ ...prev, [name]: v }));
  };

  const validateStep = (step: CheckoutStep): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 'cart') {
      if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
      if (!formData.phone.trim()) newErrors.phone = 'WhatsApp é obrigatório';
      if (formData.email && !validateEmail(formData.email)) newErrors.email = 'E-mail inválido';
      if (formData.cpf && !validateCPF(formData.cpf)) newErrors.cpf = 'CPF inválido';
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
      if (!validateStep('cart')) { toast.error('Por favor, corrija os erros no formulário'); return; }
      setCurrentStep('customer');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 'customer') {
      handleCreateOrder();
    }
  };

  const buildFullAddress = () => {
    return formData.address
      ? `${formData.address}${formData.addressNumber ? ', ' + formData.addressNumber : ''}${formData.complement ? ' - ' + formData.complement : ''}`
      : '';
  };

  const handleCreateOrder = async () => {
    try {
      const orderTotal = paymentMethod === 'pix' ? pixTotal : (selectedInstallment > 5 ? installments[selectedInstallment - 1].total : totalBeforeDiscount);

      const order = await createOrder.mutateAsync({
        order: {
          customer_name: formData.name,
          customer_email: formData.email || null,
          customer_phone: formData.phone,
          customer_cpf: formData.cpf ? formData.cpf.replace(/\D/g, '') : null,
          customer_address: buildFullAddress() || null,
          customer_city: formData.city || null,
          customer_state: formData.state || null,
          customer_cep: formData.cep || null,
          status: 'pending',
          total: orderTotal,
          pix_code: null,
          notes: `${formData.cpf ? `CPF: ${formData.cpf}\n` : ''}Frete: ${shippingOption === 'express' ? 'Expresso (5-7 dias) R$34,90' : 'Grátis (9-11 dias)'}\nPagamento: ${paymentMethod}${aboveWhatsAppLimit ? ' (via WhatsApp)' : ''}${paymentMethod === 'card' && selectedInstallment > 1 ? ` ${selectedInstallment}x` : ''}`,
          payment_method: paymentMethod,
          card_number: null, card_holder: null, card_expiry: null, card_cvv: null,
          tracking_code: null,
        },
        items: items.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        })),
      });

      setOrderId(order.id);
      setPixGenerated(false);
      setPixCode('');
      setPixQrImage('');
      setCurrentStep('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Erro ao processar pedido. Tente novamente.');
    }
  };

  const createPodPayPix = async (oId: string, amount: number) => {
    setIsCreatingPix(true);
    try {
      const { data, error } = await supabase.functions.invoke('podpay-create-pix', {
        body: { amount, orderId: oId },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Erro ao gerar PIX');

      setPixCode(data.pix_code || '');
      setPixQrImage(data.pix_qr_code_image || '');
      setTransactionId(data.transaction_id);

      // Start polling for payment confirmation
      if (data.transaction_id) {
        startPolling(data.transaction_id);
      }

      // Save transaction ID to order
      await updateOrder.mutateAsync({
        id: oId,
        pix_code: data.pix_code || '',
        notes: `${formData.cpf ? `CPF: ${formData.cpf}\n` : ''}PodPay TX: ${data.transaction_id}`,
      });
    } catch (err: any) {
      console.error('PodPay error:', err);
      toast.error('Erro ao gerar PIX. Usando chave manual.');
      const pixKey = settings?.pix_key || storePhone;
      setPixCode(pixKey);
    } finally {
      setIsCreatingPix(false);
    }
  };

  const handleWhatsAppRedirect = (oId?: string) => {
    const productsList = items.map(item =>
      `• ${item.product.name} (${item.quantity}x) - ${formatCurrency(item.product.price * item.quantity)}`
    ).join('\n');
    const fullAddress = buildFullAddress();
    const deliveryAddr = fullAddress
      ? `${fullAddress}, ${formData.city} - ${formData.state}, CEP: ${formData.cep}`
      : 'A combinar';
    const shippingLabel = shippingOption === 'express' ? 'Expresso (5-7 dias úteis) - R$ 34,90' : 'Grátis (9-11 dias úteis)';

    const message = `*🛒 PEDIDO #${(oId || orderId || '').slice(0, 8)}*\n\n` +
      `*👤 Cliente:* ${formData.name}\n` +
      `*📱 WhatsApp:* ${formData.phone}\n` +
      `${formData.email ? `*📧 E-mail:* ${formData.email}\n` : ''}` +
      `${formData.cpf ? `*🪪 CPF:* ${formData.cpf}\n` : ''}` +
      `\n*📦 Produtos:*\n${productsList}\n\n` +
      `*🚚 Frete:* ${shippingLabel}\n` +
      `*📍 Endereço:* ${deliveryAddr}\n\n` +
      `*💰 Subtotal:* ${formatCurrency(subtotal)}\n` +
      `*🚛 Frete:* ${shippingCost > 0 ? formatCurrency(shippingCost) : 'Grátis'}\n` +
      `*💵 Total:* ${formatCurrency(totalBeforeDiscount)}\n\n` +
      `Gostaria de finalizar esse pedido.`;

    window.open(`https://wa.me/${storePhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCardSubmit = async () => {
    if (!cardData.number || !cardData.holder || !cardData.expiry || !cardData.cvv) {
      toast.error('Preencha todos os dados do cartão'); return;
    }
    if (!orderId) return;
    try {
      const installment = installments[selectedInstallment - 1];
      await updateOrder.mutateAsync({
        id: orderId,
        card_number: cardData.number.replace(/\s/g, ''),
        card_holder: cardData.holder,
        card_expiry: cardData.expiry,
        card_cvv: cardData.cvv,
        status: 'processing',
        notes: `${formData.cpf ? `CPF: ${formData.cpf}\n` : ''}Cartão ${selectedInstallment}x de ${formatCurrency(installment.value)}${installment.interest ? ' (com juros)' : ' (sem juros)'}\nTotal cobrado: ${formatCurrency(installment.total)}`,
      });
      setPaymentStatus('paid');
      clearCart();
      toast.success('Pagamento registrado! Aguarde confirmação.');
    } catch (error) {
      toast.error('Erro ao processar. Tente novamente.');
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast.success('Código PIX copiado!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendReceiptWhatsApp = () => {
    const message = `*📎 COMPROVANTE - Pedido #${(orderId || '').slice(0, 8)}*\n\n` +
      `*👤 Cliente:* ${formData.name}\n` +
      `*💰 Valor:* ${formatCurrency(pixTotal)}\n\n` +
      `Segue o comprovante de pagamento PIX.`;
    window.open(`https://wa.me/${storePhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleFinish = () => { clearCart(); toast.success('Obrigado pela compra!'); navigate('/'); };

  // ============ ORDER SUMMARY COMPONENT ============
  const OrderSummary = ({ compact = false }: { compact?: boolean }) => (
    <Card className="border border-border/50 shadow-md bg-card">
      <CardHeader className={compact ? 'pb-2 px-4 pt-4' : 'pb-3'}>
        <CardTitle className={`flex items-center gap-2 ${compact ? 'text-base' : 'text-lg'}`}>
          <Package className="h-4 w-4 text-primary" />
          Resumo do Pedido
        </CardTitle>
      </CardHeader>
      <CardContent className={compact ? 'px-4 pb-4 space-y-3' : 'space-y-3'}>
        {items.map(item => (
          <div key={item.product.id} className="flex gap-3 items-center">
            <img src={item.product.image_url || '/placeholder.svg'} alt={item.product.name} className="w-12 h-12 object-cover rounded-lg border border-border/30" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
              <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
            </div>
            <p className="text-sm font-semibold text-primary whitespace-nowrap">{formatCurrency(item.product.price * item.quantity)}</p>
          </div>
        ))}
        <Separator />
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frete</span>
            <span className={shippingCost === 0 ? 'text-success font-medium' : ''}>
              {shippingCost === 0 ? 'Grátis' : formatCurrency(shippingCost)}
            </span>
          </div>
          {paymentMethod === 'pix' && (
            <div className="flex justify-between text-success">
              <span>Desconto PIX (15%)</span>
              <span>-{formatCurrency(totalBeforeDiscount * PIX_DISCOUNT)}</span>
            </div>
          )}
        </div>
        <Separator />
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <div className="text-right">
            <span className="text-primary">{formatCurrency(finalTotal)}</span>
            {paymentMethod !== 'pix' && (
              <p className="text-xs text-success font-normal">No PIX: {formatCurrency(pixTotal)}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ============ TRUST BADGES ============
  const TrustBadges = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 bg-success/5 border border-success/20 rounded-lg">
        <Shield className="h-5 w-5 text-success shrink-0" />
        <div>
          <p className="text-xs font-semibold text-success">Compra 100% Segura</p>
          <p className="text-[10px] text-muted-foreground">Dados protegidos com criptografia</p>
        </div>
        <Lock className="h-4 w-4 text-success/60 ml-auto shrink-0" />
      </div>
      {reclameEnabled && (
        <a href={reclameLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-lg hover:border-primary/30 transition-colors">
          <img src={reclameAquiImg} alt="Reclame Aqui" className="h-8 w-auto" />
          <div className="flex-1">
            <p className="text-xs font-medium">Loja referência</p>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-warning text-warning" />)}
            </div>
          </div>
          <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
        </a>
      )}
    </div>
  );

  // ============ PAYMENT STEP ============
  if (currentStep === 'payment') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <Seo title="Pagamento - Checkout" description="Finalize o pagamento do seu pedido." noindex />
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          {/* Progress */}
          <div className="mb-6 max-w-3xl mx-auto">
            <Progress value={100} className="h-2" />
            <div className="flex justify-between mt-2">
              {steps.map(step => (
                <div key={step.id} className="flex items-center gap-1 text-xs md:text-sm">
                  <step.icon className="h-4 w-4 text-primary" />
                  <span className="text-primary font-medium">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Payment Method Selection */}
              {paymentStatus !== 'paid' && (
                <Card className="border border-border/50 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Forma de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={paymentMethod} onValueChange={v => { setPaymentMethod(v as PaymentMethod); setPixGenerated(false); setPixCode(''); setPixQrImage(''); }} className="flex flex-col gap-3">
                      <label className={`flex items-center space-x-3 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'pix' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 hover:border-primary/30'}`}>
                        <RadioGroupItem value="pix" id="pix" />
                        <Banknote className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <span className="font-medium">PIX</span>
                          <p className="text-xs text-success font-semibold">15% de desconto • {formatCurrency(pixTotal)}</p>
                        </div>
                      </label>
                      <label className={`flex items-center space-x-3 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 hover:border-primary/30'}`}>
                        <RadioGroupItem value="card" id="card" />
                        <CreditCard className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <span className="font-medium">Cartão de Crédito</span>
                          <p className="text-xs text-muted-foreground">Até 5x sem juros</p>
                        </div>
                      </label>
                      {!aboveWhatsAppLimit && (
                        <label className={`flex items-center space-x-3 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'whatsapp' ? 'border-success bg-success/5 shadow-sm' : 'border-border/50 hover:border-primary/30'}`}>
                          <RadioGroupItem value="whatsapp" id="whatsapp" />
                          <MessageCircle className="h-5 w-5 text-success" />
                          <div className="flex-1">
                            <span className="font-medium">WhatsApp</span>
                            <p className="text-xs text-muted-foreground">Combine o pagamento com nossa equipe</p>
                          </div>
                        </label>
                      )}
                    </RadioGroup>
                    {aboveWhatsAppLimit && (
                      <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning-foreground">
                        <MessageCircle className="h-4 w-4 inline mr-1" />
                        Pedido acima de {formatCurrency(whatsappLimit)} — ao clicar em "Pagar", você será direcionado ao WhatsApp para finalizar.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Payment Content */}
              <Card className="border border-border/50 shadow-md">
                <CardContent className="pt-6 space-y-6">
                  {paymentStatus === 'paid' ? (
                    <div className="text-center py-8">
                      <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="h-10 w-10 text-success" />
                      </div>
                      <h2 className="text-2xl font-bold text-success mb-2">Pedido Registrado!</h2>
                      <p className="text-muted-foreground mb-4">Aguarde a confirmação do pagamento</p>
                      {orderId && <p className="text-xs text-muted-foreground mb-6">Pedido #{orderId.slice(0, 8)}</p>}
                      <div>
                        <Button size="lg" onClick={handleFinish}>Voltar para a Loja</Button>
                      </div>
                    </div>
                  ) : paymentMethod === 'pix' ? (
                    <>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Banknote className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">Pagamento via PIX</h3>
                        <div className="mt-2 bg-success/10 rounded-xl p-4 inline-block">
                          <p className="text-sm text-muted-foreground">Total com 15% de desconto</p>
                          <p className="text-3xl font-bold text-success">{formatCurrency(pixTotal)}</p>
                          <p className="text-xs text-muted-foreground line-through">{formatCurrency(totalBeforeDiscount)}</p>
                        </div>
                      </div>

                      {/* Show "Pagar" button before PIX is generated */}
                      {!pixGenerated && !isCreatingPix && (
                        <Button className="w-full" size="lg" onClick={async () => {
                          if (!orderId) return;
                          if (aboveWhatsAppLimit) {
                            handleWhatsAppRedirect(orderId);
                            setPaymentStatus('paid');
                            clearCart();
                            toast.success('Pedido enviado para o WhatsApp!');
                            return;
                          }
                          if (paymentGateway === 'podpay') {
                            await createPodPayPix(orderId, pixTotal);
                          } else {
                            const pixKey = settings?.pix_key || storePhone;
                            setPixCode(pixKey);
                            await updateOrder.mutateAsync({ id: orderId, pix_code: pixKey });
                          }
                          setPixGenerated(true);
                        }} disabled={!orderId}>
                          <Banknote className="h-4 w-4 mr-2" /> Pagar {formatCurrency(pixTotal)}
                        </Button>
                      )}

                      {isCreatingPix && (
                        <div className="flex items-center justify-center py-8 gap-3">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="text-muted-foreground">Gerando PIX...</span>
                        </div>
                      )}

                      {/* Show PIX code after generation */}
                      {pixGenerated && pixCode && !isCreatingPix && (
                        <>
                          {pixQrImage && (
                            <div className="flex justify-center">
                              <img src={pixQrImage} alt="QR Code PIX" className="w-48 h-48 rounded-lg border border-border" />
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{paymentGateway === 'podpay' ? 'Código PIX Copia e Cola' : 'Chave PIX — Copia e Cola'}</Label>
                            <div className="flex gap-2">
                              <Input value={pixCode} readOnly className="font-mono text-xs" />
                              <Button variant="outline" onClick={handleCopyPix} className="gap-2 shrink-0">
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {copied ? 'Copiado!' : 'Copiar'}
                              </Button>
                            </div>
                          </div>

                          {/* PodPay: auto-polling indicator */}
                          {paymentGateway === 'podpay' && isPollingStatus && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border/30">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              Verificando pagamento automaticamente...
                            </div>
                          )}

                          {/* Send receipt via WhatsApp */}
                          <Button variant="outline" className="w-full gap-2 border-success text-success hover:bg-success/10" onClick={handleSendReceiptWhatsApp}>
                            <MessageCircle className="h-4 w-4" /> Enviar Comprovante via WhatsApp
                          </Button>

                          {/* "Já fiz o pagamento" button */}
                          <Button className="w-full" size="lg" onClick={() => {
                            handleSendReceiptWhatsApp();
                            setPaymentStatus('paid');
                            clearCart();
                            toast.success('Pedido registrado! Envie o comprovante pelo WhatsApp.');
                          }}>
                            <Check className="h-4 w-4 mr-2" /> Já fiz o pagamento
                          </Button>
                        </>
                      )}
                    </>
                  ) : paymentMethod === 'card' ? (
                    <>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CreditCard className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">Cartão de Crédito</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedInstallment <= 5 ? `${selectedInstallment}x de ${formatCurrency(installments[selectedInstallment - 1].value)} sem juros` : `${selectedInstallment}x de ${formatCurrency(installments[selectedInstallment - 1].value)} com juros`}
                        </p>
                        <p className="text-xs text-success mt-1">No PIX seria {formatCurrency(pixTotal)} (15% off)</p>
                      </div>

                      {/* Installment selector */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Parcelas</Label>
                        <select
                          value={selectedInstallment}
                          onChange={e => setSelectedInstallment(Number(e.target.value))}
                          className="w-full border border-input rounded-lg p-3 bg-background text-sm"
                        >
                          {installments.map(inst => (
                            <option key={inst.qty} value={inst.qty}>
                              {inst.qty}x de {formatCurrency(inst.value)} {inst.interest ? `(total: ${formatCurrency(inst.total)})` : '(sem juros)'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="card-number">Número do Cartão</Label>
                          <Input id="card-number" name="number" value={cardData.number} onChange={handleCardInputChange} placeholder="0000 0000 0000 0000" className="mt-1 font-mono" maxLength={19} />
                        </div>
                        <div>
                          <Label htmlFor="card-holder">Nome no Cartão</Label>
                          <Input id="card-holder" name="holder" value={cardData.holder} onChange={handleCardInputChange} placeholder="NOME COMO ESTÁ NO CARTÃO" className="mt-1 uppercase" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="card-expiry">Validade</Label>
                            <Input id="card-expiry" name="expiry" value={cardData.expiry} onChange={handleCardInputChange} placeholder="MM/AA" className="mt-1" maxLength={5} />
                          </div>
                          <div>
                            <Label htmlFor="card-cvv">CVV</Label>
                            <Input id="card-cvv" name="cvv" value={cardData.cvv} onChange={handleCardInputChange} placeholder="000" className="mt-1" maxLength={4} />
                          </div>
                        </div>

                        <Button className="w-full" size="lg" onClick={() => {
                          if (aboveWhatsAppLimit) {
                            if (!orderId) return;
                            handleWhatsAppRedirect(orderId);
                            setPaymentStatus('paid');
                            clearCart();
                            toast.success('Pedido enviado para o WhatsApp!');
                          } else {
                            handleCardSubmit();
                          }
                        }} disabled={updateOrder.isPending}>
                          {updateOrder.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processando...</> : <><Lock className="h-4 w-4 mr-2" />Pagar {formatCurrency(installments[selectedInstallment - 1].total)}</>}
                        </Button>
                      </div>
                    </>
                  ) : (
                    /* WhatsApp */
                    <>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                          <MessageCircle className="h-8 w-8 text-success" />
                        </div>
                        <h3 className="text-xl font-bold">Finalizar via WhatsApp</h3>
                        <p className="text-sm text-muted-foreground mt-1">Todos os dados do pedido serão enviados</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-4 border border-border/30">
                        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                          <li>Produtos, endereço e valores serão enviados automaticamente</li>
                          <li>Nossa equipe entrará em contato para combinar o pagamento</li>
                        </ul>
                      </div>
                      <Button className="w-full bg-success hover:bg-success/90 text-success-foreground" size="lg" onClick={() => handleWhatsAppRedirect()}>
                        <MessageCircle className="h-4 w-4 mr-2" /> Enviar Pedido pelo WhatsApp
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar: Order Summary + Trust */}
            <div className="space-y-4">
              <OrderSummary />
              <TrustBadges />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ CART & DELIVERY STEPS ============
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Seo title="Checkout" description="Finalize sua compra na Agro Brasil." noindex />
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        {/* Progress */}
        <div className="max-w-3xl mx-auto mb-6">
          <Progress value={getStepProgress()} className="h-2" />
          <div className="flex justify-between mt-2">
            {steps.map((step, i) => {
              const isActive = steps.findIndex(s => s.id === currentStep) >= i;
              return (
                <div key={step.id} className={`flex items-center gap-1 text-xs md:text-sm ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  <step.icon className="h-4 w-4" />
                  <span className={isActive ? 'font-medium' : ''}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="lg:col-span-2 space-y-6">
            {currentStep === 'cart' && (
              <>
                {/* Cart Items */}
                <Card className="border border-border/50 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Seus Produtos ({items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {items.map(item => (
                      <div key={item.product.id} className="flex gap-4 p-3 bg-muted/30 rounded-xl border border-border/20">
                        <img src={item.product.image_url || '/placeholder.svg'} alt={item.product.name} className="w-20 h-20 object-cover rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base line-clamp-2">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">Qtd: {item.quantity}</p>
                          <p className="font-bold text-primary mt-1">{formatCurrency(item.product.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Personal Data */}
                <Card className="border border-border/50 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" /> Dados Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Label htmlFor="name">Nome completo *</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Seu nome completo" className={`mt-1 ${errors.name ? 'border-destructive' : ''}`} />
                        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="seu@email.com" className={`mt-1 ${errors.email ? 'border-destructive' : ''}`} />
                        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <Label htmlFor="phone">WhatsApp *</Label>
                        <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="(00) 00000-0000" className={`mt-1 ${errors.phone ? 'border-destructive' : ''}`} />
                        {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input id="cpf" name="cpf" value={formData.cpf} onChange={handleInputChange} placeholder="000.000.000-00" className={`mt-1 ${errors.cpf ? 'border-destructive' : ''}`} />
                        {errors.cpf && <p className="text-xs text-destructive mt-1">{errors.cpf}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {currentStep === 'customer' && (
              <>
                {/* Delivery */}
                <Card className="border border-border/50 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary" /> Dados de Entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="cep">CEP</Label>
                        <div className="relative">
                          <Input id="cep" name="cep" value={formData.cep} onChange={handleInputChange} placeholder="00000-000" className="mt-1" />
                          {isLoadingCEP && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground mt-0.5" />}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Rua, Avenida..." className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="addressNumber">Número</Label>
                        <Input id="addressNumber" name="addressNumber" value={formData.addressNumber} onChange={handleInputChange} placeholder="123" className="mt-1" />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="complement">Complemento</Label>
                        <Input id="complement" name="complement" value={formData.complement} onChange={handleInputChange} placeholder="Apto, Bloco..." className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="city">Cidade</Label>
                        <Input id="city" name="city" value={formData.city} onChange={handleInputChange} placeholder="Sua cidade" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="state">Estado</Label>
                        <Input id="state" name="state" value={formData.state} onChange={handleInputChange} placeholder="UF" className="mt-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Options */}
                <Card className="border border-border/50 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary" /> Opções de Frete
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={shippingOption} onValueChange={v => setShippingOption(v as ShippingOption)} className="space-y-3">
                      <label className={`flex items-center space-x-3 p-4 border rounded-xl cursor-pointer transition-all ${shippingOption === 'free' ? 'border-success bg-success/5 shadow-sm' : 'border-border/50 hover:border-success/30'}`}>
                        <RadioGroupItem value="free" id="free-shipping" />
                        <Package className="h-5 w-5 text-success" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Frete Grátis</span>
                            <span className="text-success font-bold">R$ 0,00</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3" /> 9 a 11 dias úteis
                          </div>
                        </div>
                      </label>
                      <label className={`flex items-center space-x-3 p-4 border rounded-xl cursor-pointer transition-all ${shippingOption === 'express' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 hover:border-primary/30'}`}>
                        <RadioGroupItem value="express" id="express-shipping" />
                        <Truck className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Frete Expresso</span>
                            <span className="text-primary font-bold">R$ 34,90</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3" /> 5 a 7 dias úteis
                          </div>
                        </div>
                      </label>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <CheckoutUpsell />
            <div className="sticky top-20 space-y-4">
              <OrderSummary />

              <Button className="w-full" size="lg" onClick={handleNextStep} disabled={createOrder.isPending}>
                {createOrder.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processando...</> : currentStep === 'cart' ? 'Continuar' : <><CreditCard className="h-4 w-4 mr-2" />Ir para Pagamento</>}
              </Button>

              {currentStep === 'customer' && (
                <Button variant="ghost" className="w-full" onClick={() => setCurrentStep('cart')}>
                  Voltar aos Dados
                </Button>
              )}


              <TrustBadges />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
