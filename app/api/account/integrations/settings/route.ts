import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateIntegrationConnections } from '@/lib/integration-health';
import { getUserIntegrationSettings } from '@/lib/user-integrations';

export const runtime = 'nodejs';

function checked(formData: FormData, key: string) {
  return formData.get(key) === 'on';
}

function normalizeIntent(value: FormDataEntryValue | null) {
  const raw = String(value || 'save');
  if (raw === 'test-shopify' || raw === 'test-woocommerce' || raw === 'save') return raw;
  return 'save';
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  const formData = await req.formData();
  const intent = normalizeIntent(formData.get('intent'));
  const shopifyStoreDomain = String(formData.get('shopifyStoreDomain') || '').trim();
  const woocommerceStoreUrl = String(formData.get('woocommerceStoreUrl') || '').trim();
  const current = await getUserIntegrationSettings(user.id);
  const validated = await validateIntegrationConnections({
    shopifyStoreDomain,
    woocommerceStoreUrl,
    tiktokAdAccountId: '',
    metaBusinessId: '',
  });

  const nextChecks = intent === 'test-shopify'
    ? { shopify: validated.shopify, woocommerce: current.connectionChecks.woocommerce }
    : intent === 'test-woocommerce'
      ? { shopify: current.connectionChecks.shopify, woocommerce: validated.woocommerce }
      : { shopify: validated.shopify, woocommerce: validated.woocommerce };

  const { error } = await supabaseAdmin.from('user_integration_settings').upsert({
    user_id: user.id,
    shopify_enabled: checked(formData, 'shopifyEnabled'),
    woocommerce_enabled: checked(formData, 'woocommerceEnabled'),
    amazon_enabled: checked(formData, 'amazonEnabled'),
    ebay_enabled: checked(formData, 'ebayEnabled'),
    allegro_enabled: checked(formData, 'allegroEnabled'),
    shopify_store_domain: shopifyStoreDomain,
    woocommerce_store_url: woocommerceStoreUrl,
    sync_inventory: checked(formData, 'syncInventory'),
    sync_orders: checked(formData, 'syncOrders'),
    sync_pricing: checked(formData, 'syncPricing'),
    connection_checks: nextChecks,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.redirect(new URL('/account/connections?error=1', req.url));
  }

  const nextUrl = new URL('/account/connections', req.url);
  if (intent === 'save') {
    nextUrl.searchParams.set('saved', '1');
  } else {
    nextUrl.searchParams.set('tested', intent === 'test-shopify' ? 'shopify' : 'woocommerce');
  }

  return NextResponse.redirect(nextUrl);
}