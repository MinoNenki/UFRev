import { env } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase-admin';

export type AdProviderRow = {
  id: string;
  provider_type: string;
  provider_name: string;
  enabled: boolean;
  config_json?: Record<string, unknown> | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

type GoogleAdSenseConfig = {
  publisherId?: string;
  clientId?: string;
  displaySlotId?: string;
  autoAdsEnabled?: boolean;
  managementAccessToken?: string;
  sync?: Record<string, unknown>;
};

type GoogleAdsConfig = {
  customerId?: string;
  loginCustomerId?: string;
  developerToken?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  sync?: Record<string, unknown>;
};

export type ProviderSyncResult = {
  ok: boolean;
  state: 'connected' | 'configured' | 'incomplete' | 'error';
  message: string;
  checkedAt: string;
  capabilities: {
    display: boolean;
    rewarded: boolean;
    managementApi: boolean;
  };
  metadata?: Record<string, unknown>;
  warnings?: string[];
};

const DEFAULT_AD_PROVIDERS = [
  { provider_type: 'google_adsense', provider_name: 'Google AdSense', description: 'Google publisher monetization and display inventory' },
  { provider_type: 'google_ads', provider_name: 'Google Ads', description: 'Google ads account sync and campaign visibility' },
  { provider_type: 'taboola', provider_name: 'Taboola', description: 'Content discovery and monetization platform' },
  { provider_type: 'propeller_ads', provider_name: 'PropellerAds', description: 'Native ads and banner ad network' },
  { provider_type: 'adproof', provider_name: 'AdProof', description: 'Performance marketing network' },
  { provider_type: 'infolinks', provider_name: 'Infolinks', description: 'In-text and display advertising' },
  { provider_type: 'smarketingads', provider_name: 'S-Marketing Ads', description: 'Polish ad network' },
] as const;

function asObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asBoolean(value: unknown) {
  return value === true || value === 'true' || value === 'on';
}

function withMaskedSecret(secret: string) {
  if (!secret) return '';
  return secret.length <= 8 ? '********' : `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

export async function ensureDefaultAdProviders() {
  await supabaseAdmin.from('ad_providers_config').upsert(
    DEFAULT_AD_PROVIDERS.map((provider) => ({
      provider_type: provider.provider_type,
      provider_name: provider.provider_name,
      description: provider.description,
    })),
    { onConflict: 'provider_type' }
  );
}

export function sanitizeProviderConfig(providerType: string, rawConfig: unknown) {
  const config = asObject(rawConfig);

  if (providerType === 'google_adsense') {
    const currentSync = asObject(config.sync);
    return {
      publisherId: asString(config.publisherId),
      clientId: asString(config.clientId),
      displaySlotId: asString(config.displaySlotId),
      autoAdsEnabled: asBoolean(config.autoAdsEnabled),
      managementAccessToken: asString(config.managementAccessToken),
      sync: currentSync,
    } satisfies GoogleAdSenseConfig;
  }

  if (providerType === 'google_ads') {
    const currentSync = asObject(config.sync);
    return {
      customerId: asString(config.customerId),
      loginCustomerId: asString(config.loginCustomerId),
      developerToken: asString(config.developerToken),
      clientId: asString(config.clientId),
      clientSecret: asString(config.clientSecret),
      refreshToken: asString(config.refreshToken),
      sync: currentSync,
    } satisfies GoogleAdsConfig;
  }

  return {
    ...config,
    sync: asObject(config.sync),
  };
}

function mergeGoogleAdSenseConfig(rawConfig: unknown): GoogleAdSenseConfig {
  const config = sanitizeProviderConfig('google_adsense', rawConfig) as GoogleAdSenseConfig;
  return {
    publisherId: config.publisherId || env.adsensePublisherId,
    clientId: config.clientId || env.adsenseClientId,
    displaySlotId: config.displaySlotId || env.adsenseDisplaySlotId,
    autoAdsEnabled: Boolean(config.autoAdsEnabled),
    managementAccessToken: config.managementAccessToken || env.adsenseManagementAccessToken,
    sync: config.sync,
  };
}

function mergeGoogleAdsConfig(rawConfig: unknown): GoogleAdsConfig {
  const config = sanitizeProviderConfig('google_ads', rawConfig) as GoogleAdsConfig;
  return {
    customerId: config.customerId || env.googleAdsCustomerId,
    loginCustomerId: config.loginCustomerId || env.googleAdsLoginCustomerId,
    developerToken: config.developerToken || env.googleAdsDeveloperToken,
    clientId: config.clientId || env.googleAdsClientId,
    clientSecret: config.clientSecret || env.googleAdsClientSecret,
    refreshToken: config.refreshToken || env.googleAdsRefreshToken,
    sync: config.sync,
  };
}

async function syncGoogleAdSense(rawConfig: unknown): Promise<ProviderSyncResult> {
  const checkedAt = new Date().toISOString();
  const config = mergeGoogleAdSenseConfig(rawConfig);
  const displayReady = Boolean(config.clientId && config.displaySlotId);
  const warnings: string[] = [];

  if (!config.publisherId) warnings.push('Missing publisher ID.');
  if (!config.clientId) warnings.push('Missing AdSense client ID.');
  if (!config.displaySlotId) warnings.push('Missing display slot ID.');

  if (!config.managementAccessToken) {
    return {
      ok: displayReady,
      state: displayReady ? 'configured' : 'incomplete',
      message: displayReady
        ? 'Display inventory is configured. Add a management access token to verify against the AdSense API.'
        : 'AdSense is missing required display configuration.',
      checkedAt,
      capabilities: {
        display: displayReady,
        rewarded: false,
        managementApi: false,
      },
      metadata: {
        publisherId: config.publisherId || '',
        clientId: config.clientId || '',
        displaySlotId: config.displaySlotId || '',
        autoAdsEnabled: Boolean(config.autoAdsEnabled),
        tokenPreview: withMaskedSecret(config.managementAccessToken || ''),
      },
      warnings,
    };
  }

  const response = await fetch('https://adsense.googleapis.com/v2/accounts', {
    headers: {
      Authorization: `Bearer ${config.managementAccessToken}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text();
    return {
      ok: false,
      state: displayReady ? 'configured' : 'error',
      message: `AdSense API rejected the sync request (${response.status}).`,
      checkedAt,
      capabilities: {
        display: displayReady,
        rewarded: false,
        managementApi: true,
      },
      metadata: {
        providerError: body.slice(0, 500),
        publisherId: config.publisherId || '',
        clientId: config.clientId || '',
        displaySlotId: config.displaySlotId || '',
      },
      warnings,
    };
  }

  const payload = (await response.json()) as { accounts?: Array<{ name?: string; displayName?: string; state?: string; timeZone?: string }> };
  const accounts = payload.accounts || [];

  return {
    ok: displayReady && accounts.length > 0,
    state: displayReady && accounts.length > 0 ? 'connected' : displayReady ? 'configured' : 'incomplete',
    message: accounts.length > 0
      ? `AdSense API sync succeeded. ${accounts.length} account(s) detected.`
      : 'AdSense display config saved, but the API returned no accounts.',
    checkedAt,
    capabilities: {
      display: displayReady,
      rewarded: false,
      managementApi: true,
    },
    metadata: {
      accountCount: accounts.length,
      firstAccount: accounts[0]?.displayName || accounts[0]?.name || '',
      accountState: accounts[0]?.state || '',
      timeZone: accounts[0]?.timeZone || '',
      publisherId: config.publisherId || '',
      clientId: config.clientId || '',
      displaySlotId: config.displaySlotId || '',
      autoAdsEnabled: Boolean(config.autoAdsEnabled),
      tokenPreview: withMaskedSecret(config.managementAccessToken || ''),
    },
    warnings,
  };
}

