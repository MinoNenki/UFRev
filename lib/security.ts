import crypto from 'crypto';
import { env } from '@/lib/env';

type SigningKey = {
  kid: string;
  secret: string;
};

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

function isSecretStrong(secret: string) {
  // Require at least 32 bytes to avoid weak signing keys in production.
  return Buffer.byteLength(secret.trim(), 'utf8') >= 32;
}

function buildKeyRing(entries: Array<{ kid: string; secret: string }>) {
  const ring = new Map<string, SigningKey>();
  for (const entry of entries) {
    const kid = (entry.kid || '').trim();
    const secret = (entry.secret || '').trim();
    if (!kid || !secret) continue;
    if (process.env.NODE_ENV === 'production' && !isSecretStrong(secret)) continue;
    ring.set(kid, { kid, secret });
  }
  return ring;
}

function getRewardKeyRing() {
  const ring = buildKeyRing([
    { kid: env.rewardTokenKidCurrent || 'rwd_v1', secret: env.rewardTokenSecretCurrent },
    { kid: `${env.rewardTokenKidCurrent || 'rwd_v1'}_prev`, secret: env.rewardTokenSecretPrevious },
  ]);

  if (ring.size) return ring;

  if (process.env.NODE_ENV !== 'production') {
    return buildKeyRing([{ kid: 'rwd_dev_v1', secret: 'development-reward-secret' }]);
  }

  return ring;
}

function getSignedLinkKeyRing() {
  const ring = buildKeyRing([
    { kid: env.signedLinkKidCurrent || 'lnk_v1', secret: env.signedLinkSecretCurrent },
    { kid: `${env.signedLinkKidCurrent || 'lnk_v1'}_prev`, secret: env.signedLinkSecretPrevious },
  ]);

  if (ring.size) return ring;

  if (process.env.NODE_ENV !== 'production') {
    return buildKeyRing([{ kid: 'lnk_dev_v1', secret: 'development-signed-link-secret' }]);
  }

  return ring;
}

export function isRewardTokenReady() {
  return getRewardKeyRing().size > 0;
}

function signaturesMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(received, 'utf8');

  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function createRewardToken(userId: string, ttlSeconds = 300) {
  const ring = getRewardKeyRing();
  const primaryKey = ring.get(env.rewardTokenKidCurrent) || Array.from(ring.values())[0];
  if (!primaryKey) return '';
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${userId}.${expires}.${nonce}`;
  const sig = crypto.createHmac('sha256', primaryKey.secret).update(payload).digest('hex');
  return `${primaryKey.kid}.${payload}.${sig}`;
}

export function verifyRewardToken(token: string, userId: string) {
  const ring = getRewardKeyRing();
  if (!ring.size) return { valid: false, reason: 'Reward token secret is not configured', tokenHash: '' };

  const parts = token.split('.');
  const isKidToken = parts.length === 5;
  const isLegacyToken = parts.length === 4;

  if (!isKidToken && !isLegacyToken) return { valid: false, reason: 'Malformed token', tokenHash: '' };

  const tokenUserId = isKidToken ? parts[1] : parts[0];
  const expiresRaw = isKidToken ? parts[2] : parts[1];
  const nonce = isKidToken ? parts[3] : parts[2];
  const signature = isKidToken ? parts[4] : parts[3];

  if (tokenUserId !== userId) return { valid: false, reason: 'Token user mismatch', tokenHash: '' };
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) return { valid: false, reason: 'Token expired', tokenHash: '' };

  const payload = `${tokenUserId}.${expires}.${nonce}`;

  const candidateKeys = isKidToken
    ? (() => {
        const key = ring.get(parts[0]);
        return key ? [key] : Array.from(ring.values());
      })()
    : Array.from(ring.values());

  const valid = candidateKeys.some((key) => {
    const expected = crypto.createHmac('sha256', key.secret).update(payload).digest('hex');
    return signaturesMatch(expected, signature);
  });

  if (!valid) return { valid: false, reason: 'Invalid token signature', tokenHash: '' };
  return { valid: true, tokenHash: crypto.createHash('sha256').update(token).digest('hex') };
}

export function createSignedLinkParams(pathname: string, method: string, ttlSeconds = 300, extra = '') {
  const ring = getSignedLinkKeyRing();
  const primaryKey = ring.get(env.signedLinkKidCurrent) || Array.from(ring.values())[0];
  if (!primaryKey) return null;

  const safeMethod = String(method || 'GET').toUpperCase();
  const expires = Math.floor(Date.now() / 1000) + Math.max(5, ttlSeconds);
  const nonce = crypto.randomBytes(18).toString('base64url');
  const payload = `${safeMethod}\n${pathname}\n${expires}\n${nonce}\n${extra}`;
  const signature = crypto.createHmac('sha256', primaryKey.secret).update(payload).digest('hex');

  return {
    kid: primaryKey.kid,
    exp: String(expires),
    nonce,
    sig: signature,
    extra,
  };
}

export function verifySignedLinkSignature(params: {
  pathname: string;
  method: string;
  kid: string | null;
  expiresRaw: string | null;
  nonce: string | null;
  signature: string | null;
  extra?: string | null;
}) {
  const ring = getSignedLinkKeyRing();
  if (!ring.size) return { valid: false, reason: 'Signed link secret is not configured' };

  const kid = String(params.kid || '').trim();
  const expiresRaw = String(params.expiresRaw || '').trim();
  const nonce = String(params.nonce || '').trim();
  const signature = String(params.signature || '').trim();
  const extra = String(params.extra || '');

  if (!kid || !expiresRaw || !nonce || !signature) return { valid: false, reason: 'Missing signed link params' };
  if (!/^[A-Za-z0-9_-]{12,128}$/.test(nonce)) return { valid: false, reason: 'Invalid nonce format' };

  const expires = Number(expiresRaw);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(expires) || expires < now) return { valid: false, reason: 'Signed link expired' };

  const safeMethod = String(params.method || 'GET').toUpperCase();
  const payload = `${safeMethod}\n${params.pathname}\n${expires}\n${nonce}\n${extra}`;

  const keysToTry = (() => {
    const key = ring.get(kid);
    return key ? [key] : Array.from(ring.values());
  })();

  const valid = keysToTry.some((key) => {
    const expected = crypto.createHmac('sha256', key.secret).update(payload).digest('hex');
    return signaturesMatch(expected, signature);
  });

  if (!valid) return { valid: false, reason: 'Signed link signature mismatch' };
  return { valid: true, reason: '' };
}
