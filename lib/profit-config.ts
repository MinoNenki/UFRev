import { supabaseAdmin } from '@/lib/supabase-admin';
import { createDefaultConnectionChecks, type IntegrationConnectionCheck, type IntegrationConnectionChecks } from '@/lib/integration-health';

export const DEFAULT_AUTOMATION_SETTINGS = {
  autoCompetitorScans: true,
  autoMarketWatchAlerts: true,
  weeklyMarketDigest: true,
  autoMarginAlerts: true,
  autoReviewRequests: true,
  autoRestockWarnings: true,
  autoPauseLowMarginAds: true,
  syncIntervalMinutes: 60,
  priceFloorPercent: 18,
  maxDailyRewardClaims: 8,
  profitabilityGuardrailPercent: 22,
  minConfidenceForBuy: 60,
  maxSafeTestBudgetUsd: 800,
  requireCompetitorEvidenceForBuy: true,
  requireUrlForBuy: true,
  requireManualApprovalForScale: true,
  killSwitchEnabled: true,
  maxDailySpendUsd: 1500,
  maxAllowedRefundRatePercent: 8,
  maxAllowedCACPercentOfAOV: 35,
  cooldownHoursAfterLoss: 24,
  stagedRolloutPercent: 20,
  stagedRolloutMaxWaves: 3,
} as const;

export const DEFAULT_INTEGRATION_SETTINGS = {
  shopifyEnabled: false,
  amazonEnabled: false,
  ebayEnabled: false,
  alibabaEnabled: false,
  aliexpressEnabled: false,
  walmartEnabled: false,
  etsyEnabled: false,
  rakutenEnabled: false,
  allegroEnabled: false,
  cdiscountEnabled: false,
  emagEnabled: false,
  ottoEnabled: false,
  zalandoEnabled: false,
  woocommerceEnabled: false,
  tiktokEnabled: false,
  metaAdsEnabled: false,
  shopifyStoreDomain: '',
  amazonMarketplaceId: '',
  ebaySiteId: 'EBAY_US',
  woocommerceStoreUrl: '',
  alibabaRegion: 'GLOBAL',
  allegroRegion: 'PL',
  tiktokAdAccountId: '',
  metaBusinessId: '',
  syncInventory: true,
  syncOrders: true,
  syncPricing: true,
  syncListings: true,
  syncReturns: true,
  syncTraffic: true,
  dryRunMode: true,
  requireManualApproval: true,
  autoPublishDisabled: true,
  maxSyncPriceChangePercent: 15,
  minimumStockBufferUnits: 5,
  maxListingsPerHour: 25,
  connectionChecks: createDefaultConnectionChecks(),
};

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

function normalizeConnectionCheck(value: unknown, fallback: IntegrationConnectionCheck) {
  if (!value || typeof value !== 'object') return fallback;
  const raw = value as Record<string, unknown>;
  const state = typeof raw.state === 'string' ? raw.state : fallback.state;
  const allowedState = state === 'validated' || state === 'invalid' || state === 'unavailable' || state === 'not_configured'
    ? state
    : fallback.state;

  return {
    state: allowedState,
    message: normalizeString(raw.message, fallback.message),
    checkedAt: normalizeString(raw.checkedAt, fallback.checkedAt || '') || null,
    evidence: normalizeString(raw.evidence, fallback.evidence || '') || null,
  };
}

function normalizeConnectionChecks(value: unknown): IntegrationConnectionChecks {
  const fallback = createDefaultConnectionChecks();
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};

  return {
    shopify: normalizeConnectionCheck(raw.shopify, fallback.shopify),
    woocommerce: normalizeConnectionCheck(raw.woocommerce, fallback.woocommerce),
    tiktok: normalizeConnectionCheck(raw.tiktok, fallback.tiktok),
    meta: normalizeConnectionCheck(raw.meta, fallback.meta),
  };
}