async function getGoogleAdsAccessToken(config: GoogleAdsConfig) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId || '',
      client_secret: config.clientSecret || '',
      refresh_token: config.refreshToken || '',
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`OAuth token exchange failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error('OAuth token exchange did not return an access token.');
  }

  return payload.access_token;
}

async function syncGoogleAds(rawConfig: unknown): Promise<ProviderSyncResult> {
  const checkedAt = new Date().toISOString();
  const config = mergeGoogleAdsConfig(rawConfig);
  const warnings: string[] = [];

  if (!config.customerId) warnings.push('Missing Google Ads customer ID.');
  if (!config.developerToken) warnings.push('Missing developer token.');
  if (!config.clientId) warnings.push('Missing OAuth client ID.');
  if (!config.clientSecret) warnings.push('Missing OAuth client secret.');
  if (!config.refreshToken) warnings.push('Missing refresh token.');

  if (!config.customerId || !config.developerToken || !config.clientId || !config.clientSecret || !config.refreshToken) {
    return {
      ok: false,
      state: 'incomplete',
      message: 'Google Ads sync is not ready yet. Fill in the account and OAuth credentials first.',
      checkedAt,
      capabilities: {
        display: false,
        rewarded: false,
        managementApi: true,
      },
      metadata: {
        customerId: config.customerId || '',
        loginCustomerId: config.loginCustomerId || '',
        developerTokenPreview: withMaskedSecret(config.developerToken || ''),
        refreshTokenPreview: withMaskedSecret(config.refreshToken || ''),
      },
      warnings,
    };
  }

  try {
    const accessToken = await getGoogleAdsAccessToken(config);
    const response = await fetch('https://googleads.googleapis.com/v18/customers:listAccessibleCustomers', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': config.developerToken,
        ...(config.loginCustomerId ? { 'login-customer-id': config.loginCustomerId.replace(/-/g, '') } : {}),
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        ok: false,
        state: 'error',
        message: `Google Ads API rejected the sync request (${response.status}).`,
        checkedAt,
        capabilities: {
          display: false,
          rewarded: false,
          managementApi: true,
        },
        metadata: {
          providerError: body.slice(0, 500),
          customerId: config.customerId,
          loginCustomerId: config.loginCustomerId || '',
          developerTokenPreview: withMaskedSecret(config.developerToken || ''),
        },
        warnings,
      };
    }

    const payload = (await response.json()) as { resourceNames?: string[] };
    const accessibleCustomers = payload.resourceNames || [];
    const normalizedCustomerId = config.customerId.replace(/-/g, '');
    const matched = accessibleCustomers.some((item) => item.replace(/\D/g, '').endsWith(normalizedCustomerId));

    return {
      ok: matched || accessibleCustomers.length > 0,
      state: matched ? 'connected' : accessibleCustomers.length > 0 ? 'configured' : 'error',
      message: matched
        ? 'Google Ads sync succeeded and the configured customer is accessible.'
        : accessibleCustomers.length > 0
          ? 'Google Ads OAuth works, but the configured customer ID was not found in accessible accounts.'
          : 'Google Ads OAuth succeeded but no accessible customers were returned.',
      checkedAt,
      capabilities: {
        display: false,
        rewarded: false,
        managementApi: true,
      },
      metadata: {
        accessibleCustomers,
        accessibleCustomerCount: accessibleCustomers.length,
        matchedCustomer: matched,
        customerId: config.customerId,
        loginCustomerId: config.loginCustomerId || '',
        developerTokenPreview: withMaskedSecret(config.developerToken || ''),
        refreshTokenPreview: withMaskedSecret(config.refreshToken || ''),
      },
      warnings,
    };
  } catch (error) {
    return {
      ok: false,
      state: 'error',
      message: error instanceof Error ? error.message : 'Google Ads sync failed.',
      checkedAt,
      capabilities: {
        display: false,
        rewarded: false,
        managementApi: true,
      },
      metadata: {
        customerId: config.customerId || '',
        loginCustomerId: config.loginCustomerId || '',
        developerTokenPreview: withMaskedSecret(config.developerToken || ''),
      },
      warnings,
    };
  }
}

export async function syncProvider(provider: AdProviderRow): Promise<ProviderSyncResult> {
  if (provider.provider_type === 'google_adsense') {
    return syncGoogleAdSense(provider.config_json);
  }

  if (provider.provider_type === 'google_ads') {
    return syncGoogleAds(provider.config_json);
  }

  return {
    ok: Boolean(provider.enabled),
    state: provider.enabled ? 'configured' : 'incomplete',
    message: provider.enabled
      ? 'Provider enabled. Live sync is not implemented for this network yet.'
      : 'Provider is disabled.',
    checkedAt: new Date().toISOString(),
    capabilities: {
      display: false,
      rewarded: false,
      managementApi: false,
    },
  };
}

export function getPublicAdInventory(provider: AdProviderRow) {
  if (!provider.enabled) return null;

  if (provider.provider_type === 'google_adsense') {
    const config = mergeGoogleAdSenseConfig(provider.config_json);
    if (!config.clientId || !config.displaySlotId) return null;

    return {
      providerType: provider.provider_type,
      providerName: provider.provider_name,
      clientId: config.clientId,
      publisherId: config.publisherId || '',
      slotId: config.displaySlotId,
      autoAdsEnabled: Boolean(config.autoAdsEnabled),
      sync: asObject(config.sync),
    };
  }

  return null;
}

export function getRewardCapability(provider: AdProviderRow) {
  const config = asObject(provider.config_json);
  return provider.enabled && asBoolean(config.rewardedEnabled);
}

export function getProviderSummary(providers: AdProviderRow[]) {
  const enabledProviders = providers.filter((provider) => provider.enabled);
  const displayInventory = enabledProviders.map(getPublicAdInventory).find(Boolean) || null;
  const rewardProvider = enabledProviders.find((provider) => getRewardCapability(provider)) || null;

  return {
    enabledCount: enabledProviders.length,
    hasDisplayAds: Boolean(displayInventory),
    hasRewardAds: Boolean(rewardProvider),
    displayInventory,
    rewardProvider: rewardProvider ? {
      providerType: rewardProvider.provider_type,
      providerName: rewardProvider.provider_name,
    } : null,
  };
}

export function mergeProviderSyncIntoConfig(providerType: string, rawConfig: unknown, sync: ProviderSyncResult) {
  const base = sanitizeProviderConfig(providerType, rawConfig) as Record<string, unknown>;
  return {
    ...base,
    sync: {
      state: sync.state,
      ok: sync.ok,
      checkedAt: sync.checkedAt,
      message: sync.message,
      capabilities: sync.capabilities,
      metadata: sync.metadata || {},
      warnings: sync.warnings || [],
    },
  };
}