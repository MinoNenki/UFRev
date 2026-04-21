import { describe, expect, it } from 'vitest';
import {
  SECURITY_LIMITS,
  clampText,
  createRewardToken,
  estimateAnalysisCostUsd,
  estimateTokens,
  verifyRewardToken,
} from '@/lib/security';

describe('security helpers', () => {
  it('keeps the new upload ceilings available for heavy media', () => {
    expect(SECURITY_LIMITS.maxFileSizeBytes).toBe(16 * 1024 * 1024);
    expect(SECURITY_LIMITS.maxVideoFileSizeBytes).toBe(48 * 1024 * 1024);
    expect(SECURITY_LIMITS.maxTotalUploadBytes).toBe(96 * 1024 * 1024);
  });

  it('trims and clamps text input', () => {
    expect(clampText('   hello world   ', 5)).toBe('hello');
  });

  it('estimates tokens from text length', () => {
    expect(estimateTokens('1234')).toBe(1);
    expect(estimateTokens('12345678')).toBe(2);
  });

  it('estimates analysis cost from tokens and images', () => {
    expect(estimateAnalysisCostUsd({ inputTokens: 1000, imageCount: 2 })).toBe(0.0225);
  });

  it('creates and verifies a valid reward token', () => {
    const token = createRewardToken('user-123', 300);
    const result = verifyRewardToken(token, 'user-123');

    expect(result.valid).toBe(true);
    expect(result.tokenHash).toHaveLength(64);
  });

  it('rejects malformed or mismatched reward tokens', () => {
    expect(verifyRewardToken('bad.token', 'user-123').valid).toBe(false);

    const token = createRewardToken('user-abc', 300);
    expect(verifyRewardToken(token, 'different-user').valid).toBe(false);
  });

  it('rejects tampered reward token signatures', () => {
    const token = createRewardToken('user-999', 300);
    const parts = token.split('.');
    parts[3] = `${parts[3].slice(0, -1)}0`;

    expect(verifyRewardToken(parts.join('.'), 'user-999').valid).toBe(false);
  });
});
