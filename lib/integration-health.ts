export type IntegrationCheckState = 'validated' | 'invalid' | 'unavailable' | 'not_configured';

export type IntegrationConnectionCheck = {
  state: IntegrationCheckState;
  message: string;
  checkedAt: string | null;
  evidence: string | null;
};

export type IntegrationConnectionChecks = {
  shopify: IntegrationConnectionCheck;
  woocommerce: IntegrationConnectionCheck;
  tiktok: IntegrationConnectionCheck;
  meta: IntegrationConnectionCheck;
};

export type IntegrationTestTarget = 'shopify' | 'woocommerce' | 'social' | 'all';

type ConnectionInputs = {
  shopifyStoreDomain: string;
  woocommerceStoreUrl: string;
  tiktokAdAccountId: string;
  metaBusinessId: string;
};

function buildCheck(state: IntegrationCheckState, message: string, evidence: string | null = null): IntegrationConnectionCheck {
  return {
    state,
    message,
    checkedAt: state === 'not_configured' ? null : new Date().toISOString(),
    evidence,
  };
}

function messageFromStatus(params: {
  status: number;
  invalidToken: string;
  missingPermission: string;
  notFound: string;
  fallback: string;
}) {
  if (params.status === 401) return params.invalidToken;
  if (params.status === 403) return params.missingPermission;
  if (params.status === 404) return params.notFound;
  return params.fallback;
}

export function createDefaultConnectionChecks(): IntegrationConnectionChecks {
  return {
    shopify: buildCheck('not_configured', 'Nie skonfigurowano jeszcze sklepu Shopify.'),
    woocommerce: buildCheck('not_configured', 'Nie skonfigurowano jeszcze sklepu WooCommerce.'),
    tiktok: buildCheck('not_configured', 'Nie skonfigurowano jeszcze konta TikTok.'),
    meta: buildCheck('not_configured', 'Nie skonfigurowano jeszcze firmy Meta.'),
  };
}

function withTimeout(ms: number) {
  return typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
    ? AbortSignal.timeout(ms)
    : undefined;
}

function normalizeHostname(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const candidate = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    return parsed.hostname;
  } catch {
    return '';
  }
}

function normalizeStoreUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const candidate = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    const pathname = parsed.pathname.replace(/\/$/, '');
    return `${parsed.origin}${pathname}`;
  } catch {
    return '';
  }
}

async function validateShopify(shopifyStoreDomain: string): Promise<IntegrationConnectionCheck> {
  const hostname = normalizeHostname(shopifyStoreDomain);
  if (!hostname) return buildCheck('not_configured', 'Dodaj domenę Shopify przed uruchomieniem walidacji.');

  try {
    const productUrl = `https://${hostname}/products.json?limit=1`;
    const productRes = await fetch(productUrl, {
      cache: 'no-store',
      redirect: 'follow',
      signal: withTimeout(5000),
      headers: { Accept: 'application/json' },
    });

    if (productRes.ok) {
      const payload = await productRes.json().catch(() => null) as { products?: unknown[] } | null;
      if (Array.isArray(payload?.products)) {
        return buildCheck('validated', 'Storefront Shopify odpowiedział poprawnie.', hostname);
      }
    }

    const pageRes = await fetch(`https://${hostname}`, {
      cache: 'no-store',
      redirect: 'follow',
      signal: withTimeout(5000),
    });

    if (!pageRes.ok) {
      return buildCheck('invalid', `Storefront Shopify zwrócił status ${pageRes.status}.`, hostname);
    }

    const html = await pageRes.text();
    if (/cdn\.shopify\.com|Shopify\./i.test(html)) {
      return buildCheck('validated', 'Storefront Shopify odpowiedział poprawnie.', hostname);
    }

    return buildCheck('invalid', 'Podana domena odpowiedziała, ale nie wygląda na storefront Shopify.', hostname);
  } catch (error) {
    return buildCheck('invalid', `Walidacja Shopify nie powiodła się: ${error instanceof Error ? error.message : 'nieznany błąd'}.`, hostname || null);
  }
}

