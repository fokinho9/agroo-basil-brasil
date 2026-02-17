import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, X } from 'lucide-react';

interface ColorVariant {
  color: string;
  image_url?: string;
}

interface SizeVariant {
  size: string;
}

interface AddonVariant {
  addon: true;
  id: string;
  label: string;
  type: 'text' | 'select';
  required: boolean;
  options?: string[];
}

type Variant = ColorVariant | SizeVariant | AddonVariant;

interface ProductVariantsEditorProps {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
}

export function ProductVariantsEditor({ variants, onChange }: ProductVariantsEditorProps) {
  const colors: ColorVariant[] = variants.filter((v: any) => v.color && !v.addon) as ColorVariant[];
  const sizes: SizeVariant[] = variants.filter((v: any) => v.size && !v.addon) as SizeVariant[];
  const addons: AddonVariant[] = variants.filter((v: any) => v.addon) as AddonVariant[];

  const [newColor, setNewColor] = useState('');
  const [newColorImage, setNewColorImage] = useState('');
  const [newSize, setNewSize] = useState('');
  const [newAddonLabel, setNewAddonLabel] = useState('');
  const [newAddonType, setNewAddonType] = useState<'text' | 'select'>('text');
  const [newAddonRequired, setNewAddonRequired] = useState(true);
  const [newAddonOptions, setNewAddonOptions] = useState('');

  const rebuildVariants = (c: ColorVariant[], s: SizeVariant[], a: AddonVariant[]) => {
    onChange([...c, ...s, ...a]);
  };

  const addColor = () => {
    if (!newColor.trim()) return;
    const updated = [...colors, { color: newColor.trim(), ...(newColorImage.trim() ? { image_url: newColorImage.trim() } : {}) }];
    rebuildVariants(updated, sizes, addons);
    setNewColor('');
    setNewColorImage('');
  };

  const removeColor = (index: number) => {
    const updated = colors.filter((_, i) => i !== index);
    rebuildVariants(updated, sizes, addons);
  };

  const addSize = () => {
    if (!newSize.trim()) return;
    const updated = [...sizes, { size: newSize.trim() }];
    rebuildVariants(colors, updated, addons);
    setNewSize('');
  };

  const removeSize = (index: number) => {
    const updated = sizes.filter((_, i) => i !== index);
    rebuildVariants(colors, updated, addons);
  };

  const addAddon = () => {
    if (!newAddonLabel.trim()) return;
    const id = String(Date.now());
    const addon: AddonVariant = {
      addon: true,
      id,
      label: newAddonLabel.trim(),
      type: newAddonType,
      required: newAddonRequired,
    };
    if (newAddonType === 'select' && newAddonOptions.trim()) {
      addon.options = newAddonOptions.split(',').map(o => o.trim()).filter(Boolean);
    }
    rebuildVariants(colors, sizes, [...addons, addon]);
    setNewAddonLabel('');
    setNewAddonOptions('');
    setNewAddonType('text');
    setNewAddonRequired(true);
  };

  const removeAddon = (index: number) => {
    const updated = addons.filter((_, i) => i !== index);
    rebuildVariants(colors, sizes, updated);
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Variantes & Personalização</Label>

      {/* Colors */}
      <div className="space-y-2 p-3 border rounded-lg">
        <Label className="text-sm font-medium">Cores</Label>
        {colors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {colors.map((c, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {c.color}
                <button type="button" onClick={() => removeColor(i)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Nome da cor (ex: Azul Marinho)"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
          />
          <Input
            placeholder="URL imagem (opcional)"
            value={newColorImage}
            onChange={(e) => setNewColorImage(e.target.value)}
            className="flex-1"
          />
          <Button type="button" variant="outline" size="icon" onClick={addColor}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-2 p-3 border rounded-lg">
        <Label className="text-sm font-medium">Tamanhos</Label>
        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((s, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {s.size}
                <button type="button" onClick={() => removeSize(i)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Tamanho (ex: P, M, G, GG, Potro)"
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
          />
          <Button type="button" variant="outline" size="icon" onClick={addSize}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Addons / Personalização */}
      <div className="space-y-2 p-3 border rounded-lg">
        <Label className="text-sm font-medium">Complementos / Personalização</Label>
        {addons.length > 0 && (
          <div className="space-y-2">
            {addons.map((a, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-sm">
                <div className="flex-1">
                  <span className="font-medium">{a.label}</span>
                  <span className="text-muted-foreground ml-2">
                    ({a.type === 'select' ? `Seleção: ${a.options?.join(', ')}` : 'Texto livre'})
                  </span>
                  {a.required && <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0">Obrigatório</Badge>}
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAddon(i)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Separator />
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Nome do campo (ex: NOME PARA BORDAR)"
              value={newAddonLabel}
              onChange={(e) => setNewAddonLabel(e.target.value)}
              className="flex-1"
            />
            <Select value={newAddonType} onValueChange={(v) => setNewAddonType(v as 'text' | 'select')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="select">Seleção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {newAddonType === 'select' && (
            <Input
              placeholder="Opções separadas por vírgula (ex: Preto, Marrom, Azul)"
              value={newAddonOptions}
              onChange={(e) => setNewAddonOptions(e.target.value)}
            />
          )}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={newAddonRequired}
                onChange={(e) => setNewAddonRequired(e.target.checked)}
                className="rounded"
              />
              Obrigatório
            </label>
            <Button type="button" variant="outline" size="sm" onClick={addAddon} className="gap-1">
              <Plus className="h-3.5 w-3.5" />
              Adicionar Complemento
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
