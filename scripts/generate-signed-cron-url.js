/* eslint-disable no-console */
const crypto = require('crypto');

function getEnv(name, fallback = '') {
  return String(process.env[name] || fallback).trim();
}

function main() {
  const baseUrl = getEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000').replace(/\/$/, '');
  const pathname = '/api/automations/market-watch/run';
  const method = 'POST';
  const kid = getEnv('SIGNED_LINK_KID_CURRENT', 'lnk_v1');
  const secret = getEnv('SIGNED_LINK_SECRET_CURRENT');
  const extra = getEnv('SIGNED_LINK_EXTRA', 'market-watch-cron');
  const ttlSeconds = Math.max(30, Number(process.env.SIGNED_LINK_TTL_SECONDS || 600));

  if (!secret) {
    console.error('Missing SIGNED_LINK_SECRET_CURRENT in environment.');
    process.exit(1);
  }

  if (Buffer.byteLength(secret, 'utf8') < 32) {
    console.error('SIGNED_LINK_SECRET_CURRENT is too short. Use at least 32 bytes.');
    process.exit(1);
  }

  const exp = String(Math.floor(Date.now() / 1000) + ttlSeconds);
  const nonce = crypto.randomBytes(18).toString('base64url');
  const payload = `${method}\n${pathname}\n${exp}\n${nonce}\n${extra}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const query = new URLSearchParams({
    sl_kid: kid,
    sl_exp: exp,
    sl_nonce: nonce,
    sl_sig: sig,
    sl_extra: extra,
  });

  const fullUrl = `${baseUrl}${pathname}?${query.toString()}`;

  console.log('Signed cron URL (POST):');
  console.log(fullUrl);
  console.log('');
  console.log('Example curl:');
  console.log(`curl -X POST \"${fullUrl}\" -H \"content-type: application/json\" -d \"{}\"`);
}

main();
