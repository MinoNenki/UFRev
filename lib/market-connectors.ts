import { collectMarketData, type MarketDataSummary } from '@/lib/market-data';
import { convertToUsd, normalizeCurrencyCode } from '@/lib/currency';

export type ConnectorSignal = {
  provider: 'shopify_public_json' | 'shopify_admin' | 'public_page';
  note: string;
};

export type ProMarketDataSummary = MarketDataSummary & {
  connectorSignals: ConnectorSignal[];
};

function getEnv(name: string) {
  return process.env[name]?.trim() || '';
}

function extractShopifyHandle(url: string) {
  const match = url.match(/\/products\/([^/?#]+)/i);
  return match?.[1] || null;
}

async function fetchShopifyPublicProduct(url: string) {
  try {
    const parsed = new URL(url);
    const handle = extractShopifyHandle(url);
    if (!handle) return null;
    const jsonUrl = `${parsed.protocol}//${parsed.host}/products/${handle}.js`;
    const res = await fetch(jsonUrl, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const variantPrices = Array.isArray(data?.variants)
      ? data.variants.map((variant: any) => Number(variant?.price || 0) / 100).filter((value: number) => Number.isFinite(value) && value > 0)
      : [];
    const firstPrice = variantPrices.length ? Math.min(...variantPrices) : null;
    const currency = normalizeCurrencyCode(String(data?.currency || 'USD'), 'USD');
    return {
      title: typeof data?.title === 'string' ? data.title : null,
      price: firstPrice,
      priceUsd: firstPrice != null ? convertToUsd(firstPrice, currency) : null,
      currency,
      variants: Array.isArray(data?.variants) ? data.variants.length : null,
      provider: 'shopify_public_json' as const,
    };
  } catch {
    return null;
  }
}

export async function collectProMarketData(params: { websiteUrl?: string; competitorUrls?: string; queryText?: string; selectedCountry?: string; includeRentalResearch?: boolean }): Promise<ProMarketDataSummary> {
  const base = await collectMarketData(params);
  const connectorSignals: ConnectorSignal[] = [];

  const websiteUrl = params.websiteUrl?.trim() || '';
  if (websiteUrl.includes('/products/')) {
    const shopifyPublic = await fetchShopifyPublicProduct(websiteUrl);
    if (shopifyPublic?.priceUsd && (!base.product?.priceUsd || base.product.priceUsd <= 0)) {
      base.product = {
        url: websiteUrl,
        title: shopifyPublic.title,
        price: shopifyPublic.price,
        priceUsd: shopifyPublic.priceUsd,
        currency: shopifyPublic.currency,
        reviewCount: base.product?.reviewCount ?? null,
        availability: base.product?.availability ?? 'unknown',
        platform: 'shopify',
        source: 'public_page',
      };
      connectorSignals.push({ provider: 'shopify_public_json', note: 'Shopify public product JSON was used to enrich price data.' });
      base.sourceNotes = Array.from(new Set([...base.sourceNotes, `Shopify product JSON detected live price: ${shopifyPublic.price} ${shopifyPublic.currency}.`]));
    }
  }

  if (getEnv('SHOPIFY_ADMIN_ACCESS_TOKEN') && getEnv('SHOPIFY_STORE_DOMAIN')) {
    connectorSignals.push({ provider: 'shopify_admin', note: 'Shopify Admin connector is configured and ready for deeper inventory/order sync.' });
  }

  if (!connectorSignals.length) {
    connectorSignals.push({ provider: 'public_page', note: 'Only public-page market signals were available in this environment.' });
  }

  return { ...base, connectorSignals };
}
