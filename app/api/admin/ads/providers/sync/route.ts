import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ensureDefaultAdProviders, mergeProviderSyncIntoConfig, syncProvider, type AdProviderRow } from '@/lib/ad-providers';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureDefaultAdProviders();
    const body = await req.json().catch(() => ({}));
    const providerType = String(body?.providerType || '').trim();

    if (!providerType) {
      return NextResponse.json({ error: 'Missing provider type' }, { status: 400 });
    }

    const { data: provider, error } = await supabaseAdmin
      .from('ad_providers_config')
      .select('*')
      .eq('provider_type', providerType)
      .maybeSingle();

    if (error || !provider) {
      return NextResponse.json({ error: error?.message || 'Provider not found' }, { status: 404 });
    }

    const sync = await syncProvider(provider as AdProviderRow);
    const mergedConfig = mergeProviderSyncIntoConfig(provider.provider_type, provider.config_json, sync);

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('ad_providers_config')
      .update({
        config_json: mergedConfig,
        updated_at: new Date().toISOString(),
      })
      .eq('id', provider.id)
      .select()
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ provider: updated, sync });
  } catch (error) {
    console.error('Error syncing ad provider:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to sync provider' }, { status: 500 });
  }
}