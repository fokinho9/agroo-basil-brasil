import { useState } from 'react';
import { X, Plus, Sparkles, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ImageEnhancer } from './ImageEnhancer';

interface ProductImagesFormProps {
  images: string[];
  onChange: (images: string[]) => void;
  mainImageUrl: string;
  onMainImageChange: (url: string) => void;
}

export function ProductImagesForm({ 
  images, 
  onChange, 
  mainImageUrl, 
  onMainImageChange 
}: ProductImagesFormProps) {
  const [newImageUrl, setNewImageUrl] = useState('');
  const [enhancerOpen, setEnhancerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Combine main image with additional images for display
  const allImages = [mainImageUrl, ...images].filter(img => img && img.trim() !== '');
  const canAddMore = allImages.length < 5;

  const handleAddImage = () => {
    if (newImageUrl.trim() && canAddMore) {
      if (!mainImageUrl) {
        onMainImageChange(newImageUrl.trim());
      } else {
        onChange([...images, newImageUrl.trim()]);
      }
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    if (index === 0) {
      // Removing main image - promote first additional image to main
      if (images.length > 0) {
        onMainImageChange(images[0]);
        onChange(images.slice(1));
      } else {
        onMainImageChange('');
      }
    } else {
      // Removing additional image
      const newImages = [...images];
      newImages.splice(index - 1, 1);
      onChange(newImages);
    }
  };

  const handleEnhanceImage = (index: number) => {
    setSelectedImageIndex(index);
    setEnhancerOpen(true);
  };

  const handleEnhancedImage = (enhancedUrl: string) => {
    if (selectedImageIndex === null) return;

    if (selectedImageIndex === 0) {
      onMainImageChange(enhancedUrl);
    } else {
      const newImages = [...images];
      newImages[selectedImageIndex - 1] = enhancedUrl;
      onChange(newImages);
    }
    setEnhancerOpen(false);
    setSelectedImageIndex(null);
  };

  const getSelectedImageUrl = () => {
    if (selectedImageIndex === null) return '';
    if (selectedImageIndex === 0) return mainImageUrl;
    return images[selectedImageIndex - 1] || '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Imagens do Produto (até 5)</Label>
        <span className="text-xs text-muted-foreground">
          {allImages.length}/5 imagens
        </span>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-5 gap-2">
        {allImages.map((imageUrl, index) => (
          <div
            key={index}
            className={cn(
              "relative aspect-square rounded-lg overflow-hidden border-2 group",
              index === 0 ? "border-primary" : "border-border"
            )}
          >
            <img
              src={imageUrl}
              alt={`Imagem ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            
            {/* Badge for main image */}
            {index === 0 && (
              <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded">
                Principal
              </span>
            )}

            {/* Action buttons */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleEnhanceImage(index)}
                title="Melhorar com IA"
              >
                <Sparkles className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleRemoveImage(index)}
                title="Remover imagem"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {/* Add Image Slot */}
        {canAddMore && (
          <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Add Image Input */}
      {canAddMore && (
        <div className="flex gap-2">
          <Input
            placeholder="Cole a URL da imagem..."
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddImage();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddImage}
            disabled={!newImageUrl.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      )}

      {/* Image Enhancer Dialog */}
      <ImageEnhancer
        open={enhancerOpen}
        onOpenChange={setEnhancerOpen}
        imageUrl={getSelectedImageUrl()}
        onEnhanced={handleEnhancedImage}
      />
    </div>
  );
}
