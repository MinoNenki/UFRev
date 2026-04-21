import { describe, expect, it } from 'vitest';
import { createDefaultConnectionChecks, mergeConnectionChecks } from '@/lib/integration-health';

describe('integration health defaults', () => {
  it('starts all checks as not configured', () => {
    const checks = createDefaultConnectionChecks();

    expect(checks.shopify.state).toBe('not_configured');
    expect(checks.woocommerce.state).toBe('not_configured');
    expect(checks.tiktok.state).toBe('not_configured');
    expect(checks.meta.state).toBe('not_configured');
  });

  it('merges only the targeted validation checks', () => {
    const current = createDefaultConnectionChecks();
    const next = {
      ...createDefaultConnectionChecks(),
      shopify: { state: 'validated' as const, message: 'ok', checkedAt: '2026-04-20T00:00:00.000Z', evidence: 'shop.example.com' },
      woocommerce: { state: 'validated' as const, message: 'ok', checkedAt: '2026-04-20T00:00:00.000Z', evidence: 'https://store.example.com' },
      tiktok: { state: 'invalid' as const, message: 'bad token', checkedAt: '2026-04-20T00:00:00.000Z', evidence: '123' },
      meta: { state: 'invalid' as const, message: 'bad token', checkedAt: '2026-04-20T00:00:00.000Z', evidence: 'act_123' },
    };

    const socialOnly = mergeConnectionChecks({ current, next, target: 'social' });

    expect(socialOnly.shopify.state).toBe('not_configured');
    expect(socialOnly.woocommerce.state).toBe('not_configured');
    expect(socialOnly.tiktok.state).toBe('invalid');
    expect(socialOnly.meta.state).toBe('invalid');
  });
});