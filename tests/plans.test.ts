import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  estimateAnalysisTokenCost,
  getCreditPackByStripePriceId,
  getPlanByStripePriceId,
} from '@/lib/plans';

describe('plan and token costing rules', () => {
  afterEach(() => {
    delete process.env.STRIPE_PRICE_STARTER;
    delete process.env.STRIPE_PRICE_PRO;
    delete process.env.STRIPE_PRICE_SCALE;
    delete process.env.STRIPE_PRICE_STARTER_19;
    delete process.env.STRIPE_PRICE_GROWTH_49;
    delete process.env.STRIPE_PRICE_SCALE_99;
    delete process.env.STRIPE_PRICE_COMMAND_149;
    delete process.env.STRIPE_PRICE_PACK_9;
    delete process.env.STRIPE_PRICE_PACK_19;
    delete process.env.STRIPE_PRICE_PACK_39;
    vi.restoreAllMocks();
  });

  it('keeps basic text analysis at the lowest token cost', () => {
    expect(estimateAnalysisTokenCost({ contentLength: 120, uploadedFiles: [] })).toBe(1);
  });

  it('raises cost for document-style analysis', () => {
    expect(
      estimateAnalysisTokenCost({
        contentLength: 600,
        uploadedFiles: [{ name: 'brief.pdf', size: 100_000, type: 'application/pdf' }],
      })
    ).toBe(2);
  });

  it('scales video pricing by weight and complexity', () => {
    expect(
      estimateAnalysisTokenCost({
        contentLength: 100,
        uploadedFiles: [{ name: 'clip.mp4', size: 4 * 1024 * 1024, type: 'video/mp4' }],
      })
    ).toBe(4);

    expect(
      estimateAnalysisTokenCost({
        contentLength: 100,
        uploadedFiles: [{ name: 'clip.mp4', size: 10 * 1024 * 1024, type: 'video/mp4' }],
      })
    ).toBe(6);

    expect(
      estimateAnalysisTokenCost({
        contentLength: 7001,
        uploadedFiles: [{ name: 'clip.mp4', size: 16 * 1024 * 1024, type: 'video/mp4' }],
      })
    ).toBe(8);
  });

  it('resolves Stripe price ids for plans and packs', () => {
    process.env.STRIPE_PRICE_STARTER = 'price_starter';
    process.env.STRIPE_PRICE_PRO = 'price_pro';
    process.env.STRIPE_PRICE_SCALE = 'price_scale';
    process.env.STRIPE_PRICE_PACK_19 = 'price_pack';

    expect(getPlanByStripePriceId('price_starter')).toBe('starter');
    expect(getPlanByStripePriceId('price_pro')).toBe('pro');
    expect(getPlanByStripePriceId('price_scale')).toBe('scale');
    expect(getPlanByStripePriceId('unknown')).toBeNull();
    expect(getCreditPackByStripePriceId('price_pack')).toBe('pack19');
    expect(getCreditPackByStripePriceId('unknown')).toBeNull();
  });

  it('matches Stripe products when env stores prod ids instead of price ids', () => {
    process.env.STRIPE_PRICE_STARTER = 'prod_starter';
    process.env.STRIPE_PRICE_PACK_39 = 'prod_pack_39';

    expect(getPlanByStripePriceId('price_anything', 'prod_starter')).toBe('starter');
    expect(getCreditPackByStripePriceId('price_anything', 'prod_pack_39')).toBe('pack39');
  });
});
