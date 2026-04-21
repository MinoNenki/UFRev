import { describe, expect, it } from 'vitest';
import { buildMarketWatchReport } from '@/lib/market-watch';

describe('market watch report', () => {
  it('marks an opportunity when competitors are above market and one goes out of stock', () => {
    const report = buildMarketWatchReport({
      marketData: {
        product: {
          url: 'https://shop.example.com/products/main',
          title: 'Main offer',
          price: 79,
          priceUsd: 79,
          currency: 'USD',
          reviewCount: 120,
          availability: 'in_stock',
          platform: 'shopify',
          source: 'public_page',
        },
        competitors: [
          {
            url: 'https://competitor-a.example.com/product',
            title: 'Competitor A',
            price: 95,
            priceUsd: 95,
            currency: 'USD',
            reviewCount: 300,
            availability: 'out_of_stock',
            platform: 'other',
            source: 'public_page',
          },
        ],
        competitorAvgPrice: 95,
        competitorAvgPriceUsd: 95,
        marketMonthlyUnitsEstimate: 1800,
        sourceNotes: [],
        connectorSignals: [{ provider: 'public_page', note: 'public data only' }],
      } as any,
      previousSnapshots: [
        {
          source_url: 'https://shop.example.com/products/main',
          competitor_url: 'https://competitor-a.example.com/product',
          price: 95,
          price_usd: 95,
          currency: 'USD',
          availability: 'in_stock',
          title: 'Competitor A',
          review_count: 300,
          created_at: '2026-04-09T10:00:00.000Z',
        },
      ],
    });

    expect(report.status).toBe('opportunity');
    expect(report.opportunities.some((item) => item.includes('out of stock'))).toBe(true);
    expect(report.opportunities.some((item) => item.includes('below'))).toBe(true);
  });

  it('raises a risk report when competitors drop price and the tracked offer is above market', () => {
    const report = buildMarketWatchReport({
      marketData: {
        product: {
          url: 'https://shop.example.com/products/main',
          title: 'Main offer',
          price: 119,
          priceUsd: 119,
          currency: 'USD',
          reviewCount: 40,
          availability: 'in_stock',
          platform: 'shopify',
          source: 'public_page',
        },
        competitors: [
          {
            url: 'https://competitor-a.example.com/product',
            title: 'Competitor A',
            price: 89,
            priceUsd: 89,
            currency: 'USD',
            reviewCount: 180,
            availability: 'in_stock',
            platform: 'other',
            source: 'public_page',
          },
        ],
        competitorAvgPrice: 89,
        competitorAvgPriceUsd: 89,
        marketMonthlyUnitsEstimate: 320,
        sourceNotes: [],
        connectorSignals: [{ provider: 'public_page', note: 'public data only' }],
      } as any,
      previousSnapshots: [
        {
          source_url: 'https://shop.example.com/products/main',
          competitor_url: 'https://competitor-a.example.com/product',
          price: 103,
          price_usd: 103,
          currency: 'USD',
          availability: 'in_stock',
          title: 'Competitor A',
          review_count: 160,
          created_at: '2026-04-09T10:00:00.000Z',
        },
      ],
    });

    expect(report.status).toBe('risk');
    expect(report.alerts.some((item) => item.includes('dropped price'))).toBe(true);
    expect(report.alerts.some((item) => item.includes('above'))).toBe(true);
  });

  it('returns Polish copy when the language is set to pl', () => {
    const report = buildMarketWatchReport({
      marketData: {
        product: {
          url: 'https://shop.example.com/products/main',
          title: 'Main offer',
          price: 119,
          priceUsd: 119,
          currency: 'USD',
          reviewCount: 40,
          availability: 'in_stock',
          platform: 'shopify',
          source: 'public_page',
        },
        competitors: [
          {
            url: 'https://competitor-a.example.com/product',
            title: 'Competitor A',
            price: 89,
            priceUsd: 89,
            currency: 'USD',
            reviewCount: 180,
            availability: 'in_stock',
            platform: 'other',
            source: 'public_page',
          },
        ],
        competitorAvgPrice: 89,
        competitorAvgPriceUsd: 89,
        marketMonthlyUnitsEstimate: 320,
        sourceNotes: [],
        connectorSignals: [{ provider: 'public_page', note: 'public data only' }],
      } as any,
      previousSnapshots: [
        {
          source_url: 'https://shop.example.com/products/main',
          competitor_url: 'https://competitor-a.example.com/product',
          price: 103,
          price_usd: 103,
          currency: 'USD',
          availability: 'in_stock',
          title: 'Competitor A',
          review_count: 160,
          created_at: '2026-04-09T10:00:00.000Z',
        },
      ],
      language: 'pl',
    });

    expect(report.headline).toContain('Rynek');
    expect(report.summary).toContain('Wykryto');
    expect(report.alerts.some((item) => item.includes('obniżył cenę'))).toBe(true);
  });
});
