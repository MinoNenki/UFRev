import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, isAdmin: false };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, email, full_name, company_name')
    .eq('id', user.id)
    .single();

  return {
    supabase,
    user,
    profile,
    isAdmin: profile?.role === 'admin',
  };
}
