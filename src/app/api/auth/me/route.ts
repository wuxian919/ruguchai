import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const validation = await validateToken(token);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.message }, { status: 401 });
  }

  return NextResponse.json({ user: validation.user });
}
