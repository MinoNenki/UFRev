import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { CREDIT_PACKS, getStripePriceIdForPlan, normalizePlanKey, PLANS } from '@/lib/plans';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!stripe) return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { itemKey } = await req.json();
  const normalizedPlanKey = normalizePlanKey(itemKey);
  const subscriptionPlan = itemKey && normalizedPlanKey !== 'free' ? PLANS[normalizedPlanKey] : itemKey === 'free' ? PLANS.free : null;
  const creditPack = CREDIT_PACKS[itemKey as keyof typeof CREDIT_PACKS];
  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;

  if (subscriptionPlan && subscriptionPlan.key !== 'free') {
    const priceId = getStripePriceIdForPlan(subscriptionPlan.key);
    if (!priceId) return NextResponse.json({ error: 'Missing subscription price ID in env.' }, { status: 500 });
    const session = await stripe.checkout.sessions.create({ mode: 'subscription', customer_email: user.email || undefined, line_items: [{ price: priceId, quantity: 1 }], success_url: `${origin}/dashboard?success=1`, cancel_url: `${origin}/pricing?canceled=1`, metadata: { user_id: user.id, item_key: subscriptionPlan.key, item_type: 'subscription' } });
    await supabaseAdmin.from('monetization_events').insert({ user_id: user.id, event_type: 'checkout_intent', item_key: subscriptionPlan.key, item_type: 'subscription', metadata: { origin, session_id: session.id } });
    return NextResponse.json({ url: session.url });
  }

  if (creditPack?.stripePriceEnv) {
    const priceId = process.env[creditPack.stripePriceEnv];
    if (!priceId) return NextResponse.json({ error: 'Missing credit pack price ID in env.' }, { status: 500 });
    const session = await stripe.checkout.sessions.create({ mode: 'payment', customer_email: user.email || undefined, line_items: [{ price: priceId, quantity: 1 }], success_url: `${origin}/dashboard?creditsPurchased=1`, cancel_url: `${origin}/pricing?canceled=1`, metadata: { user_id: user.id, item_key: creditPack.key, item_type: 'pack' } });
    await supabaseAdmin.from('monetization_events').insert({ user_id: user.id, event_type: 'checkout_intent', item_key: creditPack.key, item_type: 'pack', metadata: { origin, session_id: session.id } });
    return NextResponse.json({ url: session.url });
  }

  return NextResponse.json({ error: 'Invalid product.' }, { status: 400 });
}
