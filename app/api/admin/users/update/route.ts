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
  const role = String(formData.get('role') || 'user');

  if (!id || !['user', 'admin'].includes(role)) {
    return NextResponse.redirect(new URL('/admin/users?error=1', req.url));
  }

  await supabaseAdmin.from('profiles').update({ role }).eq('id', id);
  return NextResponse.redirect(new URL('/admin/users?updated=1', req.url));
}
