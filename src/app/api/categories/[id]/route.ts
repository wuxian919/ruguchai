import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface Category {
  id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = getSupabaseClient();
  const body = await request.json();

  const { data, error } = await client
    .from('categories')
    .update({
      name: body.name,
      sort_order: body.sort_order ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data as Category });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('categories')
    .delete()
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data as Category });
}