export async function getAutomationSettings() {
  const { data } = await supabaseAdmin.from('app_config').select('value_json').eq('key', 'automation_settings').maybeSingle();
  const config = (data?.value_json || {}) as Record<string, unknown>;
  return {
    autoCompetitorScans: normalizeBoolean(config.auto_competitor_scans, DEFAULT_AUTOMATION_SETTINGS.autoCompetitorScans),
    autoMarketWatchAlerts: normalizeBoolean(config.auto_market_watch_alerts, DEFAULT_AUTOMATION_SETTINGS.autoMarketWatchAlerts),
    weeklyMarketDigest: normalizeBoolean(config.weekly_market_digest, DEFAULT_AUTOMATION_SETTINGS.weeklyMarketDigest),
    autoMarginAlerts: normalizeBoolean(config.auto_margin_alerts, DEFAULT_AUTOMATION_SETTINGS.autoMarginAlerts),
    autoReviewRequests: normalizeBoolean(config.auto_review_requests, DEFAULT_AUTOMATION_SETTINGS.autoReviewRequests),
    autoRestockWarnings: normalizeBoolean(config.auto_restock_warnings, DEFAULT_AUTOMATION_SETTINGS.autoRestockWarnings),
    autoPauseLowMarginAds: normalizeBoolean(config.auto_pause_low_margin_ads, DEFAULT_AUTOMATION_SETTINGS.autoPauseLowMarginAds),
    syncIntervalMinutes: normalizeNumber(config.sync_interval_minutes, DEFAULT_AUTOMATION_SETTINGS.syncIntervalMinutes),
    priceFloorPercent: normalizeNumber(config.price_floor_percent, DEFAULT_AUTOMATION_SETTINGS.priceFloorPercent),
    maxDailyRewardClaims: normalizeNumber(config.max_daily_reward_claims, DEFAULT_AUTOMATION_SETTINGS.maxDailyRewardClaims),
    profitabilityGuardrailPercent: normalizeNumber(config.profitability_guardrail_percent, DEFAULT_AUTOMATION_SETTINGS.profitabilityGuardrailPercent),
    minConfidenceForBuy: normalizeNumber(config.min_confidence_for_buy, DEFAULT_AUTOMATION_SETTINGS.minConfidenceForBuy),
    maxSafeTestBudgetUsd: normalizeNumber(config.max_safe_test_budget_usd, DEFAULT_AUTOMATION_SETTINGS.maxSafeTestBudgetUsd),
    requireCompetitorEvidenceForBuy: normalizeBoolean(config.require_competitor_evidence_for_buy, DEFAULT_AUTOMATION_SETTINGS.requireCompetitorEvidenceForBuy),
    requireUrlForBuy: normalizeBoolean(config.require_url_for_buy, DEFAULT_AUTOMATION_SETTINGS.requireUrlForBuy),
    requireManualApprovalForScale: normalizeBoolean(config.require_manual_approval_for_scale, DEFAULT_AUTOMATION_SETTINGS.requireManualApprovalForScale),
    killSwitchEnabled: normalizeBoolean(config.kill_switch_enabled, DEFAULT_AUTOMATION_SETTINGS.killSwitchEnabled),
    maxDailySpendUsd: normalizeNumber(config.max_daily_spend_usd, DEFAULT_AUTOMATION_SETTINGS.maxDailySpendUsd),
    maxAllowedRefundRatePercent: normalizeNumber(config.max_allowed_refund_rate_percent, DEFAULT_AUTOMATION_SETTINGS.maxAllowedRefundRatePercent),
    maxAllowedCACPercentOfAOV: normalizeNumber(config.max_allowed_cac_percent_of_aov, DEFAULT_AUTOMATION_SETTINGS.maxAllowedCACPercentOfAOV),
    cooldownHoursAfterLoss: normalizeNumber(config.cooldown_hours_after_loss, DEFAULT_AUTOMATION_SETTINGS.cooldownHoursAfterLoss),
    stagedRolloutPercent: normalizeNumber(config.staged_rollout_percent, DEFAULT_AUTOMATION_SETTINGS.stagedRolloutPercent),
    stagedRolloutMaxWaves: normalizeNumber(config.staged_rollout_max_waves, DEFAULT_AUTOMATION_SETTINGS.stagedRolloutMaxWaves),
  };
}

