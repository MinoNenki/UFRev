import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  const formData = await req.formData();
  const fullName = String(formData.get('fullName') || '').trim();
  const companyName = String(formData.get('companyName') || '').trim();

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName || null,
      company_name: companyName || null,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return NextResponse.redirect(new URL('/account?error=1', req.url));
  }

  return NextResponse.redirect(new URL('/account?saved=1', req.url));
}
