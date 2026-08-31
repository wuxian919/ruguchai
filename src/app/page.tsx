'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronUp } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  image_url: string;
  params: Record<string, string> | null;
  description: string | null;
  sort_order: number;
  category_id: number | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string | null;
}

interface Category {
  id: number;
  name: string;
  sort_order: number;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/api/products';
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category_id', selectedCategory.toString());
      if (searchQuery) params.set('search', searchQuery);
      if (params.toString()) url += `?${params.toString()}`;

      const [productsRes, categoriesRes] = await Promise.all([
        fetch(url),
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

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleScroll = () => {
    if (containerRef.current) {
      setShowBackToTop(containerRef.current.scrollTop > 500);
    }
  };

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getParamValue = (params: Record<string, string> | null, key: string) => {
    return params?.[key] || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="text-lg text-stone-600">加载中...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="min-h-screen bg-stone-50 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-stone-200 px-4 py-3">
        <h1 className="text-xl font-bold text-center text-stone-800 mb-3">
          如故
        </h1>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="搜索壶名、价格、泥料..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-stone-50 border-stone-200"
            />
          </div>
        </div>
        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            <Badge
              variant={selectedCategory === null ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setSelectedCategory(null)}
            >
              全部
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap"
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === cat.id ? null : cat.id
                  )
                }
              >
                {cat.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="px-4 py-6 space-y-8 max-w-lg mx-auto">
        {products.length === 0 ? (
          <div className="text-center text-stone-500 py-12">
            暂无产品
          </div>
        ) : (
          products.map((product) => (
            <ProductCard key={product.id} product={product} getParamValue={getParamValue} />
          ))
        )}
      </div>

      {/* Back to Top */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 bg-stone-800 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-stone-700 transition-colors z-20"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}

      {/* Footer */}
      <div className="text-center py-8 text-sm text-stone-400">
        <p>如故 · 古法柴烧</p>
        <p>场景图片因环境、风格化等因素影响存在色差</p>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  getParamValue,
}: {
  product: Product;
  getParamValue: (params: Record<string, string> | null, key: string) => string;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const paramRows = [
    { label: '长', value: getParamValue(product.params, '长'), icon: '长' },
    { label: '高', value: getParamValue(product.params, '高'), icon: '高' },
    { label: '重', value: getParamValue(product.params, '重'), icon: '重' },
  ];

  const paramPairs = [
    { label: '价格', value: getParamValue(product.params, '价格') },
    { label: '容量', value: getParamValue(product.params, '容量') },
    { label: '泥料', value: getParamValue(product.params, '泥料') },
    { label: '工艺', value: getParamValue(product.params, '工艺') },
    { label: '茶种', value: getParamValue(product.params, '茶种') },
    { label: '定位', value: getParamValue(product.params, '定位') },
  ].filter((p) => p.value);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
      {/* Product Name */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-3xl font-bold text-center text-stone-900 tracking-wide">
          {product.name}
        </h2>
      </div>

      {/* Product Image */}
      <div className="px-6 pb-4">
        <div className="relative bg-stone-50 rounded-xl overflow-hidden aspect-square flex items-center justify-center">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-stone-400">
              图片加载中...
            </div>
          )}
          <img
            src={product.image_url}
            alt={product.name}
            className={`w-full h-full object-contain transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />
        </div>
      </div>

      {/* Top Params Row (长 高 重) */}
      {paramRows.some((p) => p.value) && (
        <div className="flex justify-center gap-8 px-6 pb-4">
          {paramRows.map(
            (param) =>
              param.value && (
                <div key={param.label} className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-stone-800 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {param.icon}
                  </span>
                  <span className="text-lg font-semibold text-stone-800">
                    {param.value}
                  </span>
                </div>
              )
          )}
        </div>
      )}

      {/* Param Pairs */}
      {paramPairs.length > 0 && (
        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            {paramPairs.slice(0, 4).map((param) => (
              <div key={param.label} className="flex items-center gap-2">
                <span className="bg-stone-800 text-white px-2 py-0.5 rounded text-sm font-medium min-w-[2.5rem] text-center">
                  {param.label}
                </span>
                <span className="text-base text-stone-700">{param.value}</span>
              </div>
            ))}
          </div>
          {/* 茶种和定位单独一行 */}
          {paramPairs.slice(4).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-4">
              {paramPairs.slice(4).map((param) => (
                <div key={param.label} className="flex items-center gap-2">
                  <span className="bg-stone-800 text-white px-2 py-0.5 rounded text-sm font-medium min-w-[2.5rem] text-center">
                    {param.label}
                  </span>
                  <span className="text-base text-stone-700">{param.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {product.description && (
        <div className="px-6 pb-6">
          <div className="border-t border-stone-100 pt-4">
            <p className="text-stone-600 leading-relaxed whitespace-pre-wrap text-sm">
              {product.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
