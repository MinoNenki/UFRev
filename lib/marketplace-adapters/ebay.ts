import { env } from '@/lib/env';
import type { MarketplaceAdapter, MarketplaceAdapterOffer, MarketplaceSearchParams } from '@/lib/marketplace-adapters/types';

const EBAY_OAUTH_URL = 'https://api.ebay.com/identity/v1/oauth2/token';
const EBAY_BROWSE_URL = 'https://api.ebay.com/buy/browse/v1/item_summary/search';

function getEbayBaseUrl() {
  return env.ebayEnvironment === 'sandbox'
    ? {
        oauthUrl: 'https://api.sandbox.ebay.com/identity/v1/oauth2/token',
        browseUrl: 'https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search',
      }
    : {
        oauthUrl: EBAY_OAUTH_URL,
        browseUrl: EBAY_BROWSE_URL,
      };
}

function mapCountryToMarketplace(country: string) {
  const normalized = String(country || '').toUpperCase();
  if (normalized === 'PL') return 'EBAY_PL';
  if (normalized === 'DE') return 'EBAY_DE';
  if (normalized === 'GB' || normalized === 'UK') return 'EBAY_GB';
  return env.ebaySiteId || 'EBAY_US';
}

async function fetchEbayAccessToken() {
  const appId = env.ebayAppId;
  const certId = env.ebayCertId;
  if (!appId || !certId) return null;

  const credentials = Buffer.from(`${appId}:${certId}`).toString('base64');
  const urls = getEbayBaseUrl();
  const response = await fetch(urls.oauthUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'https://api.ebay.com/oauth/api_scope',
    }),
    cache: 'no-store',
  });

  if (!response.ok) return null;
  const payload = await response.json() as { access_token?: string };
  return payload.access_token || null;
}

export const ebayAdapter: MarketplaceAdapter = {
  isConfigured() {
    return Boolean(env.ebayAppId && env.ebayCertId);
  },

  async searchOffers(params: MarketplaceSearchParams): Promise<MarketplaceAdapterOffer[]> {
    if (!this.isConfigured()) return [];
    const token = await fetchEbayAccessToken().catch(() => null);
    if (!token) return [];

    const urls = getEbayBaseUrl();
    const limit = Math.min(Math.max(params.maxResults || 5, 1), 8);
    const marketplaceId = mapCountryToMarketplace(params.country);
    const query = params.query.trim();
    if (!query) return [];

    const response = await fetch(`${urls.browseUrl}?q=${encodeURIComponent(query)}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'X-EBAY-C-MARKETPLACE-ID': marketplaceId,
      },
      cache: 'no-store',
    }).catch(() => null);

    if (!response?.ok) return [];
    const payload = await response.json() as { itemSummaries?: Array<any> };
    const items = Array.isArray(payload.itemSummaries) ? payload.itemSummaries : [];

    return items
      .map((item) => ({
        provider: 'ebay' as const,
        externalId: String(item.itemId || item.legacyItemId || ''),
        title: String(item.title || '').trim(),
        url: String(item.itemWebUrl || '').trim(),
        price: Number(item.price?.value || 0) || null,
        currency: String(item.price?.currency || '').trim() || null,
        reviewCount: Number(item.seller?.feedbackPercentage || 0) ? null : null,
        rating: Number(item.seller?.feedbackPercentage || 0) || null,
        availability: String(item.availability || item.itemEndDate || '').trim() || null,
        sellerName: String(item.seller?.username || '').trim() || null,
        sellerScore: Number(item.seller?.feedbackScore || 0) || null,
        shippingNote: String(item.shippingOptions?.[0]?.shippingCostType || '').trim() || null,
        imageUrl: String(item.image?.imageUrl || '').trim() || null,
        sourceConfidence: item.price?.value && item.itemWebUrl ? 'high' as const : 'medium' as const,
        rawJson: item,
      }))
      .filter((item) => item.externalId && item.title && item.url)
      .slice(0, limit);
  },
};