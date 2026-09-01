import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

interface Category {
  id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const client = getSupabaseClient();

  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data as Category[] });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const client = getSupabaseClient();
  const body = await request.json();

  const { data, error } = await client
    .from('categories')
    .insert({
      name: body.name,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data as Category });
}
