'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Save, X, Upload, Image, ChevronUp, ChevronDown } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  image_url: string;
  params: Record<string, string> | null;
  description: string | null;
  sort_order: number;
  category_id: number | null;
  category_ids: number[] | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string | null;
}

interface Category {
  id: number;
  name: string;
  sort_order: number;
}

const DEFAULT_PARAMS_KEYS = [
  '长', '高', '重', '价格', '泥料', '容量', '工艺', '定位', '茶种',
];

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ]);
      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      setProducts(productsData.data || []);
      setCategories(categoriesData.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (product: Product) => {
    try {
      if (product.id) {
        await fetch(`/api/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });
      }
      setShowProductDialog(false);
      setEditingProduct(null);
      fetchData();
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('确定要删除这个产品吗？')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim(), sort_order: categories.length }),
      });
      setNewCategoryName('');
      fetchData();
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('确定要删除这个分类吗？')) return;
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const newCategories = [...categories];
    const temp = newCategories[index];
    newCategories[index] = newCategories[newIndex];
    newCategories[newIndex] = temp;

    // 更新 sort_order
    const updatedCategories = newCategories.map((cat, idx) => ({
      ...cat,
      sort_order: idx,
    }));

    // 批量更新
    try {
      await Promise.all(
        updatedCategories.map((cat) =>
          fetch(`/api/categories/${cat.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: cat.name, sort_order: cat.sort_order }),
          })
        )
      );
      setCategories(updatedCategories);
    } catch (error) {
      console.error('Failed to reorder categories:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">柴烧壶产品管理</h1>

        <Tabs defaultValue="products">
          <TabsList className="mb-6">
            <TabsTrigger value="products">产品管理</TabsTrigger>
            <TabsTrigger value="categories">分类管理</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">产品列表 ({products.length})</h2>
              <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingProduct(null)}>
                    <Plus className="w-4 h-4 mr-2" />
                    添加产品
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingProduct?.id ? '编辑产品' : '添加产品'}</DialogTitle>
                  </DialogHeader>
                  <ProductForm
                    product={editingProduct}
                    categories={categories}
                    onSave={handleSaveProduct}
                    onCancel={() => {
                      setShowProductDialog(false);
                      setEditingProduct(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        {product.is_pinned && (
                          <Badge variant="secondary">置顶</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {product.description?.substring(0, 50) || '暂无描述'}...
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingProduct(product);
                          setShowProductDialog(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="输入分类名称"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <Button onClick={handleAddCategory}>添加分类</Button>
            </div>

            <div className="grid gap-2">
              {categories.map((category, index) => (
                <Card key={category.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <span className="font-medium flex-1">{category.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveCategory(index, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveCategory(index, 'down')}
                        disabled={index === categories.length - 1}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ProductForm({
  product,
  categories,
  onSave,
  onCancel,
}: {
  product: Product | null;
  categories: Category[];
  onSave: (product: Product) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(product?.name || '');
  const [imageUrl, setImageUrl] = useState(product?.image_url || '');
  const [description, setDescription] = useState(product?.description || '');
  const [sortOrder, setSortOrder] = useState(product?.sort_order ?? 0);
  const [categoryId, setCategoryId] = useState(
    product?.category_id?.toString() || 'none'
  );
  const [categoryIds, setCategoryIds] = useState<number[]>(
    product?.category_ids || []
  );
  const [isPinned, setIsPinned] = useState(product?.is_pinned ?? false);
  const [params, setParams] = useState<Record<string, string>>(
    product?.params || {}
  );
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(product?.image_url || '');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.url) {
        setImageUrl(data.url);
        setPreviewUrl(data.url);
      } else {
        alert('上传失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      alert('上传失败：' + error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: product?.id || 0,
      name,
      image_url: imageUrl,
      params: Object.keys(params).length > 0 ? params : null,
      description: description || null,
      sort_order: sortOrder,
      category_id: categoryId === 'none' ? null : parseInt(categoryId),
      category_ids: categoryIds.length > 0 ? categoryIds : null,
      is_pinned: isPinned,
      created_at: product?.created_at || new Date().toISOString(),
      updated_at: null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>产品名称 *</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：巨轮壶"
          required
        />
      </div>

      <div>
        <Label>产品图片</Label>
        <div className="space-y-2">
          {previewUrl && (
            <div className="relative w-full h-48 bg-stone-100 rounded-lg overflow-hidden">
              <img
                src={previewUrl}
                alt="预览"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-stone-300 rounded-lg hover:border-stone-400 transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-sm">{uploading ? '上传中...' : '上传图片'}</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <Label className="text-xs text-stone-500">或直接输入图片URL</Label>
            <Input
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setPreviewUrl(e.target.value);
              }}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      <div>
        <Label>产品参数</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {DEFAULT_PARAMS_KEYS.filter(key => key !== '茶种').map((key) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-sm w-12">{key}</span>
              <Input
                value={params[key] || ''}
                onChange={(e) =>
                  setParams({ ...params, [key]: e.target.value })
                }
                placeholder={key}
              />
            </div>
          ))}
        </div>
        {/* 茶种单独一行，占满宽度 */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm w-12">茶种</span>
          <Input
            value={params['茶种'] || ''}
            onChange={(e) =>
              setParams({ ...params, '茶种': e.target.value })
            }
            placeholder="茶种"
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label>详细描述</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="介绍产品工艺、故事等..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>排序值</Label>
          <Input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div>
        <Label>分类（可多选）</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {categories.length === 0 && (
            <span className="text-sm text-stone-500">暂无分类，请先在"分类管理"中添加</span>
          )}
          {categories.map((cat) => (
            <label
              key={cat.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition-colors text-sm ${
                categoryIds.includes(cat.id)
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
              }`}
            >
              <input
                type="checkbox"
                checked={categoryIds.includes(cat.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setCategoryIds([...categoryIds, cat.id]);
                  } else {
                    setCategoryIds(categoryIds.filter((id) => id !== cat.id));
                  }
                }}
                className="hidden"
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={isPinned} onCheckedChange={setIsPinned} />
        <Label>置顶显示</Label>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          保存
        </Button>
      </div>
    </form>
  );
}
