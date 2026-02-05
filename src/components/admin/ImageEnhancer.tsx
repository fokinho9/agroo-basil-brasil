import { useState } from 'react';
import { Loader2, Sparkles, Check, X, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageEnhancerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onEnhanced: (enhancedUrl: string) => void;
}

export function ImageEnhancer({ open, onOpenChange, imageUrl, onEnhanced }: ImageEnhancerProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEnhance = async () => {
    if (!imageUrl) return;

    setIsEnhancing(true);
    setError(null);
    setEnhancedImageUrl(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('enhance-image', {
        body: { imageUrl },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.enhancedImageUrl) {
        setEnhancedImageUrl(data.enhancedImageUrl);
        toast.success('Imagem melhorada com sucesso!');
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao melhorar imagem';
      setError(message);
      toast.error(message);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleApply = () => {
    if (enhancedImageUrl) {
      onEnhanced(enhancedImageUrl);
    }
  };

  const handleClose = () => {
    setEnhancedImageUrl(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-secondary" />
            Melhorar Imagem com IA
          </DialogTitle>
          <DialogDescription>
            Use inteligência artificial para melhorar a qualidade da imagem do produto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Before/After Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Image */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded">
                  ANTES
                </span>
                <span className="text-sm text-muted-foreground">Imagem Original</span>
              </div>
              <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                <img
                  src={imageUrl}
                  alt="Imagem original"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>
            </div>

            {/* Enhanced Image */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-success/20 text-success text-xs font-medium rounded">
                  DEPOIS
                </span>
                <span className="text-sm text-muted-foreground">Imagem Melhorada</span>
              </div>
              <div className="aspect-square rounded-lg overflow-hidden border bg-muted relative">
                {isEnhancing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <span className="text-sm text-muted-foreground">Melhorando imagem...</span>
                  </div>
                ) : enhancedImageUrl ? (
                  <img
                    src={enhancedImageUrl}
                    alt="Imagem melhorada"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Sparkles className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Clique em "Melhorar" para processar
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Arrow indicator between images on mobile */}
          <div className="md:hidden flex justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            
            {!enhancedImageUrl ? (
              <Button
                type="button"
                onClick={handleEnhance}
                disabled={isEnhancing || !imageUrl}
                className="bg-gradient-to-r from-secondary to-primary"
              >
                {isEnhancing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Melhorar com IA
                  </>
                )}
              </Button>
            ) : (
              <Button type="button" onClick={handleApply} className="bg-success hover:bg-success/90">
                <Check className="h-4 w-4 mr-1" />
                Usar Imagem Melhorada
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
