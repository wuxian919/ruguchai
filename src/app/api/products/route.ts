import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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

export async function GET(request: NextRequest) {
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('category_id');
  const search = searchParams.get('search');

  let query = client.from('products').select('*');

  if (categoryId) {
    // 支持多选分类：检查 category_ids 数组是否包含该分类 ID
    // 同时兼容旧的 category_id 字段
    const catId = parseInt(categoryId);
    query = query.or(`category_ids.cs.[${catId}],category_id.eq.${catId}`);
  }

  if (search) {
    // jsonb 字段不支持 ilike，先获取全部数据再在内存中过滤
    const { data: allData, error: fetchError } = await query
      .order('is_pinned', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const keyword = search.toLowerCase();
    const filtered = (allData || []).filter((p: Product) => {
      // 搜索名称和描述
      if (p.name?.toLowerCase().includes(keyword)) return true;
      if (p.description?.toLowerCase().includes(keyword)) return true;
      // 搜索所有参数值
      if (p.params) {
        for (const val of Object.values(p.params)) {
          if (String(val).toLowerCase().includes(keyword)) return true;
        }
      }
      return false;
    });

    return NextResponse.json({ data: filtered });
  }

  const { data, error } = await query
    .order('is_pinned', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data as Product[] });
}

export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  const body = await request.json();

  const { data, error } = await client
    .from('products')
    .insert({
      name: body.name,
      image_url: body.image_url,
      params: body.params || null,
      description: body.description || null,
      sort_order: body.sort_order ?? 0,
      category_id: body.category_id || null,
      category_ids: body.category_ids || null,
      is_pinned: body.is_pinned ?? false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data as Product });
}
