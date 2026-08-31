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
    query = query.eq('category_id', parseInt(categoryId));
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
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
      is_pinned: body.is_pinned ?? false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data as Product });
}
