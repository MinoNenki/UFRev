import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

// GET - Get user's ad accounts
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data } = await supabaseAdmin
      .from('user_ad_accounts')
      .select('id, provider_type, account_email, is_active, is_verified, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching user ad accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch ad accounts' }, { status: 500 });
  }
}

// POST - Create/link ad account
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { provider_type, account_email, account_id } = body;

    if (!provider_type || !account_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if provider exists and is enabled
    const { data: provider } = await supabaseAdmin
      .from('ad_providers_config')
      .select('enabled')
      .eq('provider_type', provider_type)
      .maybeSingle();

    if (!provider || !provider.enabled) {
      return NextResponse.json({ error: 'Provider not available' }, { status: 400 });
    }

    // Insert or update account
    const { data, error } = await supabaseAdmin
      .from('user_ad_accounts')
      .upsert({
        user_id: user.id,
        provider_type,
        account_email,
        account_id: account_id || account_email,
        is_active: true,
        is_verified: false,
      }, { onConflict: 'user_id,provider_type' })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data?.[0]);
  } catch (error) {
    console.error('Error creating ad account:', error);
    return NextResponse.json({ error: 'Failed to create ad account' }, { status: 500 });
  }
}

// DELETE - Remove ad account
export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('id');

    if (!accountId) {
      return NextResponse.json({ error: 'Missing account id' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('user_ad_accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ad account:', error);
    return NextResponse.json({ error: 'Failed to delete ad account' }, { status: 500 });
  }
}