export async function getIntegrationSettings() {
  const { data } = await supabaseAdmin.from('app_config').select('value_json').eq('key', 'integration_settings').maybeSingle();
  const config = (data?.value_json || {}) as Record<string, unknown>;
  return {
    shopifyEnabled: normalizeBoolean(config.shopify_enabled, DEFAULT_INTEGRATION_SETTINGS.shopifyEnabled),
    amazonEnabled: normalizeBoolean(config.amazon_enabled, DEFAULT_INTEGRATION_SETTINGS.amazonEnabled),
    ebayEnabled: normalizeBoolean(config.ebay_enabled, DEFAULT_INTEGRATION_SETTINGS.ebayEnabled),
    alibabaEnabled: normalizeBoolean(config.alibaba_enabled, DEFAULT_INTEGRATION_SETTINGS.alibabaEnabled),
    aliexpressEnabled: normalizeBoolean(config.aliexpress_enabled, DEFAULT_INTEGRATION_SETTINGS.aliexpressEnabled),
    walmartEnabled: normalizeBoolean(config.walmart_enabled, DEFAULT_INTEGRATION_SETTINGS.walmartEnabled),
    etsyEnabled: normalizeBoolean(config.etsy_enabled, DEFAULT_INTEGRATION_SETTINGS.etsyEnabled),
    rakutenEnabled: normalizeBoolean(config.rakuten_enabled, DEFAULT_INTEGRATION_SETTINGS.rakutenEnabled),
    allegroEnabled: normalizeBoolean(config.allegro_enabled, DEFAULT_INTEGRATION_SETTINGS.allegroEnabled),
    cdiscountEnabled: normalizeBoolean(config.cdiscount_enabled, DEFAULT_INTEGRATION_SETTINGS.cdiscountEnabled),
    emagEnabled: normalizeBoolean(config.emag_enabled, DEFAULT_INTEGRATION_SETTINGS.emagEnabled),
    ottoEnabled: normalizeBoolean(config.otto_enabled, DEFAULT_INTEGRATION_SETTINGS.ottoEnabled),
    zalandoEnabled: normalizeBoolean(config.zalando_enabled, DEFAULT_INTEGRATION_SETTINGS.zalandoEnabled),
    woocommerceEnabled: normalizeBoolean(config.woocommerce_enabled, DEFAULT_INTEGRATION_SETTINGS.woocommerceEnabled),
    tiktokEnabled: normalizeBoolean(config.tiktok_enabled, DEFAULT_INTEGRATION_SETTINGS.tiktokEnabled),
    metaAdsEnabled: normalizeBoolean(config.meta_ads_enabled, DEFAULT_INTEGRATION_SETTINGS.metaAdsEnabled),
    shopifyStoreDomain: normalizeString(config.shopify_store_domain, DEFAULT_INTEGRATION_SETTINGS.shopifyStoreDomain),
    amazonMarketplaceId: normalizeString(config.amazon_marketplace_id, DEFAULT_INTEGRATION_SETTINGS.amazonMarketplaceId),
    ebaySiteId: normalizeString(config.ebay_site_id, DEFAULT_INTEGRATION_SETTINGS.ebaySiteId),
    woocommerceStoreUrl: normalizeString(config.woocommerce_store_url, DEFAULT_INTEGRATION_SETTINGS.woocommerceStoreUrl),
    alibabaRegion: normalizeString(config.alibaba_region, DEFAULT_INTEGRATION_SETTINGS.alibabaRegion),
    allegroRegion: normalizeString(config.allegro_region, DEFAULT_INTEGRATION_SETTINGS.allegroRegion),
    tiktokAdAccountId: normalizeString(config.tiktok_ad_account_id, DEFAULT_INTEGRATION_SETTINGS.tiktokAdAccountId),
    metaBusinessId: normalizeString(config.meta_business_id, DEFAULT_INTEGRATION_SETTINGS.metaBusinessId),
    syncInventory: normalizeBoolean(config.sync_inventory, DEFAULT_INTEGRATION_SETTINGS.syncInventory),
    syncOrders: normalizeBoolean(config.sync_orders, DEFAULT_INTEGRATION_SETTINGS.syncOrders),
    syncPricing: normalizeBoolean(config.sync_pricing, DEFAULT_INTEGRATION_SETTINGS.syncPricing),
    syncListings: normalizeBoolean(config.sync_listings, DEFAULT_INTEGRATION_SETTINGS.syncListings),
    syncReturns: normalizeBoolean(config.sync_returns, DEFAULT_INTEGRATION_SETTINGS.syncReturns),
    syncTraffic: normalizeBoolean(config.sync_traffic, DEFAULT_INTEGRATION_SETTINGS.syncTraffic),
    dryRunMode: normalizeBoolean(config.dry_run_mode, DEFAULT_INTEGRATION_SETTINGS.dryRunMode),
    requireManualApproval: normalizeBoolean(config.require_manual_approval, DEFAULT_INTEGRATION_SETTINGS.requireManualApproval),
    autoPublishDisabled: normalizeBoolean(config.auto_publish_disabled, DEFAULT_INTEGRATION_SETTINGS.autoPublishDisabled),
    maxSyncPriceChangePercent: normalizeNumber(config.max_sync_price_change_percent, DEFAULT_INTEGRATION_SETTINGS.maxSyncPriceChangePercent),
    minimumStockBufferUnits: normalizeNumber(config.minimum_stock_buffer_units, DEFAULT_INTEGRATION_SETTINGS.minimumStockBufferUnits),
    maxListingsPerHour: normalizeNumber(config.max_listings_per_hour, DEFAULT_INTEGRATION_SETTINGS.maxListingsPerHour),
    connectionChecks: normalizeConnectionChecks(config.connection_checks),
  };
}
