import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizePlanKey, PLANS } from '@/lib/plans';

function parseMonthlyPrice(priceLabel: string) {
  const cleaned = priceLabel.replace(/[^0-9.]/g, '');
  return Number(cleaned || 0);
}

function monthKey(dateString: string) {
  return dateString.slice(0, 7);
}

export async function getRevenueAnalyticsSnapshot(monetizationSettings?: {
  estimatedCACUsd?: number;
  ltvMonths?: number;
  targetLtvToCacRatio?: number;
}) {
  const [
    { count: analysesCount },
    { count: buyVerdictsCount },
    { count: premiumGateCount },
    { count: checkoutIntentCount },
    { count: purchaseCount },
    { data: payingProfiles },
    { data: recentExecutionLogs },
  ] = await Promise.all([
    supabaseAdmin.from('analysis_execution_logs').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('analysis_execution_logs').select('*', { count: 'exact', head: true }).eq('verdict', 'BUY'),
    supabaseAdmin.from('analysis_execution_logs').select('*', { count: 'exact', head: true }).eq('revenue_mode', 'premium_gate'),
    supabaseAdmin.from('monetization_events').select('*', { count: 'exact', head: true }).eq('event_type', 'checkout_intent'),
    supabaseAdmin.from('monetization_events').select('*', { count: 'exact', head: true }).eq('event_type', 'purchase_completed'),
    supabaseAdmin.from('profiles').select('id, plan_key, created_at').neq('plan_key', 'free'),
    supabaseAdmin.from('analysis_execution_logs').select('id, product_name, verdict, score, confidence, burn_risk, recommended_plan, revenue_mode, created_at').order('created_at', { ascending: false }).limit(12),
  ]);

  const estimatedCACUsd = monetizationSettings?.estimatedCACUsd || 18;
  const ltvMonths = monetizationSettings?.ltvMonths || 8;
  const targetLtvToCacRatio = monetizationSettings?.targetLtvToCacRatio || 3;

  const mrr = (payingProfiles || []).reduce((sum: number, profile: any) => {
    const plan = PLANS[normalizePlanKey(profile.plan_key)];
    return sum + (plan ? parseMonthlyPrice(plan.priceLabel) : 0);
  }, 0);

  const payingUsersCount = (payingProfiles || []).length;
  const arppu = payingUsersCount ? Math.round((mrr / payingUsersCount) * 100) / 100 : 0;
  const ltvProxy = Math.round(arppu * ltvMonths * 100) / 100;
  const ltvToCac = estimatedCACUsd ? Math.round((ltvProxy / estimatedCACUsd) * 100) / 100 : 0;

  const cohortsMap = new Map<string, { month: string; paidUsers: number }>();
  for (const profile of payingProfiles || []) {
    const key = monthKey(profile.created_at || new Date().toISOString());
    const current = cohortsMap.get(key) || { month: key, paidUsers: 0 };
    current.paidUsers += 1;
    cohortsMap.set(key, current);
  }

  const cohorts = Array.from(cohortsMap.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

  const safeAnalyses = analysesCount || 0;
  const safePremiumGate = premiumGateCount || 0;
  const safeCheckoutIntent = checkoutIntentCount || 0;
  const safePurchase = purchaseCount || 0;

  return {
    analysesCount: safeAnalyses,
    buyVerdictsCount: buyVerdictsCount || 0,
    premiumGateCount: safePremiumGate,
    checkoutIntentCount: safeCheckoutIntent,
    purchaseCount: safePurchase,
    payingUsersCount,
    premiumGateRate: safeAnalyses ? Math.round((safePremiumGate / safeAnalyses) * 100) : 0,
    checkoutRate: safePremiumGate ? Math.round((safeCheckoutIntent / safePremiumGate) * 100) : 0,
    purchaseRate: safeCheckoutIntent ? Math.round((safePurchase / safeCheckoutIntent) * 100) : 0,
    mrr,
    arr: mrr * 12,
    arppu,
    ltvProxy,
    estimatedCACUsd,
    ltvToCac,
    targetLtvToCacRatio,
    cohorts,
    recentExecutionLogs: recentExecutionLogs || [],
  };
}
