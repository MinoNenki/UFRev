import { supabaseAdmin } from '@/lib/supabase-admin';

export const DEFAULT_REWARD_SETTINGS = {
  dailyAdLimit: 6,
  dailyRewardCredits: 1,
} as const;

export async function getRewardSettings() {
  const { data } = await supabaseAdmin.from('app_config').select('value_json').eq('key', 'reward_ads').maybeSingle();
  const config = (data?.value_json || {}) as { daily_ad_limit?: number; daily_reward_credits?: number };

  return {
    dailyAdLimit: Number(config.daily_ad_limit || DEFAULT_REWARD_SETTINGS.dailyAdLimit),
    dailyRewardCredits: Number(config.daily_reward_credits || DEFAULT_REWARD_SETTINGS.dailyRewardCredits),
  };
}


export const DEFAULT_REFERRAL_SETTINGS = {
  rewardCredits: 1,
} as const;

export async function getReferralSettings() {
  const { data } = await supabaseAdmin.from('app_config').select('value_json').eq('key', 'referral_settings').maybeSingle();
  const config = (data?.value_json || {}) as { reward_credits?: number };
  return { rewardCredits: Number(config.reward_credits || DEFAULT_REFERRAL_SETTINGS.rewardCredits) };
}


export const DEFAULT_MONETIZATION_SETTINGS = {
  smartPaywallEnabled: true,
  premiumGateScore: 76,
  highIntentConfidence: 72,
  freeAnalysesBeforePaywall: 1,
  creditPackUpsellScore: 68,
  annualDiscountPercent: 15,
  adUnlockEnabled: true,
  estimatedCACUsd: 24,
  ltvMonths: 10,
  targetLtvToCacRatio: 4,
} as const;

export async function getMonetizationSettings() {
  const { data } = await supabaseAdmin.from('app_config').select('value_json').eq('key', 'monetization_settings').maybeSingle();
  const config = (data?.value_json || {}) as Record<string, unknown>;
  return {
    smartPaywallEnabled: typeof config.smart_paywall_enabled === 'boolean' ? config.smart_paywall_enabled : DEFAULT_MONETIZATION_SETTINGS.smartPaywallEnabled,
    premiumGateScore: Number(config.premium_gate_score || DEFAULT_MONETIZATION_SETTINGS.premiumGateScore),
    highIntentConfidence: Number(config.high_intent_confidence || DEFAULT_MONETIZATION_SETTINGS.highIntentConfidence),
    freeAnalysesBeforePaywall: Number(config.free_analyses_before_paywall || DEFAULT_MONETIZATION_SETTINGS.freeAnalysesBeforePaywall),
    creditPackUpsellScore: Number(config.credit_pack_upsell_score || DEFAULT_MONETIZATION_SETTINGS.creditPackUpsellScore),
    annualDiscountPercent: Number(config.annual_discount_percent || DEFAULT_MONETIZATION_SETTINGS.annualDiscountPercent),
    adUnlockEnabled: typeof config.ad_unlock_enabled === 'boolean' ? config.ad_unlock_enabled : DEFAULT_MONETIZATION_SETTINGS.adUnlockEnabled,
    estimatedCACUsd: Number(config.estimated_cac_usd || DEFAULT_MONETIZATION_SETTINGS.estimatedCACUsd),
    ltvMonths: Number(config.ltv_months || DEFAULT_MONETIZATION_SETTINGS.ltvMonths),
    targetLtvToCacRatio: Number(config.target_ltv_to_cac_ratio || DEFAULT_MONETIZATION_SETTINGS.targetLtvToCacRatio),
  };
}

// Ad providers related functions
export interface AdProvider {
  id: string;
  provider_type: string;
  provider_name: string;
  enabled: boolean;
  config_json?: Record<string, unknown>;
  description?: string;
}

export async function getEnabledAdProviders() {
  const { data } = await supabaseAdmin.from('ad_providers_config').select('*').eq('enabled', true);
  return (data || []) as AdProvider[];
}

export async function getAllAdProviders() {
  const { data } = await supabaseAdmin.from('ad_providers_config').select('*');
  return (data || []) as AdProvider[];
}

export async function getUserAdAccounts(userId: string) {
  const { data } = await supabaseAdmin.from('user_ad_accounts').select('*').eq('user_id', userId).eq('is_active', true);
  return (data || []) as any[];
}

export async function hasUserConfiguredAds(userId: string) {
  const enabledProviders = await getEnabledAdProviders();
  if (enabledProviders.length === 0) return false;
  const accounts = await getUserAdAccounts(userId);
  return accounts.length > 0;
}
