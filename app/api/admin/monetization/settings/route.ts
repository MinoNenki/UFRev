import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.redirect(new URL('/auth/login', req.url));
  const formData = await req.formData();
  const dailyAdLimit = Number(formData.get('dailyAdLimit') || 6);
  const dailyRewardCredits = Number(formData.get('dailyRewardCredits') || 1);
  const smartPaywallEnabled = formData.get('smartPaywallEnabled') === 'on';
  const premiumGateScore = Number(formData.get('premiumGateScore') || 76);
  const highIntentConfidence = Number(formData.get('highIntentConfidence') || 72);
  const freeAnalysesBeforePaywall = Number(formData.get('freeAnalysesBeforePaywall') || 1);
  const creditPackUpsellScore = Number(formData.get('creditPackUpsellScore') || 68);
  const annualDiscountPercent = Number(formData.get('annualDiscountPercent') || 15);
  const adUnlockEnabled = formData.get('adUnlockEnabled') === 'on';
  const estimatedCACUsd = Number(formData.get('estimatedCACUsd') || 24);
  const ltvMonths = Number(formData.get('ltvMonths') || 10);
  const targetLtvToCacRatio = Number(formData.get('targetLtvToCacRatio') || 4);
  if (dailyAdLimit < 1 || dailyAdLimit > 50 || dailyRewardCredits < 1 || dailyRewardCredits > 20 || premiumGateScore < 40 || premiumGateScore > 95 || highIntentConfidence < 30 || highIntentConfidence > 95 || freeAnalysesBeforePaywall < 0 || freeAnalysesBeforePaywall > 20 || creditPackUpsellScore < 30 || creditPackUpsellScore > 95 || annualDiscountPercent < 0 || annualDiscountPercent > 80 || estimatedCACUsd < 1 || estimatedCACUsd > 10000 || ltvMonths < 1 || ltvMonths > 60 || targetLtvToCacRatio < 1 || targetLtvToCacRatio > 20) {
    return NextResponse.redirect(new URL('/admin/monetization?error=1', req.url));
  }
  await Promise.all([
    supabaseAdmin.from('app_config').upsert({ key: 'reward_ads', value_json: { daily_ad_limit: dailyAdLimit, daily_reward_credits: dailyRewardCredits }, updated_at: new Date().toISOString() }),
    supabaseAdmin.from('app_config').upsert({
      key: 'monetization_settings',
      value_json: {
        smart_paywall_enabled: smartPaywallEnabled,
        premium_gate_score: premiumGateScore,
        high_intent_confidence: highIntentConfidence,
        free_analyses_before_paywall: freeAnalysesBeforePaywall,
        credit_pack_upsell_score: creditPackUpsellScore,
        annual_discount_percent: annualDiscountPercent,
        ad_unlock_enabled: adUnlockEnabled,
        estimated_cac_usd: estimatedCACUsd,
        ltv_months: ltvMonths,
        target_ltv_to_cac_ratio: targetLtvToCacRatio,
      },
      updated_at: new Date().toISOString(),
    }),
  ]);
  return NextResponse.redirect(new URL('/admin/monetization?updated=1', req.url));
}
