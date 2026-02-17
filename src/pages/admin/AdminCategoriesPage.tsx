import { useState, useRef, useCallback, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useBulkUpdateCategories } from '@/hooks/useCategories';
import { Category } from '@/types';
import { Plus, Pencil, Trash2, GripVertical, ChevronRight, ChevronDown, FolderOpen, Folder } from 'lucide-react';
import { slugify } from '@/lib/utils';
import { toast } from 'sonner';

interface TreeCategory extends Category {
  children: TreeCategory[];
  depth: number;
}

function buildTree(categories: Category[]): TreeCategory[] {
  const map = new Map<string, TreeCategory>();
  const roots: TreeCategory[] = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [], depth: 0 });
  }

  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parent_id && map.has(cat.parent_id)) {
      const parent = map.get(cat.parent_id)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortChildren = (nodes: TreeCategory[]) => {
    nodes.sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name));
    for (const n of nodes) sortChildren(n.children);
  };
  sortChildren(roots);

  return roots;
}

function flattenTree(nodes: TreeCategory[]): TreeCategory[] {
  const result: TreeCategory[] = [];
  const walk = (list: TreeCategory[], depth: number) => {
    for (const n of list) {
      result.push({ ...n, depth });
      walk(n.children, depth + 1);
    }
  };
  walk(nodes, 0);
  return result;
}

interface CategoryRowProps {
  category: TreeCategory;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, targetId: string, position: 'before' | 'inside' | 'after') => void;
  dragOverId: string | null;
  dragPosition: 'before' | 'inside' | 'after' | null;
  hasChildren: boolean;
}

