import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

function checked(formData: FormData, key: string) {
  return formData.get(key) === 'on';
}

export async function POST(req: NextRequest) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.redirect(new URL('/auth/login', req.url));

  const formData = await req.formData();
  const syncIntervalMinutes = Number(formData.get('syncIntervalMinutes') || 60);
  const priceFloorPercent = Number(formData.get('priceFloorPercent') || 18);
  const maxDailyRewardClaims = Number(formData.get('maxDailyRewardClaims') || 10);
  const profitabilityGuardrailPercent = Number(formData.get('profitabilityGuardrailPercent') || 22);
  const minConfidenceForBuy = Number(formData.get('minConfidenceForBuy') || 60);
  const maxSafeTestBudgetUsd = Number(formData.get('maxSafeTestBudgetUsd') || 800);
  const maxDailySpendUsd = Number(formData.get('maxDailySpendUsd') || 1500);
  const maxAllowedRefundRatePercent = Number(formData.get('maxAllowedRefundRatePercent') || 8);
  const maxAllowedCACPercentOfAOV = Number(formData.get('maxAllowedCACPercentOfAOV') || 35);
  const cooldownHoursAfterLoss = Number(formData.get('cooldownHoursAfterLoss') || 24);
  const stagedRolloutPercent = Number(formData.get('stagedRolloutPercent') || 20);
  const stagedRolloutMaxWaves = Number(formData.get('stagedRolloutMaxWaves') || 3);

  if (syncIntervalMinutes < 15 || syncIntervalMinutes > 1440 || priceFloorPercent < 5 || priceFloorPercent > 80 || maxDailyRewardClaims < 1 || maxDailyRewardClaims > 50 || profitabilityGuardrailPercent < 5 || profitabilityGuardrailPercent > 80 || minConfidenceForBuy < 20 || minConfidenceForBuy > 95 || maxSafeTestBudgetUsd < 50 || maxSafeTestBudgetUsd > 50000 || maxDailySpendUsd < 50 || maxDailySpendUsd > 250000 || maxAllowedRefundRatePercent < 1 || maxAllowedRefundRatePercent > 80 || maxAllowedCACPercentOfAOV < 5 || maxAllowedCACPercentOfAOV > 95 || cooldownHoursAfterLoss < 1 || cooldownHoursAfterLoss > 240 || stagedRolloutPercent < 5 || stagedRolloutPercent > 100 || stagedRolloutMaxWaves < 1 || stagedRolloutMaxWaves > 10) {
    return NextResponse.redirect(new URL('/admin/automations?error=1', req.url));
  }

  await supabaseAdmin.from('app_config').upsert({
    key: 'automation_settings',
    value_json: {
      auto_competitor_scans: checked(formData, 'autoCompetitorScans'),
      auto_market_watch_alerts: checked(formData, 'autoMarketWatchAlerts'),
      weekly_market_digest: checked(formData, 'weeklyMarketDigest'),
      auto_margin_alerts: checked(formData, 'autoMarginAlerts'),
      auto_review_requests: checked(formData, 'autoReviewRequests'),
      auto_restock_warnings: checked(formData, 'autoRestockWarnings'),
      auto_pause_low_margin_ads: checked(formData, 'autoPauseLowMarginAds'),
      sync_interval_minutes: syncIntervalMinutes,
      price_floor_percent: priceFloorPercent,
      max_daily_reward_claims: maxDailyRewardClaims,
      profitability_guardrail_percent: profitabilityGuardrailPercent,
      min_confidence_for_buy: minConfidenceForBuy,
      max_safe_test_budget_usd: maxSafeTestBudgetUsd,
      require_competitor_evidence_for_buy: checked(formData, 'requireCompetitorEvidenceForBuy'),
      require_url_for_buy: checked(formData, 'requireUrlForBuy'),
      require_manual_approval_for_scale: checked(formData, 'requireManualApprovalForScale'),
      kill_switch_enabled: checked(formData, 'killSwitchEnabled'),
      max_daily_spend_usd: maxDailySpendUsd,
      max_allowed_refund_rate_percent: maxAllowedRefundRatePercent,
      max_allowed_cac_percent_of_aov: maxAllowedCACPercentOfAOV,
      cooldown_hours_after_loss: cooldownHoursAfterLoss,
      staged_rollout_percent: stagedRolloutPercent,
      staged_rollout_max_waves: stagedRolloutMaxWaves,
    },
    updated_at: new Date().toISOString(),
  });

  return NextResponse.redirect(new URL('/admin/automations?updated=1', req.url));
}
