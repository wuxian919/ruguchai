import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

function getS3Client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT_URL || process.env.COZE_BUCKET_ENDPOINT_URL;
  const region = process.env.S3_REGION || 'cn-beijing';

  const config: { region: string; endpoint?: string; forcePathStyle?: boolean } = {
    region,
  };

  if (endpoint) {
    config.endpoint = endpoint;
    config.forcePathStyle = true;
  }

  return new S3Client(config);
}

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

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate a unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `products/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const bucketName = process.env.S3_BUCKET_NAME || process.env.COZE_BUCKET_NAME;
    if (!bucketName) {
      return NextResponse.json({ error: 'S3 bucket not configured' }, { status: 500 });
    }

    const client = getS3Client();

    // Upload to S3
    const upload = new Upload({
      client,
      params: {
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      },
    });

    await upload.done();

    // Generate URL
    const endpoint = process.env.S3_ENDPOINT_URL || process.env.COZE_BUCKET_ENDPOINT_URL;
    let url: string;
    if (endpoint) {
      url = `${endpoint}/${bucketName}/${fileName}`;
    } else {
      url = `https://${bucketName}.s3.${process.env.S3_REGION || 'cn-beijing'}.amazonaws.com/${fileName}`;
    }

    return NextResponse.json({
      key: fileName,
      url,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
