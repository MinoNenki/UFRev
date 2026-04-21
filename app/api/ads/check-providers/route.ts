import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getEnabledAdProviders } from '@/lib/app-config';
import { getProviderSummary } from '@/lib/ad-providers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const enabledProviders = await getEnabledAdProviders();
    const summary = getProviderSummary(enabledProviders as any);

    return NextResponse.json({
      hasAds: summary.hasRewardAds,
      hasRewardAds: summary.hasRewardAds,
      hasDisplayAds: summary.hasDisplayAds,
      displayInventory: summary.displayInventory,
      rewardProvider: summary.rewardProvider,
      enabledProviders: enabledProviders.map(p => ({
        id: p.id,
        type: p.provider_type,
        name: p.provider_name,
        description: p.description,
      })),
    });
  } catch (error) {
    console.error('Error checking ad providers:', error);
    return NextResponse.json({ error: 'Failed to check ad providers' }, { status: 500 });
  }
}
