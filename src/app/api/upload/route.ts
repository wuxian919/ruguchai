import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
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

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure the 'images' bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('Failed to list buckets:', listError);
    }
    const imagesBucket = buckets?.find((b) => b.name === 'images');
    if (!imagesBucket) {
      console.log('Creating images bucket...');
      const { error: createError } = await supabase.storage.createBucket('images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      if (createError) {
        console.error('Failed to create bucket:', createError);
        return NextResponse.json({ 
          error: '存储桶创建失败。请在 Supabase 后台手动创建：进入项目 → Storage → New bucket → 名称填写 "images" → 开启 Public bucket → Create',
          detail: createError.message 
        }, { status: 500 });
      }
    }

    // Generate a unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = `products/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return NextResponse.json({
      key: filePath,
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
