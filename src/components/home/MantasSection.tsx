import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';

function useMantasProducts(limit: number = 8) {
  return useQuery({
    queryKey: ['products', 'mantas', limit],
    queryFn: async () => {
      // First get the mantas category
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', 'mantas')
        .single();

      if (!category) return [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('active', true)
        .eq('category_id', category.id)
        .gt('price', 0)
        .lte('price', 500)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Product[];
    },
  });
}

export function MantasSection() {
  const { data: products, isLoading } = useMantasProducts(8);

  if (!isLoading && (!products || products.length === 0)) {
    return null;
  }

  return (
    <section className="py-12 md:py-20 relative overflow-hidden">
      {/* Earth/Soil Background Layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-950 via-amber-900 to-amber-800" />
      
      {/* Soil texture overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Grass at the top */}
      <div className="absolute top-0 left-0 right-0 h-24 md:h-32">
        {/* Multiple grass blade layers */}
        <svg 
          className="absolute bottom-0 left-0 w-full h-full" 
          viewBox="0 0 1200 100" 
          preserveAspectRatio="none"
        >
          {/* Back layer grass - darker */}
          <path 
            d="M0,100 L0,60 Q10,20 20,60 Q30,30 40,65 Q50,25 60,55 Q70,35 80,60 Q90,20 100,55 Q110,40 120,65 Q130,25 140,60 Q150,35 160,55 Q170,20 180,60 Q190,30 200,55 Q210,25 220,65 Q230,40 240,55 Q250,20 260,60 Q270,35 280,55 Q290,25 300,60 Q310,30 320,65 Q330,20 340,55 Q350,40 360,60 Q370,25 380,55 Q390,35 400,60 Q410,20 420,55 Q430,30 440,65 Q450,25 460,55 Q470,35 480,60 Q490,20 500,55 Q510,40 520,60 Q530,25 540,55 Q550,35 560,60 Q570,20 580,65 Q590,30 600,55 Q610,25 620,60 Q630,40 640,55 Q650,20 660,60 Q670,35 680,55 Q690,25 700,60 Q710,30 720,65 Q730,20 740,55 Q750,40 760,60 Q770,25 780,55 Q790,35 800,60 Q810,20 820,55 Q830,30 840,65 Q850,25 860,55 Q870,40 880,60 Q890,20 900,55 Q910,35 920,60 Q930,25 940,55 Q950,30 960,65 Q970,20 980,55 Q990,40 1000,60 Q1010,25 1020,55 Q1030,35 1040,60 Q1050,20 1060,55 Q1070,30 1080,65 Q1090,25 1100,55 Q1110,40 1120,60 Q1130,25 1140,55 Q1150,35 1160,60 Q1170,20 1180,55 Q1190,40 1200,60 L1200,100 Z" 
            fill="#2d5016"
            className="animate-pulse"
            style={{ animationDuration: '4s' }}
          />
          {/* Middle layer grass */}
          <path 
            d="M0,100 L0,70 Q15,35 30,70 Q45,45 60,75 Q75,40 90,70 Q105,50 120,75 Q135,35 150,70 Q165,55 180,75 Q195,40 210,70 Q225,50 240,75 Q255,35 270,70 Q285,55 300,75 Q315,40 330,70 Q345,50 360,75 Q375,35 390,70 Q405,55 420,75 Q435,40 450,70 Q465,50 480,75 Q495,35 510,70 Q525,55 540,75 Q555,40 570,70 Q585,50 600,75 Q615,35 630,70 Q645,55 660,75 Q675,40 690,70 Q705,50 720,75 Q735,35 750,70 Q765,55 780,75 Q795,40 810,70 Q825,50 840,75 Q855,35 870,70 Q885,55 900,75 Q915,40 930,70 Q945,50 960,75 Q975,35 990,70 Q1005,55 1020,75 Q1035,40 1050,70 Q1065,50 1080,75 Q1095,35 1110,70 Q1125,55 1140,75 Q1155,40 1170,70 Q1185,50 1200,75 L1200,100 Z" 
            fill="#3d6b1e"
          />
          {/* Front layer grass - lighter */}
          <path 
            d="M0,100 L0,80 Q20,55 40,80 Q60,60 80,82 Q100,55 120,80 Q140,65 160,82 Q180,55 200,80 Q220,60 240,82 Q260,55 280,80 Q300,65 320,82 Q340,55 360,80 Q380,60 400,82 Q420,55 440,80 Q460,65 480,82 Q500,55 520,80 Q540,60 560,82 Q580,55 600,80 Q620,65 640,82 Q660,55 680,80 Q700,60 720,82 Q740,55 760,80 Q780,65 800,82 Q820,55 840,80 Q860,60 880,82 Q900,55 920,80 Q940,65 960,82 Q980,55 1000,80 Q1020,60 1040,82 Q1060,55 1080,80 Q1100,65 1120,82 Q1140,55 1160,80 Q1180,60 1200,82 L1200,100 Z" 
            fill="#4a7c23"
          />
        </svg>
      </div>

      {/* Grass blades decorations - scattered */}
      <div className="absolute top-0 left-[10%] w-2 h-16 bg-gradient-to-t from-green-700 to-green-500 rounded-t-full transform -rotate-6 origin-bottom" />
      <div className="absolute top-0 left-[15%] w-1.5 h-20 bg-gradient-to-t from-green-800 to-green-600 rounded-t-full transform rotate-3 origin-bottom" />
      <div className="absolute top-0 left-[25%] w-2 h-14 bg-gradient-to-t from-green-700 to-green-500 rounded-t-full transform -rotate-12 origin-bottom" />
      <div className="absolute top-0 right-[20%] w-1.5 h-18 bg-gradient-to-t from-green-800 to-green-600 rounded-t-full transform rotate-6 origin-bottom" />
      <div className="absolute top-0 right-[30%] w-2 h-16 bg-gradient-to-t from-green-700 to-green-500 rounded-t-full transform -rotate-3 origin-bottom" />
      <div className="absolute top-0 right-[10%] w-1.5 h-20 bg-gradient-to-t from-green-800 to-green-600 rounded-t-full transform rotate-9 origin-bottom" />

      {/* Floating particles/seeds */}
      <div className="absolute top-20 left-[20%] w-1 h-1 bg-yellow-200/50 rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
      <div className="absolute top-32 right-[25%] w-1.5 h-1.5 bg-yellow-100/40 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      <div className="absolute top-40 left-[60%] w-1 h-1 bg-amber-200/50 rounded-full animate-bounce" style={{ animationDuration: '5s', animationDelay: '0.5s' }} />

      {/* Dirt clumps decorations */}
      <div className="absolute bottom-10 left-[5%] w-8 h-4 bg-amber-950/60 rounded-full blur-sm" />
      <div className="absolute bottom-16 right-[8%] w-6 h-3 bg-amber-950/50 rounded-full blur-sm" />
      <div className="absolute bottom-8 left-[40%] w-10 h-5 bg-amber-950/40 rounded-full blur-sm" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-700/90 backdrop-blur-sm px-6 py-2 rounded-full mb-4">
            <span className="text-2xl">🐴</span>
            <span className="text-white font-semibold tracking-wide">COLEÇÃO ESPECIAL</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
            Mantas Premium
          </h2>
          <p className="text-amber-100 text-lg md:text-xl max-w-2xl mx-auto">
            Conforto e proteção para seu cavalo com as melhores mantas do mercado
          </p>
        </div>

        {/* Products Grid */}
        <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-3xl p-6 md:p-10 shadow-2xl border border-amber-200/20">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Ver Todos Button */}
          <div className="flex justify-center mt-8">
            <Link to="/categoria/mantas">
              <Button 
                size="lg" 
                className="gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg font-semibold rounded-full"
              >
                Ver Todas as Mantas
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Bottom grass decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-8 overflow-hidden">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 1200 30" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,30 L0,15 Q30,0 60,15 Q90,5 120,18 Q150,0 180,15 Q210,8 240,18 Q270,0 300,15 Q330,5 360,18 Q390,0 420,15 Q450,8 480,18 Q510,0 540,15 Q570,5 600,18 Q630,0 660,15 Q690,8 720,18 Q750,0 780,15 Q810,5 840,18 Q870,0 900,15 Q930,8 960,18 Q990,0 1020,15 Q1050,5 1080,18 Q1110,0 1140,15 Q1170,8 1200,18 L1200,30 Z" 
              fill="#4a7c23"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}