export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || '',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || process.env.MY_OPENAI_KEY || process.env.MY_OPENAI_API_KEY || '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  rewardTokenSecretCurrent: process.env.REWARD_TOKEN_SECRET_CURRENT || process.env.REWARD_TOKEN_SECRET || '',
  rewardTokenSecretPrevious: process.env.REWARD_TOKEN_SECRET_PREVIOUS || '',
  rewardTokenKidCurrent: process.env.REWARD_TOKEN_KID_CURRENT || 'rwd_v1',
  // Backward compatibility alias for older imports.
  rewardTokenSecret: process.env.REWARD_TOKEN_SECRET_CURRENT || process.env.REWARD_TOKEN_SECRET || '',
  signedLinkSecretCurrent: process.env.SIGNED_LINK_SECRET_CURRENT || '',
  signedLinkSecretPrevious: process.env.SIGNED_LINK_SECRET_PREVIOUS || '',
  signedLinkKidCurrent: process.env.SIGNED_LINK_KID_CURRENT || 'lnk_v1',
  marketWatchCronSecret: process.env.MARKET_WATCH_CRON_SECRET || process.env.CRON_SECRET || '',
  adsenseClientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '',
  adsensePublisherId: process.env.GOOGLE_ADSENSE_PUBLISHER_ID || '',
  adsenseDisplaySlotId: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID || '',
  adsenseManagementAccessToken: process.env.GOOGLE_ADSENSE_MANAGEMENT_ACCESS_TOKEN || '',
  googleAdsDeveloperToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
  googleAdsClientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
  googleAdsClientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
  googleAdsRefreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
  googleAdsCustomerId: process.env.GOOGLE_ADS_CUSTOMER_ID || '',
  googleAdsLoginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '',
  shopifyStoreDomain: process.env.SHOPIFY_STORE_DOMAIN || '',
  shopifyAdminAccessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '',
  shopifyApiVersion: process.env.SHOPIFY_API_VERSION || '2025-01',
  ebayAppId: process.env.EBAY_APP_ID || '',
  ebayDevId: process.env.EBAY_DEV_ID || '',
  ebayCertId: process.env.EBAY_CERT_ID || '',
  ebayEnvironment: process.env.EBAY_ENVIRONMENT || 'production',
  ebaySiteId: process.env.EBAY_SITE_ID || 'EBAY_US',
  allegroClientId: process.env.ALLEGRO_CLIENT_ID || '',
  allegroClientSecret: process.env.ALLEGRO_CLIENT_SECRET || '',
  allegroRedirectUri: process.env.ALLEGRO_REDIRECT_URI || '',
  allegroEnvironment: process.env.ALLEGRO_ENVIRONMENT || 'production',
  prelaunchMode: process.env.PRELAUNCH_MODE === 'true',
  prelaunchPassword: process.env.PRELAUNCH_PASSWORD || '',
  prelaunchCookieName: process.env.PRELAUNCH_COOKIE_NAME || 'ufrev_preview_access',
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const isSupabaseAdminConfigured = Boolean(isSupabaseConfigured && env.supabaseServiceRoleKey);
export const isOpenAIConfigured = Boolean(env.openaiApiKey);
export const isPrelaunchEnabled = Boolean(env.prelaunchMode && env.prelaunchPassword);
export const isStripeConfigured = Boolean(env.stripeSecretKey);
export const isStripeWebhookConfigured = Boolean(env.stripeWebhookSecret);
export const isRewardSecurityConfigured = Boolean(env.rewardTokenSecretCurrent);
export const isSignedLinkSecurityConfigured = Boolean(env.signedLinkSecretCurrent);

function isStrongSecret(value: string) {
  return Buffer.byteLength((value || '').trim(), 'utf8') >= 32;
}

export function getSetupWarnings() {
  const warnings: string[] = [];
  if (!env.siteUrl) warnings.push('Missing NEXT_PUBLIC_SITE_URL for absolute checkout and metadata URLs.');
  if (!isSupabaseConfigured) warnings.push('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  if (!env.supabaseServiceRoleKey) warnings.push('Missing SUPABASE_SERVICE_ROLE_KEY for admin / server-side features.');
  if (!isOpenAIConfigured) warnings.push('Missing OPENAI_API_KEY. AI analysis will use fallback text only.');
  if (!env.stripeSecretKey) warnings.push('Missing STRIPE_SECRET_KEY. Checkout sessions will fail.');
  if (!env.stripeWebhookSecret) warnings.push('Missing STRIPE_WEBHOOK_SECRET. Stripe webhook sync will fail.');
  if (!env.rewardTokenSecretCurrent) warnings.push('Missing REWARD_TOKEN_SECRET_CURRENT (or REWARD_TOKEN_SECRET legacy fallback). Rewarded ad claims should stay disabled until this is configured.');
  if (env.rewardTokenSecretCurrent && !isStrongSecret(env.rewardTokenSecretCurrent)) warnings.push('REWARD_TOKEN_SECRET_CURRENT is too short. Use at least 32 bytes.');
  if (env.rewardTokenSecretPrevious && !isStrongSecret(env.rewardTokenSecretPrevious)) warnings.push('REWARD_TOKEN_SECRET_PREVIOUS is too short. Use at least 32 bytes.');
  if (env.signedLinkSecretCurrent && !isStrongSecret(env.signedLinkSecretCurrent)) warnings.push('SIGNED_LINK_SECRET_CURRENT is too short. Use at least 32 bytes.');
  if (env.signedLinkSecretPrevious && !isStrongSecret(env.signedLinkSecretPrevious)) warnings.push('SIGNED_LINK_SECRET_PREVIOUS is too short. Use at least 32 bytes.');
  if (env.marketWatchCronSecret && !env.signedLinkSecretCurrent) warnings.push('MARKET_WATCH_CRON_SECRET is set without SIGNED_LINK_SECRET_CURRENT. Add signed links for stronger cron endpoint protection.');
  if ((env.adsenseClientId && !env.adsenseDisplaySlotId) || (!env.adsenseClientId && env.adsenseDisplaySlotId)) warnings.push('AdSense display slots need both NEXT_PUBLIC_ADSENSE_CLIENT_ID and NEXT_PUBLIC_ADSENSE_SLOT_ID.');
  if (env.googleAdsDeveloperToken && (!env.googleAdsClientId || !env.googleAdsClientSecret || !env.googleAdsRefreshToken)) warnings.push('Google Ads sync needs GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, and GOOGLE_ADS_REFRESH_TOKEN together.');
  if (!env.shopifyStoreDomain || !env.shopifyAdminAccessToken) warnings.push('Optional: add SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN for deeper Shopify sync.');
  if ((env.ebayAppId || env.ebayCertId) && !(env.ebayAppId && env.ebayCertId)) warnings.push('eBay connector needs both EBAY_APP_ID and EBAY_CERT_ID.');
  if ((env.allegroClientId || env.allegroClientSecret) && !(env.allegroClientId && env.allegroClientSecret)) warnings.push('Allegro connector needs both ALLEGRO_CLIENT_ID and ALLEGRO_CLIENT_SECRET.');
  if (env.prelaunchMode && !env.prelaunchPassword) warnings.push('PRELAUNCH_MODE is enabled but PRELAUNCH_PASSWORD is missing.');
  return warnings;
}
