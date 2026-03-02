const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
const firstNames = [
  'João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Juliana', 'Rafael', 'Fernanda',
  'Lucas', 'Camila', 'Bruno', 'Patricia', 'Diego', 'Larissa', 'Thiago'
];
const lastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Almeida',
  'Nascimento', 'Lima', 'Araújo', 'Pereira', 'Costa', 'Carvalho', 'Gomes', 'Martins'
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomCPF(): string {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  // Avoid all-same digits
  if (digits.every(d => d === digits[0])) digits[8] = (digits[0] + 1) % 10;

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

  // PodPay espera documento apenas com números
  return digits.join('');
}

function randomPhone(): string {
  // Valid Brazilian DDDs
  const ddds = ['11','21','31','41','51','61','71','81','91','27','47','48','43','44','62','65','67','79','82','83','84','85','86','87','88','92','96','98','99'];
  const ddd = randomItem(ddds);
  // Mobile numbers start with 9
  const num = '9' + String(Math.floor(Math.random() * 90000000) + 10000000);
  // PodPay espera telefone apenas com números
  return `${ddd}${num}`;
}

function randomEmail(name: string): string {
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com.br', 'hotmail.com'];
  const clean = name
    .toLowerCase()
    .replace(/\s+/g, '.')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return `${clean}${Math.floor(Math.random() * 999)}@${randomItem(domains)}`;
}

// ✅ Pega o "copia e cola" (BR Code / EMV) mesmo se a API mudar o nome do campo
function pickPixCode(payload: any): string {
  if (!payload) return '';

  const pix = payload.pix ?? payload;

  return (
    pix.copy_paste ||
    pix.copyPaste ||
    pix.emv ||
    pix.payload ||
    pix.brcode ||
    pix.code ||
    pix.qr_code ||
    pix.qrCode ||
    payload.pixQrCode ||
    payload.pix_qr_code ||
    payload.copyAndPaste ||
    ''
  );
}

// ✅ Pega imagem/URL do QR Code com fallback
function pickPixQrImage(payload: any): string {
  if (!payload) return '';

  const pix = payload.pix ?? payload;

  return (
    pix.qr_code_image ||
    pix.qrCodeImage ||
    pix.qr_code_url ||
    pix.qrCodeUrl ||
    pix.qr_image_url ||
    pix.qrImageUrl ||
    payload.pixQrCodeImage ||
    payload.pix_qr_code_image ||
    ''
  );
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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
    const amountCentavos = Math.round(Number(amount) * 100);
    const cpfDigits = cpf.replace(/\D/g, '');
    const phoneDigits = phone.replace(/\D/g, '');

    const body = {
      amount: amountCentavos,
      paymentMethod: 'pix',
      pix: {
        expiresInSeconds: 3600,
      },
      customer: {
        name: fullName,
        email: email,
        document: {
          type: 'cpf',
          number: cpfDigits,
        },
        phone: phoneDigits,
        type: 'individual',
      },
      items: [
        {
          title: courseName,
          quantity: 1,
          unitPrice: amountCentavos,
          tangible: false,
        },
      ],
      externalRef: orderId || `order_${Date.now()}`,
    };

    console.log('Creating PodPay PIX transaction, full body:', JSON.stringify(body));

    const createRes = await fetch('https://api.podpay.app/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretKey}`,
      },
      body: JSON.stringify(body),
    });

    const createJson = await createRes.json();
    console.log('PodPay response status:', createRes.status);
    console.log('PodPay response:', JSON.stringify(createJson));

    if (!createRes.ok || !createJson.success) {
      throw new Error(createJson.error?.message || createJson.message || `PodPay API error: ${createRes.status}`);
    }

    // ⚠️ txData mutável porque vamos tentar buscar depois se vier pix vazio
    let txData = createJson.data;

    let pixCode = pickPixCode(txData);
    let pixQr = pickPixQrImage(txData);

    // 🔥 PodPay pode demorar para anexar o código PIX no retorno do POST
    if (!pixCode) {
      for (let i = 0; i < 4; i++) {
        await sleep(900);

        const getRes = await fetch(`https://api.podpay.app/v1/transactions/${txData.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${secretKey}`,
          },
        });

        const getJson = await getRes.json();

        if (getRes.ok && getJson?.success && getJson?.data) {
          txData = getJson.data;
          pixCode = pixCode || pickPixCode(txData);
          pixQr = pixQr || pickPixQrImage(txData);
        }

        if (pixCode) break;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: txData.id,
        pix_code: pixCode,                // ✅ copia e cola
        pix_qr_code_image: pixQr,         // ✅ imagem/URL QR
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