function CategoryRow({
  category, collapsed, onToggle, onEdit, onDelete,
  onDragStart, onDragOver, onDrop, dragOverId, dragPosition, hasChildren,
}: CategoryRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isCollapsed = collapsed.has(category.id);
  const isOver = dragOverId === category.id;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = rowRef.current?.getBoundingClientRect();
    if (!rect) return;
    const y = e.clientY - rect.top;
    const third = rect.height / 3;
    let position: 'before' | 'inside' | 'after';
    if (y < third) position = 'before';
    else if (y > third * 2) position = 'after';
    else position = 'inside';
    onDragOver(e, category.id);
    // Store position in data transfer
    (e as any).__dropPosition = position;
  };

  return (
    <div
      ref={rowRef}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-md transition-colors group
        ${isOver && dragPosition === 'inside' ? 'bg-primary/10 ring-2 ring-primary/30' : ''}
        ${isOver && dragPosition === 'before' ? 'border-t-2 border-primary' : ''}
        ${isOver && dragPosition === 'after' ? 'border-b-2 border-primary' : ''}
        hover:bg-muted/50
      `}
      style={{ paddingLeft: `${category.depth * 24 + 12}px` }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', category.id);
        onDragStart(category.id);
      }}
      onDragOver={handleDragOver}
      onDrop={(e) => {
        e.preventDefault();
        const rect = rowRef.current?.getBoundingClientRect();
        if (!rect) return;
        const y = e.clientY - rect.top;
        const third = rect.height / 3;
        let position: 'before' | 'inside' | 'after';
        if (y < third) position = 'before';
        else if (y > third * 2) position = 'after';
        else position = 'inside';
        onDrop(e, category.id, position);
      }}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />

      {hasChildren ? (
        <button onClick={() => onToggle(category.id)} className="shrink-0 p-0.5 rounded hover:bg-muted">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      ) : (
        <span className="w-5" />
      )}

      {hasChildren ? (
        <FolderOpen className="h-4 w-4 text-primary shrink-0" />
      ) : (
        <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
      )}

      <span className={`flex-1 text-sm ${category.depth === 0 ? 'font-semibold' : ''}`}>
        {category.name}
      </span>

      <span className="text-xs text-muted-foreground hidden sm:inline">{category.slug}</span>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(category)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(category.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const bulkUpdate = useBulkUpdateCategories();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<'before' | 'inside' | 'after' | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const tree = useMemo(() => categories ? buildTree(categories) : [], [categories]);
  
  const visibleItems = useMemo(() => {
    const result: TreeCategory[] = [];
    const walk = (nodes: TreeCategory[], depth: number) => {
      for (const n of nodes) {
        const node = { ...n, depth };
        result.push(node);
        if (!collapsed.has(n.id)) {
          walk(n.children, depth + 1);
        }
      }
    };
    walk(tree, 0);
    return result;
  }, [tree, collapsed]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, TreeCategory>();
    const walk = (nodes: TreeCategory[]) => {
      for (const n of nodes) {
        map.set(n.id, n);
        walk(n.children);
      }
    };
    walk(tree);
    return map;
  }, [tree]);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const resetForm = () => {
    setFormData({ name: '', slug: '' });
    setEditingCategory(null);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, slug: category.slug });
    setIsDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormData({
      name,
      slug: editingCategory ? formData.slug : slugify(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          name: formData.name,
          slug: formData.slug,
        });
        toast.success('Categoria atualizada!');
      } else {
        await createCategory.mutateAsync({
          name: formData.name,
          slug: formData.slug,
        });
        toast.success('Categoria criada!');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleDelete = async (id: string) => {
    const cat = categoryMap.get(id);
    const childCount = cat?.children.length || 0;
    const msg = childCount > 0
      ? `Esta categoria tem ${childCount} subcategorias. As subcategorias ficarão sem pai. Continuar?`
      : 'Tem certeza que deseja excluir esta categoria?';
    if (!confirm(msg)) return;

    try {
      await deleteCategory.mutateAsync(id);
      toast.success('Categoria excluída!');
    } catch (error) {
      toast.error('Erro ao excluir categoria');
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent, targetId: string, position: 'before' | 'inside' | 'after') => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    setDragOverId(null);
    setDragPosition(null);
    setDraggingId(null);

    if (!sourceId || sourceId === targetId || !categories) return;

    // Prevent dropping a parent into its own child
    const isDescendant = (parentId: string, childId: string): boolean => {
      const node = categoryMap.get(parentId);
      if (!node) return false;
      for (const child of node.children) {
        if (child.id === childId) return true;
        if (isDescendant(child.id, childId)) return true;
      }
      return false;
    };

    if (isDescendant(sourceId, targetId)) {
      toast.error('Não é possível mover uma categoria para dentro de sua própria subcategoria');
      return;
    }

    const target = categoryMap.get(targetId);
    if (!target) return;

    let newParentId: string | null;
    let siblings: Category[];

    if (position === 'inside') {
      // Drop inside target → becomes child of target
      newParentId = targetId;
      siblings = categories.filter(c => c.parent_id === targetId && c.id !== sourceId);
    } else {
      // Drop before/after target → same parent as target
      newParentId = target.parent_id;
      siblings = categories.filter(c => c.parent_id === target.parent_id && c.id !== sourceId);
    }

    // Calculate display_order
    const sortedSiblings = siblings.sort((a, b) => a.display_order - b.display_order);
    const updates: { id: string; parent_id: string | null; display_order: number }[] = [];

    if (position === 'inside') {
      updates.push({ id: sourceId, parent_id: newParentId, display_order: sortedSiblings.length });
    } else {
      const targetIndex = sortedSiblings.findIndex(s => s.id === targetId);
      const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
      
      // Reorder all siblings
      let order = 0;
      for (let i = 0; i < sortedSiblings.length; i++) {
        if (i === insertIndex) {
          updates.push({ id: sourceId, parent_id: newParentId, display_order: order++ });
        }
        updates.push({ id: sortedSiblings[i].id, parent_id: sortedSiblings[i].parent_id, display_order: order++ });
      }
      if (insertIndex >= sortedSiblings.length) {
        updates.push({ id: sourceId, parent_id: newParentId, display_order: order });
      }
    }

    // Expand parent so user sees the result
    if (newParentId) {
      setCollapsed(prev => {
        const next = new Set(prev);
        next.delete(newParentId!);
        return next;
      });
    }

    try {
      await bulkUpdate.mutateAsync(updates);
      toast.success('Categoria movida!');
    } catch (error) {
      toast.error('Erro ao mover categoria');
    }
  }, [categories, categoryMap, bulkUpdate]);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const third = rect.height / 3;
    
    let pos: 'before' | 'inside' | 'after';
    if (y < third) pos = 'before';
    else if (y > third * 2) pos = 'after';
    else pos = 'inside';

    setDragOverId(id);
    setDragPosition(pos);
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Categorias</h1>
            <p className="text-muted-foreground">
              Arraste para reorganizar • Solte no meio para criar subcategoria
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="categoria-exemplo"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                    {editingCategory ? 'Salvar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>Todas as Categorias ({categories?.length || 0})</span>
              <div className="flex gap-2 text-xs text-muted-foreground font-normal">
                <span className="flex items-center gap-1"><FolderOpen className="h-3 w-3 text-primary" /> Com subcategorias</span>
                <span className="flex items-center gap-1"><Folder className="h-3 w-3" /> Sem subcategorias</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Carregando...</p>
            ) : visibleItems.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhuma categoria cadastrada</p>
            ) : (
              <div
                className="space-y-0.5"
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverId(null);
                    setDragPosition(null);
                  }
                }}
                onDragEnd={() => {
                  setDragOverId(null);
                  setDragPosition(null);
                  setDraggingId(null);
                }}
              >
                {visibleItems.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    collapsed={collapsed}
                    onToggle={toggleCollapse}
                    onEdit={openEditDialog}
                    onDelete={handleDelete}
                    onDragStart={setDraggingId}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    dragOverId={dragOverId}
                    dragPosition={dragPosition}
                    hasChildren={cat.children.length > 0}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
