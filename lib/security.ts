import crypto from 'crypto';
import { env } from '@/lib/env';

export const SECURITY_LIMITS = {
  maxContentChars: 12000,
  maxProductNameChars: 120,
  maxAuxFieldChars: 300,
  maxCompetitorUrlsChars: 1200,
  maxFiles: 5,
  maxImages: 3,
  maxFileSizeBytes: 16 * 1024 * 1024,
  maxVideoFileSizeBytes: 48 * 1024 * 1024,
  maxTotalUploadBytes: 96 * 1024 * 1024,
  maxAnalysisRequestsPer10Min: 10,
  maxAnalysesPerDay: 30,
  maxRewardClaimsPerHour: 8,
  minSecondsBetweenRewardClaims: 20,
  maxEstimatedInputTokens: 5000,
  maxEstimatedAnalysisCostUsd: 0.12,
} as const;

export function clampText(value: string, max: number) {
  return value.trim().slice(0, max);
}

export function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

export function estimateAnalysisCostUsd(params: { inputTokens: number; imageCount: number }) {
  const tokenCost = params.inputTokens * 0.0000025;
  const imageCost = params.imageCount * 0.01;
  return Number((tokenCost + imageCost).toFixed(4));
}

function rewardSecret() {
  if (env.rewardTokenSecret) return env.rewardTokenSecret;
  if (process.env.NODE_ENV !== 'production') return 'development-reward-secret';
  return '';
}

export function isRewardTokenReady() {
  return Boolean(rewardSecret());
}

function signaturesMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(received, 'utf8');

  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function createRewardToken(userId: string, ttlSeconds = 300) {
  const secret = rewardSecret();
  if (!secret) return '';
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${userId}.${expires}.${nonce}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifyRewardToken(token: string, userId: string) {
  const secret = rewardSecret();
  if (!secret) return { valid: false, reason: 'Reward token secret is not configured', tokenHash: '' };
  const parts = token.split('.');
  if (parts.length !== 4) return { valid: false, reason: 'Malformed token', tokenHash: '' };
  const [tokenUserId, expiresRaw, nonce, signature] = parts;
  if (tokenUserId !== userId) return { valid: false, reason: 'Token user mismatch', tokenHash: '' };
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) return { valid: false, reason: 'Token expired', tokenHash: '' };
  const payload = `${tokenUserId}.${expires}.${nonce}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (!signaturesMatch(expected, signature)) return { valid: false, reason: 'Invalid token signature', tokenHash: '' };
  return { valid: true, tokenHash: crypto.createHash('sha256').update(token).digest('hex') };
}
