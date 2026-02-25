const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Random course names for product masking
const courseNames = [
  'Curso de Marketing Digital Avançado',
  'Masterclass em Fotografia',
  'Curso de Gestão Empresarial',
  'Formação em Design Gráfico',
  'Curso de Excel Avançado',
  'Mentoria de Vendas Online',
  'Curso de Oratória e Comunicação',
  'Formação em Liderança',
  'Curso de Finanças Pessoais',
  'Masterclass em Produtividade',
  'Curso de Inglês Intensivo',
  'Formação em Coaching',
  'Curso de Programação Web',
  'Mentoria de Carreira',
  'Curso de Inteligência Emocional',
];

// Random names for customer masking
const firstNames = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Juliana', 'Rafael', 'Fernanda', 'Lucas', 'Camila', 'Bruno', 'Patricia', 'Diego', 'Larissa', 'Thiago'];
const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Almeida', 'Nascimento', 'Lima', 'Araújo', 'Pereira', 'Costa', 'Carvalho', 'Gomes', 'Martins'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomCPF(): string {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  // Calculate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
  let r = (sum * 10) % 11;
  if (r >= 10) r = 0;
  digits.push(r);
  sum = 0;
  for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
  r = (sum * 10) % 11;
  if (r >= 10) r = 0;
  digits.push(r);
  return digits.join('');
}

function randomPhone(): string {
  const ddd = String(11 + Math.floor(Math.random() * 80)).padStart(2, '0');
  const num = String(Math.floor(Math.random() * 900000000) + 100000000);
  return `${ddd}${num}`;
}

function randomEmail(name: string): string {
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com.br', 'hotmail.com'];
  const clean = name.toLowerCase().replace(/\s+/g, '.').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return `${clean}${Math.floor(Math.random() * 999)}@${randomItem(domains)}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, orderId } = await req.json();

    const secretKey = Deno.env.get('PODPAY_SECRET_KEY');
    if (!secretKey) {
      throw new Error('PODPAY_SECRET_KEY not configured');
    }

    // Generate random customer data for privacy
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const fullName = `${firstName} ${lastName}`;
    const cpf = randomCPF();
    const phone = randomPhone();
    const email = randomEmail(fullName);

    // Generate random course name as product
    const courseName = randomItem(courseNames);

    // Amount is already in BRL, convert to centavos
    const amountCentavos = Math.round(amount * 100);

    const body = {
      amount: amountCentavos,
      payment_method: 'pix',
      customer: {
        name: fullName,
        email: email,
        document: cpf,
        phone: phone,
      },
      items: [
        {
          title: courseName,
          quantity: 1,
          unit_price: amountCentavos,
          tangible: false,
        },
      ],
      metadata: {
        order_id: orderId,
      },
    };

    console.log('Creating PodPay PIX transaction:', { amountCentavos, orderId, courseName, customerName: fullName });

    const response = await fetch('https://api.podpay.app/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretKey}`,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    console.log('PodPay response status:', response.status);
    console.log('PodPay response:', JSON.stringify(result));

    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || `PodPay API error: ${response.status}`);
    }

    const txData = result.data;

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: txData.id,
        pix_code: txData.pix?.qr_code || txData.pix?.copy_paste || '',
        pix_qr_code_image: txData.pix?.qr_code_image || txData.pix?.qr_code_url || '',
        status: txData.status,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('PodPay error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
