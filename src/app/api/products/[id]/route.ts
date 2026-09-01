import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (!authResult) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await params;
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('products')
    .select('*')
    .eq('id', parseInt(id))
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json({ data: data as Product });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (!authResult) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { id } = await params;
  const client = getSupabaseClient();
  const body = await request.json();

  const { data, error } = await client
    .from('products')
    .update({
      name: body.name,
      image_url: body.image_url,
      params: body.params || null,
      description: body.description || null,
      sort_order: body.sort_order ?? 0,
      category_id: body.category_id || null,
      category_ids: body.category_ids || null,
      is_pinned: body.is_pinned ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data as Product });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (!authResult) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { id } = await params;
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('products')
    .delete()
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data as Product });
}
