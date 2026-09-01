import { NextRequest, NextResponse } from 'next/server';
import { changePassword, validateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const validation = await validateToken(token);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 401 });
    }

    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: '请输入原密码和新密码' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '新密码至少6位' },
        { status: 400 }
      );
    }

    const result = await changePassword(validation.user!.id, oldPassword, newPassword);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: '修改密码失败' },
      { status: 500 }
    );
  }
}
