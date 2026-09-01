import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    // Check environment variables
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? '✓ Set' : '✗ Missing',
      JWT_SECRET: process.env.JWT_SECRET ? '✓ Set' : '✗ Missing',
    };

    // Test Supabase connection
    const client = getSupabaseClient();
    const { data: users, error } = await client
      .from('users')
      .select('id, username')
      .limit(1);

    if (error) {
      return NextResponse.json({
        status: 'error',
        envVars,
        supabaseError: error.message,
      });
    }

    return NextResponse.json({
      status: 'success',
      envVars,
      userCount: users?.length || 0,
      sampleUser: users?.[0] || null,
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      error: err.message,
    });
  }
}
