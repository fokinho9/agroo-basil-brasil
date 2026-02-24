import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { useAdminProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Product } from '@/types';
import { Plus, Pencil, Trash2, Search, ImageOff, FileText, DollarSign, ChevronLeft, ChevronRight, ChevronsUpDown, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ProductImagesForm } from '@/components/admin/ProductImagesForm';
import { ProductVariantsEditor } from '@/components/admin/ProductVariantsEditor';

type ProductFilter = 'all' | 'no-image' | 'no-description' | 'no-price';
const PAGE_SIZE = 25;

export default function AdminProductsPage() {
  const { data: products, isLoading } = useAdminProducts();
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ProductFilter>('all');
  
  const [page, setPage] = useState(1);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', original_price: '',
    image_url: '', images: [] as string[], category_id: '',
    stock: '', active: true, featured: false, variants: [] as any[],
  });

  const productsWithoutImage = products?.filter(p => !p.image_url || p.image_url.trim() === '') || [];
  const productsWithoutDescription = products?.filter(p => !p.description || p.description.trim().length < 20) || [];
  const productsWithoutPrice = products?.filter(p => !p.price || p.price === 0) || [];

  const filteredProducts = products?.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    switch (filter) {
      case 'no-image': return !p.image_url || p.image_url.trim() === '';
      case 'no-description': return !p.description || p.description.trim().length < 20;
      case 'no-price': return !p.price || p.price === 0;
      default: return true;
    }
  }) || [];

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages || 1);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when filters change
  const handleSearch = (value: string) => { setSearch(value); setPage(1); };
  const handleFilter = (value: ProductFilter) => { setFilter(value); setPage(1); };




  const getSizePresetsForCategory = (categoryName: string): string[] => {
    const name = categoryName.toLowerCase();
    if (name.includes('bota')) return Array.from({ length: 12 }, (_, i) => String(33 + i)); // 33-44
    if (name.includes('camiseta') || name.includes('camisa') || name.includes('jaqueta') || name.includes('colete'))
      return ['PP', 'P', 'M', 'G', 'GG'];
    if (name.includes('calça') || name.includes('calca'))
      return ['36', '38', '40', '42', '44', '46', '48', '50', '52', '54'];
    if (name.includes('chapéu') || name.includes('chapeu'))
      return ['53', '54', '55', '56', '57', '58', '59', '60', '61'];
    return [];
  };

  const handleCategoryChange = (categoryId: string) => {
    const cat = categories?.find(c => c.id === categoryId);
    const parentCat = cat?.parent_id ? categories?.find(c => c.id === cat.parent_id) : null;
    const catName = cat?.name || '';
    const parentName = parentCat?.name || '';

    // Try category name first, then parent name
    let presets = getSizePresetsForCategory(catName);
    if (presets.length === 0) presets = getSizePresetsForCategory(parentName);

    // Only auto-fill if no sizes exist yet
    const currentSizes = formData.variants.filter((v: any) => v.size && !v.addon);
    const newVariants = currentSizes.length === 0 && presets.length > 0
      ? [...formData.variants, ...presets.map(s => ({ size: s }))]
      : formData.variants;

    setFormData({ ...formData, category_id: categoryId, variants: newVariants });
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', original_price: '', image_url: '', images: [], category_id: '', stock: '', active: true, featured: false, variants: [] });
    setEditingProduct(null);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name, description: product.description || '',
      price: product.price.toString(), original_price: product.original_price?.toString() || '',
      image_url: product.image_url || '', images: product.images || [],
      category_id: product.category_id || '', stock: product.stock.toString(),
      active: product.active, featured: product.featured,
      variants: (product.variants as any[]) || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: formData.name, description: formData.description || null,
      price: parseFloat(formData.price), original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      image_url: formData.image_url || null, images: formData.images.length > 0 ? formData.images : null,
      category_id: formData.category_id || null, stock: parseInt(formData.stock) || 0,
      active: formData.active, featured: formData.featured,
      variants: formData.variants.length > 0 ? formData.variants : [],
    };
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
        toast.success('Produto atualizado!');
      } else {
        await createProduct.mutateAsync(productData);
        toast.success('Produto criado!');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch { toast.error('Erro ao salvar produto'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success('Produto excluído!');
    } catch { toast.error('Erro ao excluir produto'); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
            <p className="text-muted-foreground">Gerencie os produtos da loja</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Produto</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name">Nome do Produto *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                  </div>
                  <div>
                    <Label htmlFor="price">Preço *</Label>
                    <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="original_price">Preço Original</Label>
                    <Input id="original_price" type="number" step="0.01" value={formData.original_price} onChange={(e) => setFormData({ ...formData, original_price: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={categoryOpen} className="w-full justify-between font-normal mt-1">
                          {formData.category_id
                            ? categories?.find(c => c.id === formData.category_id)?.name || 'Selecione...'
                            : 'Selecione uma categoria'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0 z-[200] bg-popover" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar categoria..." />
                          <CommandList>
                            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                            {categories?.filter(c => !c.parent_id).map((parent) => (
                              <CommandGroup key={parent.id} heading={parent.name}>
                                <CommandItem
                                  value={parent.name}
                                  onSelect={() => { handleCategoryChange(parent.id); setCategoryOpen(false); }}
                                >
                                  <Check className={`mr-2 h-4 w-4 ${formData.category_id === parent.id ? 'opacity-100' : 'opacity-0'}`} />
                                  {parent.name}
                                </CommandItem>
                                {categories?.filter(c => c.parent_id === parent.id).map((child) => (
                                  <CommandItem
                                    key={child.id}
                                    value={child.name}
                                    onSelect={() => { handleCategoryChange(child.id); setCategoryOpen(false); }}
                                  >
                                    <Check className={`mr-2 h-4 w-4 ${formData.category_id === child.id ? 'opacity-100' : 'opacity-0'}`} />
                                    └ {child.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="stock">Estoque</Label>
                    <Input id="stock" type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <ProductImagesForm images={formData.images} onChange={(images) => setFormData({ ...formData, images })} mainImageUrl={formData.image_url} onMainImageChange={(url) => setFormData({ ...formData, image_url: url })} />
                  </div>
                  <div className="sm:col-span-2">
                    <ProductVariantsEditor variants={formData.variants} onChange={(variants) => setFormData({ ...formData, variants })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="active" checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: checked })} />
                    <Label htmlFor="active">Ativo</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="featured" checked={formData.featured} onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })} />
                    <Label htmlFor="featured">Destaque</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>{editingProduct ? 'Salvar' : 'Criar'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={filter === 'all' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => handleFilter('all')}>
                  Todos ({products?.length || 0})
                </Badge>
                <Badge variant={filter === 'no-image' ? 'default' : 'outline'} className="cursor-pointer gap-1" onClick={() => handleFilter('no-image')}>
                  <ImageOff className="h-3 w-3" /> Sem Imagem ({productsWithoutImage.length})
                </Badge>
                <Badge variant={filter === 'no-description' ? 'default' : 'outline'} className="cursor-pointer gap-1" onClick={() => handleFilter('no-description')}>
                  <FileText className="h-3 w-3" /> Sem Descrição ({productsWithoutDescription.length})
                </Badge>
                <Badge variant={filter === 'no-price' ? 'default' : 'outline'} className="cursor-pointer gap-1" onClick={() => handleFilter('no-price')}>
                  <DollarSign className="h-3 w-3" /> Sem Preço ({productsWithoutPrice.length})
                </Badge>


              </div>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar produtos..." value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Carregando...</p>
            ) : paginatedProducts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhum produto encontrado</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Estoque</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="w-12 h-12 object-cover rounded" />
                                {product.images && product.images.length > 0 && (
                                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                                    +{product.images.length}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{product.name}</p>
                                {product.featured && <span className="text-xs text-secondary">★ Destaque</span>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{product.category?.name || '-'}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{formatCurrency(product.price)}</p>
                              {product.original_price && <p className="text-xs text-muted-foreground line-through">{formatCurrency(product.original_price)}</p>}
                            </div>
                          </TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${product.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                              {product.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(product.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} de {filteredProducts.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 7) {
                          pageNum = i + 1;
                        } else if (currentPage <= 4) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 3) {
                          pageNum = totalPages - 6 + i;
                        } else {
                          pageNum = currentPage - 3 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? 'default' : 'outline'}
                            size="sm"
                            className="w-9"
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
