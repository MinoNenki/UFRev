import { describe, expect, it } from 'vitest';
import { calculateDecision, deriveMarketWatch, deriveOpportunityProfile } from '@/lib/decision-engine';

describe('decision engine', () => {
  it('returns a strong BUY-style result when margin, demand, and evidence are healthy', () => {
    const result = calculateDecision({
      price: 79,
      cost: 21,
      demand: 84,
      competition: 32,
      adBudget: 450,
      competitorAvgPrice: 74,
      marketMonthlyUnits: 1800,
      websiteUrl: 'https://example.com/product',
      competitorUrls: 'https://competitor.com/item',
      salesChannel: 'Shopify',
      targetMarket: 'PL',
      content: 'Bundle offer with guarantee, strong reviews, differentiated positioning, and repeat purchase angle.',
      uploadedFileCount: 1,
      uploadedImageCount: 1,
      displayCurrency: 'PLN',
    });

    expect(result.verdict).toBe('BUY');
    expect(result.confidenceLabel).toBe('High');
    expect(result.burnRisk).toBe('Low');
    expect(result.dataMode).toBe('connector_ready');
    expect(result.market.estimatedMonthlyRevenue).toBeGreaterThan(0);
    expect(result.pricing.marginPercent).toBeGreaterThan(70);
  });

  it('downgrades to TEST when BUY evidence is missing', () => {
    const result = calculateDecision({
      price: 69,
      cost: 18,
      demand: 88,
      competition: 20,
      adBudget: 300,
      content: 'Interesting product but with no public URL or competitor proof yet.',
    });

    expect(result.verdict).toBe('TEST');
    expect(result.guardrailsTriggered).toContain('Competitor evidence missing for BUY verdict.');
    expect(result.guardrailsTriggered).toContain('Offer URL missing for BUY verdict.');
  });

  it('does not report fake 100 percent margin when cost is missing', () => {
    const result = calculateDecision({
      price: 10260,
      cost: 0,
      demand: 58,
      competition: 48,
      content: 'Used quad offer with only the resale price confirmed so far.',
    });

    expect(result.pricing.marginPercent).toBe(0);
    expect(result.pricing.breakEvenROAS).toBeNull();
  });

  it('pushes suggested resale pricing above cost when the current price is underwater', () => {
    const result = calculateDecision({
      price: 34,
      cost: 40,
      demand: 62,
      competition: 52,
      content: 'Wholesale item costs more than the scraped retail page price.',
    });

    expect(result.pricing.marginPercent).toBeLessThan(0);
    expect(result.pricing.suggestedPriceMin).toBeGreaterThan(40);
    expect(result.pricing.suggestedTestPrice).toBeGreaterThan(40);
  });

  it('blocks weak unit economics and high burn risk', () => {
    const result = calculateDecision({
      price: 20,
      cost: 18.5,
      demand: 35,
      competition: 86,
      adBudget: 2000,
      content: 'Thin margin and crowded market.',
    });

    expect(result.verdict).toBe('AVOID');
    expect(result.executionMode).toBe('blocked');
    expect(result.burnRisk).toBe('High');
    expect(result.guardrailsTriggered.some((item) => item.includes('Margin below guardrail'))).toBe(true);
  });

  it('computes rollout and monetization guidance consistently', () => {
    const result = calculateDecision({
      price: 49,
      cost: 19,
      demand: 62,
      competition: 48,
      adBudget: 250,
      competitorAvgPrice: 52,
      marketMonthlyUnits: 900,
      websiteUrl: 'https://example.com/offer',
      competitorUrls: 'https://competitor.com/a\nhttps://competitor.com/b',
      content: 'Offer with social proof and a simple guarantee.',
    });

    expect(result.rolloutPlan.length).toBeGreaterThan(0);
    expect(result.capitalProtection.length).toBeGreaterThan(0);
    expect(result.revenuePlaybook.length).toBeGreaterThan(0);
    expect(result.monetization.recommendedPlan).toMatch(/pro|scale/);
  });

  it('opens the opportunity window for strong low-risk opportunities', () => {
    const result = calculateDecision({
      price: 89,
      cost: 24,
      demand: 86,
      competition: 28,
      adBudget: 420,
      competitorAvgPrice: 94,
      marketMonthlyUnits: 2100,
      websiteUrl: 'https://example.com/product',
      competitorUrls: 'https://competitor.com/item',
      salesChannel: 'Shopify',
      targetMarket: 'US',
      content: 'Differentiated offer with bundle, guarantee, reviews, and clear positioning.',
      uploadedFileCount: 1,
      uploadedImageCount: 1,
    });

    const profile = deriveOpportunityProfile(result);

    expect(profile.opportunityWindow).toBe('open');
    expect(profile.actionBias).toBe('accelerate');
    expect(profile.executionReadiness).toBeGreaterThanOrEqual(68);
  });

  it('closes the opportunity window when burn risk is unsafe', () => {
    const result = calculateDecision({
      price: 24,
      cost: 22,
      demand: 38,
      competition: 88,
      adBudget: 1800,
      content: 'Thin margin, crowded market, weak economics.',
    });

    const profile = deriveOpportunityProfile(result);

    expect(profile.opportunityWindow).toBe('closed');
    expect(profile.actionBias).toBe('protect');
  });

  it('detects a price-lift opportunity when priced below market with strong demand', () => {
    const result = calculateDecision({
      price: 79,
      cost: 24,
      demand: 82,
      competition: 34,
      adBudget: 350,
      competitorAvgPrice: 92,
      marketMonthlyUnits: 1900,
      websiteUrl: 'https://example.com/product',
      competitorUrls: 'https://competitor.com/item',
      content: 'Strong reviews, guarantee, and differentiated angle.',
      uploadedFileCount: 1,
      uploadedImageCount: 1,
    });

    const watch = deriveMarketWatch(result);

    expect(watch.pricePosition).toBe('below_market');
    expect(watch.demandProxy).toBe('strong');
    expect(watch.moves.some((item) => item.includes('price increase'))).toBe(true);
  });

  it('raises a market-pressure alert when the offer is overpriced in a risky market', () => {
    const result = calculateDecision({
      price: 119,
      cost: 84,
      demand: 44,
      competition: 86,
      adBudget: 1200,
      competitorAvgPrice: 92,
      marketMonthlyUnits: 420,
      websiteUrl: 'https://example.com/product',
      competitorUrls: 'https://competitor.com/item',
      content: 'Weak demand, high competition, thin margin.',
    });

    const watch = deriveMarketWatch(result);

    expect(watch.pricePosition).toBe('above_market');
    expect(watch.saturationRisk).toBe('high');
    expect(watch.alerts.some((item) => item.includes('above'))).toBe(true);
  });
});
