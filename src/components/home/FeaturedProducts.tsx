import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useFeaturedProducts } from '@/hooks/useProducts';
export function FeaturedProducts() {
  const {
    data: products,
    isLoading
  } = useFeaturedProducts();
  return;
}