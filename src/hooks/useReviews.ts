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

// Generate fake reviews for products
export function generateFakeReviews(productId: string, count: number): Omit<Review, 'id' | 'created_at'>[] {
  const reviewerNames = [
    'Maria Silva', 'João Santos', 'Ana Costa', 'Carlos Oliveira', 'Patricia Lima',
    'Fernando Souza', 'Juliana Pereira', 'Ricardo Almeida', 'Camila Ferreira', 'Bruno Ribeiro',
    'Luciana Martins', 'Rafael Rodrigues', 'Gabriela Mendes', 'Thiago Gomes', 'Beatriz Nunes',
    'Diego Carvalho', 'Larissa Araújo', 'Marcos Dias', 'Amanda Barbosa', 'Lucas Moreira',
    'Fernanda Rocha', 'Gustavo Lopes', 'Isabela Cardoso', 'Pedro Teixeira', 'Renata Pinto',
    'André Castro', 'Vanessa Correia', 'Felipe Azevedo', 'Natália Vieira', 'Rodrigo Nascimento'
  ];

  const positiveComments = [
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
    'Produto de primeira linha, acabamento perfeito!',
    'Superou expectativas, chegou rápido e bem embalado.',
    'Ótima opção para quem busca qualidade e bom preço.',
    'Estou muito satisfeito com minha compra, recomendo!',
    'Produto fantástico, voltarei a comprar com certeza.',
    'Atendimento excelente e produto de alta qualidade.',
    'Melhor loja para comprar, produtos sempre originais!',
    'Frete rápido e produto impecável, nota máxima!',
    'Qualidade surpreendente pelo preço, muito bom!',
    'Produto chegou certinho, sem nenhum problema.',
    'Recomendo de olhos fechados, produto top demais!',
    'Comprei com receio mas o produto é excelente!',
    'Superou todas as expectativas, muito satisfeito!',
    'Produto de qualidade premium, adorei a compra!',
    'Experiência de compra perfeita do início ao fim.'
  ];

  const reviews: Omit<Review, 'id' | 'created_at'>[] = [];
  const usedNames = new Set<string>();
  const usedComments = new Set<string>();

  for (let i = 0; i < count; i++) {
    // Get unique reviewer name
    let name = reviewerNames[Math.floor(Math.random() * reviewerNames.length)];
    while (usedNames.has(name) && usedNames.size < reviewerNames.length) {
      name = reviewerNames[Math.floor(Math.random() * reviewerNames.length)];
    }
    usedNames.add(name);

    // Get unique comment
    let comment = positiveComments[Math.floor(Math.random() * positiveComments.length)];
    while (usedComments.has(comment) && usedComments.size < positiveComments.length) {
      comment = positiveComments[Math.floor(Math.random() * positiveComments.length)];
    }
    usedComments.add(comment);

    // Rating between 4 and 5 (positive reviews)
    const rating = Math.random() > 0.3 ? 5 : 4;

    reviews.push({
      product_id: productId,
      reviewer_name: name,
      rating,
      comment,
    });
  }

  return reviews;
}
