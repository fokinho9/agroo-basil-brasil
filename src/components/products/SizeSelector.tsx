import { cn } from '@/lib/utils';

interface SizeSelectorProps {
  productName: string;
  selectedSize: string | null;
  onSizeSelect: (size: string) => void;
}

// Detect product type based on name
function getProductType(name: string): 'shirt' | 'pants' | 'boots' | null {
  const lowerName = name.toLowerCase();
  
  // Camisas
  if (
    lowerName.includes('camisa') ||
    lowerName.includes('camiseta') ||
    lowerName.includes('blusa') ||
    lowerName.includes('polo') ||
    lowerName.includes('regata')
  ) {
    return 'shirt';
  }
  
  // Calças
  if (
    lowerName.includes('calça') ||
    lowerName.includes('calca') ||
    lowerName.includes('jeans') ||
    lowerName.includes('bermuda') ||
    lowerName.includes('short')
  ) {
    return 'pants';
  }
  
  // Botas
  if (
    lowerName.includes('bota') ||
    lowerName.includes('botina') ||
    lowerName.includes('coturno') ||
    lowerName.includes('sapato') ||
    lowerName.includes('tênis') ||
    lowerName.includes('tenis')
  ) {
    return 'boots';
  }
  
  return null;
}

// Get sizes based on product type
function getSizes(type: 'shirt' | 'pants' | 'boots' | null): string[] {
  switch (type) {
    case 'shirt':
      return ['PP', 'M', 'G', 'GG'];
    case 'pants':
      return ['34', '36', '38', '40', '42', '44', '46'];
    case 'boots':
      return ['34', '36', '38', '40', '42', '44', '46'];
    default:
      return [];
  }
}

export function SizeSelector({ productName, selectedSize, onSizeSelect }: SizeSelectorProps) {
  const productType = getProductType(productName);
  const sizes = getSizes(productType);
  
  if (sizes.length === 0) {
    return null;
  }
  
  const label = productType === 'shirt' 
    ? 'Tamanho' 
    : productType === 'pants' 
      ? 'Tamanho (Cintura)' 
      : 'Tamanho (Calçado)';
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {selectedSize && (
          <span className="text-sm text-muted-foreground">
            Selecionado: <span className="font-medium text-foreground">{selectedSize}</span>
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onSizeSelect(size)}
            className={cn(
              "min-w-[44px] h-10 px-3 rounded-lg border-2 font-medium text-sm transition-all",
              selectedSize === size
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:border-primary/50 text-foreground"
            )}
          >
            {size}
          </button>
        ))}
      </div>
      {!selectedSize && (
        <p className="text-xs text-destructive">* Selecione um tamanho</p>
      )}
    </div>
  );
}

// Export helper to check if product needs size
export function productNeedsSize(productName: string): boolean {
  return getProductType(productName) !== null;
}
