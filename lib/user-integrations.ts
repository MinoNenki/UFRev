import { supabaseAdmin } from '@/lib/supabase-admin';
import { type IntegrationConnectionCheck } from '@/lib/integration-health';

export type UserStoreConnectionChecks = {
  shopify: IntegrationConnectionCheck;
  woocommerce: IntegrationConnectionCheck;
};

export type UserIntegrationSettings = {
  shopifyEnabled: boolean;
  woocommerceEnabled: boolean;
  amazonEnabled: boolean;
  ebayEnabled: boolean;
  allegroEnabled: boolean;
  shopifyStoreDomain: string;
  woocommerceStoreUrl: string;
  syncInventory: boolean;
  syncOrders: boolean;
  syncPricing: boolean;
  connectionChecks: UserStoreConnectionChecks;
};

export const DEFAULT_USER_INTEGRATION_SETTINGS: UserIntegrationSettings = {
  shopifyEnabled: false,
  woocommerceEnabled: false,
  amazonEnabled: false,
  ebayEnabled: false,
  allegroEnabled: false,
  shopifyStoreDomain: '',
  woocommerceStoreUrl: '',
  syncInventory: true,
  syncOrders: true,
  syncPricing: true,
  connectionChecks: {
    shopify: {
      state: 'not_configured',
      message: 'No Shopify store configured yet.',
      checkedAt: null,
      evidence: null,
    },
    woocommerce: {
      state: 'not_configured',
      message: 'No WooCommerce store configured yet.',
      checkedAt: null,
      evidence: null,
    },
  },
};

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function normalizeConnectionCheck(value: unknown, fallback: IntegrationConnectionCheck): IntegrationConnectionCheck {
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

function normalizeConnectionChecks(value: unknown): UserStoreConnectionChecks {
  const fallback = DEFAULT_USER_INTEGRATION_SETTINGS.connectionChecks;
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};

  return {
    shopify: normalizeConnectionCheck(raw.shopify, fallback.shopify),
    woocommerce: normalizeConnectionCheck(raw.woocommerce, fallback.woocommerce),
  };
}

export async function getUserIntegrationSettings(userId: string): Promise<UserIntegrationSettings> {
  const { data } = await supabaseAdmin
    .from('user_integration_settings')
    .select('shopify_enabled, woocommerce_enabled, amazon_enabled, ebay_enabled, allegro_enabled, shopify_store_domain, woocommerce_store_url, sync_inventory, sync_orders, sync_pricing, connection_checks')
    .eq('user_id', userId)
    .maybeSingle();

  const config = (data || {}) as Record<string, unknown>;

  return {
    shopifyEnabled: normalizeBoolean(config.shopify_enabled, DEFAULT_USER_INTEGRATION_SETTINGS.shopifyEnabled),
    woocommerceEnabled: normalizeBoolean(config.woocommerce_enabled, DEFAULT_USER_INTEGRATION_SETTINGS.woocommerceEnabled),
    amazonEnabled: normalizeBoolean(config.amazon_enabled, DEFAULT_USER_INTEGRATION_SETTINGS.amazonEnabled),
    ebayEnabled: normalizeBoolean(config.ebay_enabled, DEFAULT_USER_INTEGRATION_SETTINGS.ebayEnabled),
    allegroEnabled: normalizeBoolean(config.allegro_enabled, DEFAULT_USER_INTEGRATION_SETTINGS.allegroEnabled),
    shopifyStoreDomain: normalizeString(config.shopify_store_domain, DEFAULT_USER_INTEGRATION_SETTINGS.shopifyStoreDomain),
    woocommerceStoreUrl: normalizeString(config.woocommerce_store_url, DEFAULT_USER_INTEGRATION_SETTINGS.woocommerceStoreUrl),
    syncInventory: normalizeBoolean(config.sync_inventory, DEFAULT_USER_INTEGRATION_SETTINGS.syncInventory),
    syncOrders: normalizeBoolean(config.sync_orders, DEFAULT_USER_INTEGRATION_SETTINGS.syncOrders),
    syncPricing: normalizeBoolean(config.sync_pricing, DEFAULT_USER_INTEGRATION_SETTINGS.syncPricing),
    connectionChecks: normalizeConnectionChecks(config.connection_checks),
  };
}