import { allegroAdapter } from '@/lib/marketplace-adapters/allegro';
import { ebayAdapter } from '@/lib/marketplace-adapters/ebay';
import type { MarketplaceAdapterOffer, MarketplaceSearchParams } from '@/lib/marketplace-adapters/types';

export async function searchMarketplaceOffers(params: MarketplaceSearchParams & { enabledLanes?: string[] }) {
  const lanes = new Set((params.enabledLanes || []).map((item) => item.toLowerCase()));
  const jobs: Array<Promise<MarketplaceAdapterOffer[]>> = [];

  if (lanes.has('ebay') && ebayAdapter.isConfigured()) {
    jobs.push(ebayAdapter.searchOffers(params));
  }
  if (lanes.has('allegro') && allegroAdapter.isConfigured()) {
    jobs.push(allegroAdapter.searchOffers(params));
  }

  if (!jobs.length) return [] as MarketplaceAdapterOffer[];
  const settled = await Promise.allSettled(jobs);
  return settled.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
}