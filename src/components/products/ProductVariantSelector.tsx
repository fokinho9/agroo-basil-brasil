import { useState } from 'react';
import { Check } from 'lucide-react';
import { ProductVariant } from '@/types';
import { cn } from '@/lib/utils';

interface ProductVariantSelectorProps {
  variants: ProductVariant[];
  selectedColor: string | null;
  selectedSize: string | null;
  onColorChange: (color: string, imageUrl?: string) => void;
  onSizeChange: (size: string) => void;
}

export function ProductVariantSelector({
  variants,
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
}: ProductVariantSelectorProps) {
  // Extract unique colors and sizes
  const colors = variants
    .filter((v) => v.color)
    .reduce((acc, v) => {
      if (!acc.find((c) => c.color === v.color)) {
        acc.push({ color: v.color!, image_url: v.image_url });
      }
      return acc;
    }, [] as { color: string; image_url?: string }[]);

  const sizes = [...new Set(variants.filter((v) => v.size).map((v) => v.size!))];

  // Sort sizes naturally (numbers first, then letters)
  sizes.sort((a, b) => {
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    const order = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG'];
    const idxA = order.indexOf(a.toUpperCase());
    const idxB = order.indexOf(b.toUpperCase());
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return a.localeCompare(b);
  });

  if (colors.length === 0 && sizes.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Color Selection */}
      {colors.length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground mb-2">
            Cor: <span className="text-muted-foreground font-normal">{selectedColor || 'Selecione'}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.color}
                onClick={() => onColorChange(c.color, c.image_url)}
                className={cn(
                  'relative rounded-lg overflow-hidden border-2 transition-all',
                  selectedColor === c.color
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                )}
                title={c.color}
              >
                {c.image_url ? (
                  <img
                    src={c.image_url}
                    alt={c.color}
                    className="w-12 h-12 md:w-14 md:h-14 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-muted text-[10px] text-center px-1">
                    {c.color}
                  </div>
                )}
                {selectedColor === c.color && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {sizes.length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground mb-2">
            Tamanho: <span className="text-muted-foreground font-normal">{selectedSize || 'Selecione'}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => onSizeChange(size)}
                className={cn(
                  'min-w-[2.5rem] h-10 px-3 rounded-lg border-2 text-sm font-medium transition-all',
                  selectedSize === size
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:border-primary/50'
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
