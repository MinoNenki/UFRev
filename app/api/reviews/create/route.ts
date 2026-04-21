import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const formData = await req.formData();
  const name = String(formData.get('name') || '').trim();
  const companyOrRole = String(formData.get('companyOrRole') || '').trim();
  const content = String(formData.get('content') || '').trim();
  const rating = Number(formData.get('rating') || 5);

  if (!name || !content || Number.isNaN(rating) || rating < 1 || rating > 5) {
    return NextResponse.redirect(new URL('/reviews?error=missing', req.url));
  }

  const { error } = await supabase.from('reviews').insert({
    user_id: user?.id ?? null,
    name,
    company_or_role: companyOrRole || null,
    content,
    rating,
    status: 'pending',
  });

  if (error) {
    return NextResponse.redirect(new URL('/reviews?error=save', req.url));
  }

  return NextResponse.redirect(new URL('/reviews?sent=1', req.url));
}
