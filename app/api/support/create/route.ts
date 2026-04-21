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
  const email = String(formData.get('email') || '').trim();
  const subject = String(formData.get('subject') || '').trim();
  const message = String(formData.get('message') || '').trim();

  if (!email || !subject || !message) {
    return NextResponse.redirect(new URL('/support?error=missing', req.url));
  }

  const { error } = await supabase.from('support_messages').insert({
    user_id: user?.id ?? null,
    name: name || null,
    email,
    subject,
    message,
    status: 'new',
  });

  if (error) {
    return NextResponse.redirect(new URL('/support?error=save', req.url));
  }

  return NextResponse.redirect(new URL('/support?sent=1', req.url));
}
