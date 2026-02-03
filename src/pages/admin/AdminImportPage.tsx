import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCreateProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { toast } from 'sonner';
import { Upload, Check, AlertCircle } from 'lucide-react';

interface ProductRow {
  name: string;
  image_url: string;
  original_price: number;
  price: number;
  brand: string;
}

function parseCSV(csvText: string): ProductRow[] {
  const lines = csvText.split('\n');
  const products: ProductRow[] = [];

  // Skip header (line 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Parse CSV with quoted values
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    // Extract data from columns:
    // 1: image_url, 3: product-title, 4: brand, 5: original price, 6: discount price
    const imageUrl = values[1]?.replace(/"/g, '') || '';
    const name = values[3]?.replace(/"/g, '') || '';
    const brand = values[4]?.replace(/"/g, '') || '';
    const originalPriceStr = values[5]?.replace(/[R$\s.]/g, '').replace(',', '.') || '0';
    const discountPriceStr = values[6]?.replace(/[R$\s.]/g, '').replace(',', '.') || '0';

    const originalPrice = parseFloat(originalPriceStr) || 0;
    const discountPrice = parseFloat(discountPriceStr) || 0;

    if (name && discountPrice > 0) {
      products.push({
        name: name.length > 100 ? name.substring(0, 97) + '...' : name,
        image_url: imageUrl,
        original_price: originalPrice,
        price: discountPrice,
        brand,
      });
    }
  }

  return products;
}

export default function AdminImportPage() {
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; errors: number }>({ success: 0, errors: 0 });

  const tralhasCategory = categories?.find(c => c.slug === 'tralhas');

  const handleImport = async () => {
    if (!tralhasCategory) {
      toast.error('Categoria "Tralhas" não encontrada');
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setResults({ success: 0, errors: 0 });

    try {
      const response = await fetch('/data/products-import.csv');
      const csvText = await response.text();
      const products = parseCSV(csvText);

      let success = 0;
      let errors = 0;

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        
        try {
          await createProduct.mutateAsync({
            name: product.name,
            description: product.brand ? `Marca: ${product.brand}` : null,
            price: product.price,
            original_price: product.original_price > product.price ? product.original_price : null,
            image_url: product.image_url,
            category_id: tralhasCategory.id,
            stock: 10,
            active: true,
            featured: false,
          });
          success++;
        } catch (error) {
          console.error(`Error importing product: ${product.name}`, error);
          errors++;
        }

        setProgress(Math.round(((i + 1) / products.length) * 100));
        setResults({ success, errors });

        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast.success(`Importação concluída! ${success} produtos importados.`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erro durante a importação');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Importar Produtos</h1>
          <p className="text-muted-foreground">Importe produtos do arquivo CSV para a categoria Tralhas</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Importação em Massa</CardTitle>
            <CardDescription>
              {tralhasCategory 
                ? `Os produtos serão importados para a categoria "${tralhasCategory.name}"`
                : 'Carregando categorias...'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isImporting ? (
              <div className="space-y-4">
                <Progress value={progress} />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso: {progress}%</span>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1 text-success">
                      <Check className="h-4 w-4" /> {results.success} sucesso
                    </span>
                    {results.errors > 0 && (
                      <span className="flex items-center gap-1 text-destructive">
                        <AlertCircle className="h-4 w-4" /> {results.errors} erros
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Clique no botão abaixo para importar os produtos do arquivo CSV
                </p>
                <Button 
                  onClick={handleImport} 
                  disabled={!tralhasCategory || isImporting}
                  size="lg"
                >
                  Iniciar Importação
                </Button>
              </div>
            )}

            {!isImporting && results.success > 0 && (
              <div className="bg-success/10 text-success p-4 rounded-lg text-center">
                <Check className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">Importação concluída!</p>
                <p className="text-sm">{results.success} produtos importados com sucesso</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
