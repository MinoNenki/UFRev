import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/marketplace-adapters', () => ({
  searchMarketplaceOffers: vi.fn(),
}));

import { buildProductSourcingLayer, buildServiceSetupLayer } from '@/lib/recommendation-layers';
import { searchMarketplaceOffers } from '@/lib/marketplace-adapters';

describe('recommendation layers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds a sourcing shortlist from main offer, competitors, and research urls', async () => {
    vi.mocked(searchMarketplaceOffers).mockResolvedValueOnce([
      {
        provider: 'ebay',
        externalId: 'ebay-1',
        title: 'Connector Steam Cleaner',
        url: 'https://ebay.example/item-1',
        price: 89,
        currency: 'USD',
        reviewCount: 320,
        rating: 97,
        availability: 'in_stock',
        sellerName: 'Top Seller',
        sellerScore: 97,
        shippingNote: null,
        imageUrl: null,
        sourceConfidence: 'high',
      },
    ]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<html><title>Research Offer</title><div>$129.00</div><div>43 reviews</div></html>',
    } as Response));

    const layer = await buildProductSourcingLayer({
      productName: 'Steam cleaner',
      displayCurrency: 'PLN',
      enabledIntegrationLanes: ['Amazon', 'eBay'],
      currentLanguage: 'pl',
      marketData: {
        product: {
          url: 'https://example.com/main-offer',
          title: 'Main Offer',
          price: 99,
          priceUsd: 99,
          currency: 'USD',
          reviewCount: 120,
          availability: 'in_stock',
          platform: 'other',
          source: 'public_page',
        },
        competitors: [
          {
            url: 'https://example.com/competitor-1',
            title: 'Competitor One',
            price: 119,
            priceUsd: 119,
            currency: 'USD',
            reviewCount: 80,
            availability: 'in_stock',
            platform: 'amazon',
            source: 'public_page',
          },
        ],
        competitorAvgPrice: 119,
        competitorAvgPriceUsd: 119,
        marketMonthlyUnitsEstimate: 250,
        demandScore: 64,
        competitionScore: 58,
        resaleSignalCount: 3,
        rentalSignalCount: 0,
        researchQuery: 'steam cleaner',
        resaleResearchUrls: ['https://example.com/research-1'],
        rentalResearchUrls: [],
        sourceNotes: [],
      },
    });

    expect(layer.recommendedOffers.length).toBeGreaterThanOrEqual(3);
    expect(layer.recommendedOffers[0].url).toBeTruthy();
    expect(layer.recommendedOffers[0].sourceType).toBe('connector');
    expect(layer.recommendedOffers[0].risk).toBe('low');
    expect(layer.notes.join(' ')).toMatch(/Amazon|eBay/);
    expect(searchMarketplaceOffers).toHaveBeenCalledWith(expect.objectContaining({
      query: 'Steam cleaner',
      country: 'PL',
    }));
  });

  it('builds a service setup plan with equipment, capex, and packages', () => {
    const layer = buildServiceSetupLayer({
      content: 'Chcę otworzyć mobilną myjnię parową i sprawdzić też mycie elewacji.',
      competitorUrls: 'https://example.com/a https://example.com/b',
      displayCurrency: 'PLN',
      selectedCountry: 'PL',
      currentLanguage: 'pl',
      marketData: {
        product: null,
        competitors: [],
        competitorAvgPrice: null,
        competitorAvgPriceUsd: null,
        marketMonthlyUnitsEstimate: null,
        demandScore: 52,
        competitionScore: 48,
        resaleSignalCount: 2,
        rentalSignalCount: 2,
        researchQuery: 'myjnia parowa',
        resaleResearchUrls: ['https://example.com/offer'],
        rentalResearchUrls: ['https://example.com/service'],
        sourceNotes: [],
      },
    });

    expect(layer.primaryLane).toMatch(/Mobilna|mobile/i);
    expect(layer.equipment.length).toBeGreaterThan(2);
    expect(layer.capexBuckets.length).toBeGreaterThan(2);
    expect(layer.pricePackages.length).toBeGreaterThan(2);
    expect(layer.benchmarkLinks.length).toBeGreaterThan(1);
  });
});