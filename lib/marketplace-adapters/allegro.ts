import { env } from '@/lib/env';
import type { MarketplaceAdapter, MarketplaceAdapterOffer, MarketplaceSearchParams } from '@/lib/marketplace-adapters/types';

const ALLEGRO_API_BASE = 'https://api.allegro.pl';
const ALLEGRO_AUTH_BASE = 'https://allegro.pl';

async function fetchAllegroAccessToken() {
  if (!env.allegroClientId || !env.allegroClientSecret) return null;
  const credentials = Buffer.from(`${env.allegroClientId}:${env.allegroClientSecret}`).toString('base64');
  const response = await fetch(`${ALLEGRO_AUTH_BASE}/auth/oauth/token?grant_type=client_credentials`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  }).catch(() => null);

  if (!response?.ok) return null;
  const payload = await response.json() as { access_token?: string };
  return payload.access_token || null;
}

export const allegroAdapter: MarketplaceAdapter = {
  isConfigured() {
    return Boolean(env.allegroClientId && env.allegroClientSecret);
  },

  async searchOffers(params: MarketplaceSearchParams): Promise<MarketplaceAdapterOffer[]> {
    if (!this.isConfigured()) return [];
    const token = await fetchAllegroAccessToken();
    if (!token) return [];

    const query = params.query.trim();
    const limit = Math.min(Math.max(params.maxResults || 5, 1), 8);
    if (!query) return [];

    const response = await fetch(`${ALLEGRO_API_BASE}/offers/listing?phrase=${encodeURIComponent(query)}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.allegro.public.v1+json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }).catch(() => null);

    if (!response?.ok) return [];
    const payload = await response.json() as { items?: { promoted?: Array<any>; regular?: Array<any> } };
    const items = [
      ...(payload.items?.promoted || []),
      ...(payload.items?.regular || []),
    ];

    return items
      .map((item) => ({
        provider: 'allegro' as const,
        externalId: String(item.id || ''),
        title: String(item.name || '').trim(),
        url: String(item.url || '').trim(),
        price: Number(item.sellingMode?.price?.amount || 0) || null,
        currency: String(item.sellingMode?.price?.currency || '').trim() || null,
        reviewCount: Number(item.seller?.positiveFeedbackCount || 0) || null,
        rating: Number(item.seller?.positiveFeedbackPercent || 0) || null,
        availability: String(item.stock?.available || item.publication?.status || '').trim() || null,
        sellerName: String(item.seller?.login || '').trim() || null,
        sellerScore: Number(item.seller?.positiveFeedbackPercent || 0) || null,
        shippingNote: String(item.delivery?.lowestPrice?.amount || '').trim() || null,
        imageUrl: String(item.images?.[0]?.url || '').trim() || null,
        sourceConfidence: item.url && item.sellingMode?.price?.amount ? 'high' as const : 'medium' as const,
        rawJson: item,
      }))
      .filter((item) => item.externalId && item.title && item.url)
      .slice(0, limit);
  },
};