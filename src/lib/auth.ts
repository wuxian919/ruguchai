import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const JWT_SECRET = process.env.JWT_SECRET || 'ruguchai-jwt-secret-key-2024';
const JWT_EXPIRES_IN = '30d'; // Token expires in 30 days

export interface TokenPayload {
  userId: number;
  username: string;
  tokenVersion: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function authenticateUser(username: string, password: string) {
  const client = getSupabaseClient();

  // Find user
  const { data: user, error } = await client
    .from('users')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (error || !user) {
    return { success: false, message: '用户名或密码错误' };
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return { success: false, message: '用户名或密码错误' };
  }

  // Generate token with current token_version
  const token = generateToken({
    userId: user.id,
    username: user.username,
    tokenVersion: user.token_version,
  });

  return {
    success: true,
    token,
    user: { id: user.id, username: user.username },
  };
}

export async function validateToken(token: string) {
  const payload = verifyToken(token);
  if (!payload) {
    return { valid: false, message: '登录已过期，请重新登录' };
  }

  const client = getSupabaseClient();
  const { data: user, error } = await client
    .from('users')
    .select('token_version')
    .eq('id', payload.userId)
    .maybeSingle();

  if (error || !user) {
    return { valid: false, message: '用户不存在' };
  }

  // Check if token version matches (if password was changed, version increments)
  if (user.token_version !== payload.tokenVersion) {
    return { valid: false, message: '密码已修改，请重新登录' };
  }

  return { valid: true, user: { id: payload.userId, username: payload.username } };
}

export async function changePassword(
  userId: number,
  oldPassword: string,
  newPassword: string
) {
  const client = getSupabaseClient();

  // Get current user
  const { data: user, error } = await client
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !user) {
    return { success: false, message: '用户不存在' };
  }

  // Verify old password
  const isValid = await verifyPassword(oldPassword, user.password_hash);
  if (!isValid) {
    return { success: false, message: '原密码错误' };
  }

  // Hash new password and increment token_version
  const newHash = await hashPassword(newPassword);
  const { error: updateError } = await client
    .from('users')
    .update({
      password_hash: newHash,
      token_version: user.token_version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    return { success: false, message: '密码修改失败' };
  }

  return { success: true, message: '密码修改成功' };
}

export async function createDefaultUser() {
  const client = getSupabaseClient();

  // Check if rugu user exists
  const { data: existing } = await client
    .from('users')
    .select('id')
    .eq('username', 'rugu')
    .maybeSingle();

  if (existing) {
    return { success: true, message: '默认用户已存在' };
  }

  const hash = await hashPassword('rugu');
  const { error } = await client
    .from('users')
    .insert({ username: 'rugu', password_hash: hash });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: '默认用户创建成功（rugu / rugu）' };
}
