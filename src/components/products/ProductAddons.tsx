import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ProductAddon {
  id: string;
  label: string;
  type: 'text' | 'select';
  required: boolean;
  options?: string[];
}

interface ProductAddonsProps {
  addons: ProductAddon[];
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
}

export function ProductAddons({ addons, values, onChange }: ProductAddonsProps) {
  if (!addons || addons.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Personalização:</p>
      {addons.map((addon) => (
        <div key={addon.id} className="space-y-1">
          <Label htmlFor={`addon-${addon.id}`} className="text-sm text-muted-foreground">
            {addon.label}
            {addon.required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          {addon.type === 'select' && addon.options ? (
            <Select
              value={values[addon.id] || ''}
              onValueChange={(val) => onChange(addon.id, val)}
            >
              <SelectTrigger id={`addon-${addon.id}`} className="w-full">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {addon.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={`addon-${addon.id}`}
              value={values[addon.id] || ''}
              onChange={(e) => onChange(addon.id, e.target.value)}
              placeholder={addon.label}
              maxLength={100}
            />
          )}
        </div>
      ))}
    </div>
  );
}
