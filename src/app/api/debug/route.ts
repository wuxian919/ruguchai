import { NextResponse } from 'next/server';
import { getSupabaseClient, getSupabaseServiceRoleKey } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    // Check environment variables
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? '✓ Set' : '✗ Missing',
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY ? '✓ Set' : '✗ Missing',
      JWT_SECRET: process.env.JWT_SECRET ? '✓ Set' : '✗ Missing',
    };

    // Check which key is being used
    const serviceRoleKey = getSupabaseServiceRoleKey();
    const usingKey = serviceRoleKey ? 'SUPABASE_SECRET_KEY (service role)' : 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (anon)';

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
        usingKey,
        supabaseError: error.message,
        errorDetails: error,
      });
    }

    return NextResponse.json({
      status: 'success',
      envVars,
      usingKey,
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
