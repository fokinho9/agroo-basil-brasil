import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Review } from '@/types';

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
    enabled: !!productId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: Omit<Review, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('reviews')
        .insert(review)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.product_id] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

// Generate fake reviews contextualized to the product
export function generateFakeReviews(productId: string, count: number, productName?: string): Omit<Review, 'id' | 'created_at'>[] {
  const reviewerNames = [
    'Maria Silva', 'João Santos', 'Ana Costa', 'Carlos Oliveira', 'Patricia Lima',
    'Fernando Souza', 'Juliana Pereira', 'Ricardo Almeida', 'Camila Ferreira', 'Bruno Ribeiro',
    'Luciana Martins', 'Rafael Rodrigues', 'Gabriela Mendes', 'Thiago Gomes', 'Beatriz Nunes',
    'Diego Carvalho', 'Larissa Araújo', 'Marcos Dias', 'Amanda Barbosa', 'Lucas Moreira',
    'Fernanda Rocha', 'Gustavo Lopes', 'Isabela Cardoso', 'Pedro Teixeira', 'Renata Pinto',
    'André Castro', 'Vanessa Correia', 'Felipe Azevedo', 'Natália Vieira', 'Rodrigo Nascimento'
  ];

  // Generic positive comments
  const genericComments = [
    'Produto excelente! Superou minhas expectativas. Recomendo muito!',
    'Entrega rápida e produto de alta qualidade. Muito satisfeito!',
    'Ótimo custo-benefício, vou comprar novamente com certeza.',
    'Perfeito para o que eu precisava. Atendimento impecável!',
    'Produto chegou antes do prazo e em perfeitas condições.',
    'Qualidade impressionante, vale cada centavo investido.',
    'Já é a terceira vez que compro aqui, sempre satisfeito!',
    'Produto muito bem embalado e de excelente qualidade.',
    'Atendeu todas as minhas expectativas, super recomendo!',
    'Melhor compra que fiz esse ano, produto sensacional!',
    'Fiquei muito feliz com a qualidade, nota 10!',
    'Produto resistente e durável, exatamente como descrito.',
    'Comprei para presente e a pessoa amou, muito bom!',
    'Preço justo para a qualidade oferecida, aprovado!',
    'Já indiquei para vários amigos, todos gostaram.',
  ];

  // Contextual comments based on product name keywords
  const contextualComments: Record<string, string[]> = {
    'manta': [
      'Manta de excelente qualidade, meu cavalo ficou super confortável!',
      'Acabamento perfeito, protege muito bem o dorso do animal.',
      'Manta muito macia e resistente, uso todos os dias no treino.',
      'Material top, não esquenta demais e absorve bem o impacto.',
    ],
    'sela': [
      'Sela muito confortável, tanto pro cavaleiro quanto pro cavalo!',
      'Acabamento impecável, couro de primeira qualidade.',
      'Uso pra treino de tambor e é perfeita, super leve.',
      'Sela resistente e bonita, valeu o investimento!',
    ],
    'cabresto': [
      'Cabresto muito resistente, material de primeira!',
      'Personalização ficou linda, todos elogiam no haras.',
      'Durável e bonito, já comprei vários pra toda a tropa.',
    ],
    'freio': [
      'Freio de ótima qualidade, bocal suave pro cavalo.',
      'Acabamento impecável, meu cavalo aceitou super bem.',
      'Material resistente, inox de verdade, não enferruja.',
    ],
    'bota': [
      'Bota muito confortável e resistente, uso todo dia!',
      'Qualidade excelente, couro macio e durável.',
      'Perfeita para o trabalho no campo, super recomendo.',
    ],
    'espora': [
      'Espora de qualidade, acabamento impecável!',
      'Material resistente e design bonito, adorei.',
      'Perfeita, fivela de inox muito boa.',
    ],
    'camis': [
      'Camiseta muito confortável, tecido de qualidade!',
      'Estampa bonita e não desbota na lavagem.',
      'Ótimo caimento, comprei de várias cores.',
    ],
    'rédea': [
      'Rédea de couro excelente, muito resistente!',
      'Acabamento top, pegada firme e confortável.',
      'Material durável, uso diariamente sem problemas.',
    ],
    'cabeçada': [
      'Cabeçada linda, couro de primeira qualidade!',
      'Ajuste perfeito, meu cavalo ficou muito bonito.',
      'Resistente e com acabamento impecável.',
    ],
    'chapéu': [
      'Chapéu lindo e resistente, protege bem do sol!',
      'Acabamento excelente, tamanho perfeito.',
      'Uso todo dia no campo, durável e confortável.',
    ],
  };

  // Find contextual comments for the product
  const productLower = (productName || '').toLowerCase();
  let relevantComments = [...genericComments];
  
  for (const [keyword, comments] of Object.entries(contextualComments)) {
    if (productLower.includes(keyword)) {
      relevantComments = [...comments, ...genericComments];
      break;
    }
  }

  const reviews: Omit<Review, 'id' | 'created_at'>[] = [];
  const usedNames = new Set<string>();
  const usedComments = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name = reviewerNames[Math.floor(Math.random() * reviewerNames.length)];
    while (usedNames.has(name) && usedNames.size < reviewerNames.length) {
      name = reviewerNames[Math.floor(Math.random() * reviewerNames.length)];
    }
    usedNames.add(name);

    let comment = relevantComments[Math.floor(Math.random() * relevantComments.length)];
    while (usedComments.has(comment) && usedComments.size < relevantComments.length) {
      comment = relevantComments[Math.floor(Math.random() * relevantComments.length)];
    }
    usedComments.add(comment);

    // Rating: mix of 3-5 stars (mostly 4-5)
    const rand = Math.random();
    const rating = rand > 0.85 ? 3 : rand > 0.4 ? 5 : 4;

    // Random date in the last 6 months
    const daysAgo = Math.floor(Math.random() * 180) + 1;
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() - daysAgo);

    reviews.push({
      product_id: productId,
      reviewer_name: name,
      rating,
      comment,
      display_date: reviewDate.toISOString(),
    });
  }

  return reviews;
}
