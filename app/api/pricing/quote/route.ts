import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getPricingSettings } from '@/lib/growth-config';
import { getDynamicPlanQuote } from '@/lib/pricing-engine';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planKey, score, confidence } = await req.json();
  const settings = await getPricingSettings();
  const quote = getDynamicPlanQuote({
    planKey,
    score,
    confidence,
    dynamicPricingEnabled: settings.dynamicPricingEnabled,
    premiumAnnualDiscountPercent: settings.premiumAnnualDiscountPercent,
    highIntentBoostPercent: settings.highIntentBoostPercent,
  });

  await supabaseAdmin.from('pricing_experiments').insert({
    user_id: user.id,
    plan_key: quote.planKey,
    variant: quote.priceMode,
    monthly_quote: quote.monthlyQuote,
    annual_quote: quote.annualQuote,
    metadata: { score, confidence, is_high_intent: quote.isHighIntent },
  });

  return NextResponse.json({ success: true, quote });
}
