import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult) return NextResponse.json({ error: '未登录' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate a unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `products/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Upload to Supabase Storage
    const client = getSupabaseClient();
    const { data, error } = await client.storage
      .from('products')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage error:', error);
      return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from('products')
      .getPublicUrl(fileName);

    return NextResponse.json({
      key: fileName,
      url: urlData.publicUrl,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
