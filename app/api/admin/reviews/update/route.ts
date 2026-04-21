import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  const formData = await req.formData();
  const id = String(formData.get('id') || '');
  const status = String(formData.get('status') || 'pending');

  if (!id || !['pending', 'approved', 'rejected'].includes(status)) {
    return NextResponse.redirect(new URL('/admin/reviews?error=1', req.url));
  }

  await supabaseAdmin.from('reviews').update({ status }).eq('id', id);
  return NextResponse.redirect(new URL('/admin/reviews?updated=1', req.url));
}
