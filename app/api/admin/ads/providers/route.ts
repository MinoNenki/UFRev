import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/admin';
import { ensureDefaultAdProviders, sanitizeProviderConfig } from '@/lib/ad-providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - List all ad providers
export async function GET(req: NextRequest) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureDefaultAdProviders();
    const { data } = await supabaseAdmin.from('ad_providers_config').select('*').order('provider_name');
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching ad providers:', error);
    return NextResponse.json({ error: 'Failed to fetch ad providers' }, { status: 500 });
  }
}

// PUT - Update ad provider settings
export async function PUT(req: NextRequest) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, enabled, config_json } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing provider id' }, { status: 400 });
    }

    const { data: currentProvider, error: currentProviderError } = await supabaseAdmin
      .from('ad_providers_config')
      .select('provider_type, config_json')
      .eq('id', id)
      .maybeSingle();

    if (currentProviderError || !currentProvider) {
      return NextResponse.json({ error: currentProviderError?.message || 'Provider not found' }, { status: 404 });
    }

    const sanitizedConfig = sanitizeProviderConfig(currentProvider.provider_type, config_json ?? currentProvider.config_json ?? {});

    const { data, error } = await supabaseAdmin
      .from('ad_providers_config')
      .update({
        enabled: Boolean(enabled),
        config_json: sanitizedConfig,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data?.[0]);
  } catch (error) {
    console.error('Error updating ad provider:', error);
    return NextResponse.json({ error: 'Failed to update ad provider' }, { status: 500 });
  }
}
