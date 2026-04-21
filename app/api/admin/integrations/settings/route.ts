import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateIntegrationConnections } from '@/lib/integration-health';

export const runtime = 'nodejs';

function checked(formData: FormData, key: string) {
  return formData.get(key) === 'on';
}

export async function POST(req: NextRequest) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.redirect(new URL('/auth/login', req.url));

  const formData = await req.formData();
  const shopifyStoreDomain = String(formData.get('shopifyStoreDomain') || '').trim();
  const amazonMarketplaceId = String(formData.get('amazonMarketplaceId') || '').trim();
  const ebaySiteId = String(formData.get('ebaySiteId') || 'EBAY_US').trim();
  const woocommerceStoreUrl = String(formData.get('woocommerceStoreUrl') || '').trim();
  const alibabaRegion = String(formData.get('alibabaRegion') || 'GLOBAL').trim();
  const allegroRegion = String(formData.get('allegroRegion') || 'PL').trim();
  const tiktokAdAccountId = String(formData.get('tiktokAdAccountId') || '').trim();
  const metaBusinessId = String(formData.get('metaBusinessId') || '').trim();
  const maxSyncPriceChangePercent = Number(formData.get('maxSyncPriceChangePercent') || 15);
  const minimumStockBufferUnits = Number(formData.get('minimumStockBufferUnits') || 5);
  const maxListingsPerHour = Number(formData.get('maxListingsPerHour') || 25);

  if (maxSyncPriceChangePercent < 1 || maxSyncPriceChangePercent > 80 || minimumStockBufferUnits < 0 || minimumStockBufferUnits > 10000 || maxListingsPerHour < 1 || maxListingsPerHour > 10000) {
    return NextResponse.redirect(new URL('/admin/integrations?error=1', req.url));
  }

  const connectionChecks = await validateIntegrationConnections({
    shopifyStoreDomain,
    woocommerceStoreUrl,
    tiktokAdAccountId,
    metaBusinessId,
  });

  await supabaseAdmin.from('app_config').upsert({
    key: 'integration_settings',
    value_json: {
      shopify_enabled: checked(formData, 'shopifyEnabled'),
      amazon_enabled: checked(formData, 'amazonEnabled'),
      ebay_enabled: checked(formData, 'ebayEnabled'),
      alibaba_enabled: checked(formData, 'alibabaEnabled'),
      aliexpress_enabled: checked(formData, 'aliexpressEnabled'),
      walmart_enabled: checked(formData, 'walmartEnabled'),
      etsy_enabled: checked(formData, 'etsyEnabled'),
      rakuten_enabled: checked(formData, 'rakutenEnabled'),
      allegro_enabled: checked(formData, 'allegroEnabled'),
      cdiscount_enabled: checked(formData, 'cdiscountEnabled'),
      emag_enabled: checked(formData, 'emagEnabled'),
      otto_enabled: checked(formData, 'ottoEnabled'),
      zalando_enabled: checked(formData, 'zalandoEnabled'),
      woocommerce_enabled: checked(formData, 'woocommerceEnabled'),
      tiktok_enabled: checked(formData, 'tiktokEnabled'),
      meta_ads_enabled: checked(formData, 'metaAdsEnabled'),
      shopify_store_domain: shopifyStoreDomain,
      amazon_marketplace_id: amazonMarketplaceId,
      ebay_site_id: ebaySiteId,
      woocommerce_store_url: woocommerceStoreUrl,
      alibaba_region: alibabaRegion,
      allegro_region: allegroRegion,
      tiktok_ad_account_id: tiktokAdAccountId,
      meta_business_id: metaBusinessId,
      sync_inventory: checked(formData, 'syncInventory'),
      sync_orders: checked(formData, 'syncOrders'),
      sync_pricing: checked(formData, 'syncPricing'),
      sync_listings: checked(formData, 'syncListings'),
      sync_returns: checked(formData, 'syncReturns'),
      sync_traffic: checked(formData, 'syncTraffic'),
      dry_run_mode: checked(formData, 'dryRunMode'),
      require_manual_approval: checked(formData, 'requireManualApproval'),
      auto_publish_disabled: checked(formData, 'autoPublishDisabled'),
      max_sync_price_change_percent: maxSyncPriceChangePercent,
      minimum_stock_buffer_units: minimumStockBufferUnits,
      max_listings_per_hour: maxListingsPerHour,
      connection_checks: connectionChecks,
    },
    updated_at: new Date().toISOString(),
  });

  return NextResponse.redirect(new URL('/admin/integrations?updated=1', req.url));
}
