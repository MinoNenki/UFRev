import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

async function performLogout(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('LOGOUT ERROR:', error);
  }

  return NextResponse.redirect(new URL('/?loggedOut=1', request.url), { status: 303 });
}

export async function POST(request: Request) {
  return performLogout(request);
}

export async function GET(request: Request) {
  return performLogout(request);
}
