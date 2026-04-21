import { supabaseAdmin } from '@/lib/supabase-admin';

const DEFAULT_RETENTION_SETTINGS = {
  inactivityDaysHighRisk: 10,
  inactivityDaysMediumRisk: 5,
  winbackCreditBonus: 2,
  winbackDiscountPercent: 25,
  crmEnabled: true,
  churnDefenseEnabled: true,
} as const;

const DEFAULT_PRICING_SETTINGS = {
  dynamicPricingEnabled: true,
  premiumAnnualDiscountPercent: 15,
  priceExperimentIntensity: 1,
  highIntentBoostPercent: 12,
} as const;

const DEFAULT_NOTIFICATION_SETTINGS = {
  inAppEnabled: true,
  emailEnabled: false,
  telegramEnabled: false,
  discordEnabled: false,
  pushEnabled: false,
  realtimeAlertsEnabled: true,
  alertEmailAddress: '',
  telegramChatId: '',
  discordWebhookUrl: '',
} as const;

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeNumber(value: unknown, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

export async function getRetentionSettings() {
  const { data } = await supabaseAdmin.from('app_config').select('value_json').eq('key', 'retention_settings').maybeSingle();
  const config = (data?.value_json || {}) as Record<string, unknown>;
  return {
    inactivityDaysHighRisk: normalizeNumber(config.inactivity_days_high_risk, DEFAULT_RETENTION_SETTINGS.inactivityDaysHighRisk),
    inactivityDaysMediumRisk: normalizeNumber(config.inactivity_days_medium_risk, DEFAULT_RETENTION_SETTINGS.inactivityDaysMediumRisk),
    winbackCreditBonus: normalizeNumber(config.winback_credit_bonus, DEFAULT_RETENTION_SETTINGS.winbackCreditBonus),
    winbackDiscountPercent: normalizeNumber(config.winback_discount_percent, DEFAULT_RETENTION_SETTINGS.winbackDiscountPercent),
    crmEnabled: normalizeBoolean(config.crm_enabled, DEFAULT_RETENTION_SETTINGS.crmEnabled),
    churnDefenseEnabled: normalizeBoolean(config.churn_defense_enabled, DEFAULT_RETENTION_SETTINGS.churnDefenseEnabled),
  };
}

export async function getPricingSettings() {
  const { data } = await supabaseAdmin.from('app_config').select('value_json').eq('key', 'pricing_settings').maybeSingle();
  const config = (data?.value_json || {}) as Record<string, unknown>;
  return {
    dynamicPricingEnabled: normalizeBoolean(config.dynamic_pricing_enabled, DEFAULT_PRICING_SETTINGS.dynamicPricingEnabled),
    premiumAnnualDiscountPercent: normalizeNumber(config.premium_annual_discount_percent, DEFAULT_PRICING_SETTINGS.premiumAnnualDiscountPercent),
    priceExperimentIntensity: normalizeNumber(config.price_experiment_intensity, DEFAULT_PRICING_SETTINGS.priceExperimentIntensity),
    highIntentBoostPercent: normalizeNumber(config.high_intent_boost_percent, DEFAULT_PRICING_SETTINGS.highIntentBoostPercent),
  };
}

export async function getNotificationSettings() {
  const { data } = await supabaseAdmin.from('app_config').select('value_json').eq('key', 'notification_settings').maybeSingle();
  const config = (data?.value_json || {}) as Record<string, unknown>;
  return {
    inAppEnabled: normalizeBoolean(config.in_app_enabled, DEFAULT_NOTIFICATION_SETTINGS.inAppEnabled),
    emailEnabled: normalizeBoolean(config.email_enabled, DEFAULT_NOTIFICATION_SETTINGS.emailEnabled),
    telegramEnabled: normalizeBoolean(config.telegram_enabled, DEFAULT_NOTIFICATION_SETTINGS.telegramEnabled),
    discordEnabled: normalizeBoolean(config.discord_enabled, DEFAULT_NOTIFICATION_SETTINGS.discordEnabled),
    pushEnabled: normalizeBoolean(config.push_enabled, DEFAULT_NOTIFICATION_SETTINGS.pushEnabled),
    realtimeAlertsEnabled: normalizeBoolean(config.realtime_alerts_enabled, DEFAULT_NOTIFICATION_SETTINGS.realtimeAlertsEnabled),
    alertEmailAddress: normalizeString(config.alert_email_address, DEFAULT_NOTIFICATION_SETTINGS.alertEmailAddress),
    telegramChatId: normalizeString(config.telegram_chat_id, DEFAULT_NOTIFICATION_SETTINGS.telegramChatId),
    discordWebhookUrl: normalizeString(config.discord_webhook_url, DEFAULT_NOTIFICATION_SETTINGS.discordWebhookUrl),
  };
}