async function validateWooCommerce(woocommerceStoreUrl: string): Promise<IntegrationConnectionCheck> {
  const normalizedUrl = normalizeStoreUrl(woocommerceStoreUrl);
  if (!normalizedUrl) return buildCheck('not_configured', 'Dodaj URL sklepu WooCommerce przed uruchomieniem walidacji.');

  try {
    const storeApiUrl = `${normalizedUrl}/wp-json/wc/store/products?per_page=1`;
    const storeApiRes = await fetch(storeApiUrl, {
      cache: 'no-store',
      redirect: 'follow',
      signal: withTimeout(5000),
      headers: { Accept: 'application/json' },
    });

    if (storeApiRes.ok) {
      const payload = await storeApiRes.json().catch(() => null);
      if (Array.isArray(payload) || typeof payload === 'object') {
        return buildCheck('validated', 'API sklepu WooCommerce odpowiedziało poprawnie.', normalizedUrl);
      }
    }

    const wpJsonRes = await fetch(`${normalizedUrl}/wp-json`, {
      cache: 'no-store',
      redirect: 'follow',
      signal: withTimeout(5000),
      headers: { Accept: 'application/json' },
    });

    if (!wpJsonRes.ok) {
      return buildCheck('invalid', `Endpoint WooCommerce zwrócił status ${wpJsonRes.status}.`, normalizedUrl);
    }

    const payload = await wpJsonRes.json().catch(() => null) as { namespaces?: string[] } | null;
    if (Array.isArray(payload?.namespaces) && payload.namespaces.some((namespace) => /^wc\//.test(namespace) || namespace === 'wc/store')) {
      return buildCheck('validated', 'Endpointy REST WooCommerce odpowiedziały poprawnie.', normalizedUrl);
    }

    return buildCheck('invalid', 'Podany URL odpowiedział, ale nie wykryto przestrzeni nazw REST WooCommerce.', normalizedUrl);
  } catch (error) {
    return buildCheck('invalid', `Walidacja WooCommerce nie powiodła się: ${error instanceof Error ? error.message : 'nieznany błąd'}.`, normalizedUrl || null);
  }
}

async function validateTikTok(tiktokAdAccountId: string): Promise<IntegrationConnectionCheck> {
  const accountId = tiktokAdAccountId.trim();
  if (!accountId) return buildCheck('not_configured', 'Add a TikTok ads account ID before validation.');
  if (!/^\d{6,20}$/.test(accountId)) return buildCheck('invalid', 'TikTok ads account ID format looks invalid.', accountId);

  const token = process.env.TIKTOK_ACCESS_TOKEN?.trim();
  if (!token) return buildCheck('unavailable', 'Add TIKTOK_ACCESS_TOKEN in the server environment to run a real TikTok API validation.', accountId);

  try {
    const url = `https://business-api.tiktok.com/open_api/v1.3/advertiser/info/?advertiser_ids=%5B%22${accountId}%22%5D`;
    const res = await fetch(url, {
      cache: 'no-store',
      signal: withTimeout(5000),
      headers: {
        Accept: 'application/json',
        'Access-Token': token,
      },
    });
    const payload = await res.json().catch(() => null) as { data?: { list?: Array<{ advertiser_id?: string | number }> }; message?: string; code?: number } | null;
    const found = payload?.data?.list?.some((item) => String(item?.advertiser_id || '') === accountId);

    if (res.ok && found) return buildCheck('validated', 'TikTok ads account validated through API.', accountId);

    const invalidTokenCodes = new Set([40100, 40101, 40014]);
    const permissionCodes = new Set([40102, 40300, 40301]);
    const notFoundCodes = new Set([40400, 400404]);

    if (payload?.code && invalidTokenCodes.has(payload.code)) {
      return buildCheck('invalid', 'TikTok token is invalid or expired. Replace TIKTOK_ACCESS_TOKEN and test again.', accountId);
    }
    if (payload?.code && permissionCodes.has(payload.code)) {
      return buildCheck('invalid', 'TikTok token is valid, but it does not have permission for this advertiser account.', accountId);
    }
    if (payload?.code && notFoundCodes.has(payload.code)) {
      return buildCheck('invalid', 'TikTok advertiser account was not found for this token.', accountId);
    }

    return buildCheck('invalid', messageFromStatus({
      status: res.status,
      invalidToken: 'TikTok token is invalid or expired. Replace TIKTOK_ACCESS_TOKEN and test again.',
      missingPermission: 'TikTok token is valid, but it does not have permission for this advertiser account.',
      notFound: 'TikTok advertiser account was not found.',
      fallback: payload?.message || 'TikTok API did not confirm this ads account.',
    }), accountId);
  } catch (error) {
    return buildCheck('invalid', `TikTok validation failed: ${error instanceof Error ? error.message : 'unknown error'}.`, accountId);
  }
}

async function validateMeta(metaBusinessId: string): Promise<IntegrationConnectionCheck> {
  const businessId = metaBusinessId.trim();
  if (!businessId) return buildCheck('not_configured', 'Add a Meta business or ad account ID before validation.');
  if (!/^(act_)?\d{5,20}$/.test(businessId)) return buildCheck('invalid', 'Meta business/account ID format looks invalid.', businessId);

  const token = process.env.META_ACCESS_TOKEN?.trim();
  if (!token) return buildCheck('unavailable', 'Add META_ACCESS_TOKEN in the server environment to run a real Meta Graph validation.', businessId);

  try {
    const url = `https://graph.facebook.com/v19.0/${businessId}?fields=id,name&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url, {
      cache: 'no-store',
      signal: withTimeout(5000),
      headers: { Accept: 'application/json' },
    });
    const payload = await res.json().catch(() => null) as { id?: string; name?: string; error?: { message?: string; code?: number } } | null;

    if (res.ok && payload?.id) return buildCheck('validated', 'Meta business/account validated through Graph API.', payload.name || businessId);

    if (payload?.error?.code === 190) {
      return buildCheck('invalid', 'Meta token is invalid or expired. Replace META_ACCESS_TOKEN and test again.', businessId);
    }
    if (payload?.error?.code === 10 || payload?.error?.code === 200 || payload?.error?.code === 294) {
      return buildCheck('invalid', 'Meta token is valid, but it does not have permission for this business or ad account.', businessId);
    }
    if (payload?.error?.code === 100) {
      return buildCheck('invalid', 'Meta business or ad account was not found.', businessId);
    }

    return buildCheck('invalid', messageFromStatus({
      status: res.status,
      invalidToken: 'Meta token is invalid or expired. Replace META_ACCESS_TOKEN and test again.',
      missingPermission: 'Meta token is valid, but it does not have permission for this business or ad account.',
      notFound: 'Meta business or ad account was not found.',
      fallback: payload?.error?.message || 'Meta Graph API did not confirm this business/account.',
    }), businessId);
  } catch (error) {
    return buildCheck('invalid', `Meta validation failed: ${error instanceof Error ? error.message : 'unknown error'}.`, businessId);
  }
}

export async function validateIntegrationConnections(inputs: ConnectionInputs): Promise<IntegrationConnectionChecks> {
  const [shopify, woocommerce, tiktok, meta] = await Promise.all([
    validateShopify(inputs.shopifyStoreDomain),
    validateWooCommerce(inputs.woocommerceStoreUrl),
    validateTikTok(inputs.tiktokAdAccountId),
    validateMeta(inputs.metaBusinessId),
  ]);

  return { shopify, woocommerce, tiktok, meta };
}

export function mergeConnectionChecks(params: {
  current: IntegrationConnectionChecks;
  next: IntegrationConnectionChecks;
  target: IntegrationTestTarget;
}) {
  if (params.target === 'all') return params.next;

  return {
    shopify: params.target === 'shopify' ? params.next.shopify : params.current.shopify,
    woocommerce: params.target === 'woocommerce' ? params.next.woocommerce : params.current.woocommerce,
    tiktok: params.target === 'social' ? params.next.tiktok : params.current.tiktok,
    meta: params.target === 'social' ? params.next.meta : params.current.meta,
  };
}