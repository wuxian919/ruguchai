import { NextResponse } from 'next/server';
import { createDefaultUser } from '@/lib/auth';

export async function POST() {
  const result = await createDefaultUser();
  if (result.success) {
    return NextResponse.json({ message: result.message });
  }
  return NextResponse.json({ error: result.message }, { status: 500 });
}

export async function GET() {
  const result = await createDefaultUser();
  if (result.success) {
    return NextResponse.json({ message: result.message });
  }
  return NextResponse.json({ error: result.message }, { status: 500 });
}
