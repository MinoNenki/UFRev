import { createClient } from '@supabase/supabase-js';
import { env, isSupabaseAdminConfigured } from '@/lib/env';

function resolved(data: any = null, count = 0) {
  return Promise.resolve({ data, error: { message: 'Supabase admin is not configured.' }, count });
}

const chain = {
  eq: () => chain,
  neq: () => chain,
  order: () => chain,
  limit: () => resolved([]),
  maybeSingle: () => resolved(null),
};

const stub = {
  from() {
    return {
      select: () => chain,
      insert: () => resolved(null),
      update: () => ({ eq: () => resolved(null) }),
      upsert: () => resolved(null),
    };
  },
  rpc: () => resolved(null),
};

export const supabaseAdmin = isSupabaseAdminConfigured
  ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : (stub as any);
