import { useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCreateProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { toast } from 'sonner';
import { Upload, Check, AlertCircle, FileUp, X } from 'lucide-react';

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

    // CSV columns:
    // 1: image_url, 3: product-title, 4: brand, 5: product-price (current), 10: original price
    const imageUrl = values[1]?.replace(/"/g, '') || '';
    const name = values[3]?.replace(/"/g, '') || '';
    const brand = values[4]?.replace(/"/g, '') || '';
    
    // Parse price from column 5 (current price) - skip if "Preço sob consulta"
    const priceStr = values[5]?.replace(/"/g, '') || '';
    if (priceStr.includes('consulta') || !priceStr.includes('R$')) {
      continue; // Skip products without price
    }
    
    const currentPrice = parseFloat(priceStr.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
    
    // Parse original price from column 10 (if available)
    const originalPriceStr = values[10]?.replace(/"/g, '').replace(/[R$\s.]/g, '').replace(',', '.') || '0';
    const originalPrice = parseFloat(originalPriceStr) || 0;

    if (name && currentPrice > 0) {
      products.push({
        name: name.length > 100 ? name.substring(0, 97) + '...' : name,
        image_url: imageUrl,
        original_price: originalPrice > currentPrice ? originalPrice : 0,
        price: currentPrice,
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [parsedProducts, setParsedProducts] = useState<ProductRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo CSV');
      return;
    }

    setSelectedFile(file);
    
    // Parse the file to preview
    const text = await file.text();
    const products = parseCSV(text);
    setParsedProducts(products);
    
    if (products.length === 0) {
      toast.error('Nenhum produto válido encontrado no arquivo');
    } else {
      toast.success(`${products.length} produtos encontrados no arquivo`);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setParsedProducts([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!selectedCategoryId) {
      toast.error('Selecione uma categoria');
      return;
    }

    if (parsedProducts.length === 0) {
      toast.error('Nenhum produto para importar');
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setResults({ success: 0, errors: 0 });

    let success = 0;
    let errors = 0;

    for (let i = 0; i < parsedProducts.length; i++) {
      const product = parsedProducts[i];
      
      try {
        await createProduct.mutateAsync({
          name: product.name,
          description: product.brand ? `Marca: ${product.brand}` : null,
          price: product.price,
          original_price: product.original_price > product.price ? product.original_price : null,
          image_url: product.image_url,
          category_id: selectedCategoryId,
          stock: 10,
          active: true,
          featured: false,
        });
        success++;
      } catch (error) {
        console.error(`Error importing product: ${product.name}`, error);
        errors++;
      }

      setProgress(Math.round(((i + 1) / parsedProducts.length) * 100));
      setResults({ success, errors });

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    toast.success(`Importação concluída! ${success} produtos importados.`);
    setIsImporting(false);
    handleClearFile();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Importar Produtos</h1>
          <p className="text-muted-foreground">Importe produtos de um arquivo CSV</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Importação em Massa</CardTitle>
            <CardDescription>
              Faça upload de um arquivo CSV com os produtos para importar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isImporting ? (
              <div className="space-y-4">
                <Progress value={progress} />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso: {progress}%</span>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1 text-green-600">
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
              <div className="space-y-6">
                {/* File Upload Area */}
                <div className="space-y-2">
                  <Label>Arquivo CSV</Label>
                  {selectedFile ? (
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <FileUp className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {parsedProducts.length} produtos encontrados
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={handleClearFile}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Clique para selecionar</span> ou arraste um arquivo CSV
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".csv"
                        onChange={handleFileSelect}
                      />
                    </label>
                  )}
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <Label>Categoria de Destino</Label>
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview */}
                {parsedProducts.length > 0 && (
                  <div className="space-y-2">
                    <Label>Prévia dos Produtos</Label>
                    <div className="border rounded-lg max-h-48 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="text-left p-2">Nome</th>
                            <th className="text-right p-2">Preço</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedProducts.slice(0, 10).map((product, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-2 truncate max-w-xs">{product.name}</td>
                              <td className="p-2 text-right">R$ {product.price.toFixed(2)}</td>
                            </tr>
                          ))}
                          {parsedProducts.length > 10 && (
                            <tr className="border-t">
                              <td colSpan={2} className="p-2 text-center text-muted-foreground">
                                ... e mais {parsedProducts.length - 10} produtos
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Import Button */}
                <Button 
                  onClick={handleImport} 
                  disabled={!selectedFile || !selectedCategoryId || parsedProducts.length === 0}
                  size="lg"
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar {parsedProducts.length} Produtos
                </Button>
              </div>
            )}

            {!isImporting && results.success > 0 && (
              <div className="bg-green-500/10 text-green-700 p-4 rounded-lg text-center">
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
