import { PLANS, type PlanKey } from '@/lib/plans';

export function getDynamicPlanQuote(params: {
  planKey: PlanKey;
  score?: number;
  confidence?: number;
  dynamicPricingEnabled?: boolean;
  premiumAnnualDiscountPercent?: number;
  highIntentBoostPercent?: number;
}) {
  const plan = PLANS[params.planKey];
  const basePrice = Number(plan.priceLabel.replace(/[^0-9.]/g, '') || 0);
  const isHighIntent = (params.score || 0) >= 80 || (params.confidence || 0) >= 75;
  const boostPercent = params.dynamicPricingEnabled && isHighIntent ? (params.highIntentBoostPercent || 0) : 0;
  const monthlyQuote = Math.round(basePrice * (1 + boostPercent / 100) * 100) / 100;
  const annualDiscountPercent = params.premiumAnnualDiscountPercent || 0;
  const annualQuote = Math.round(monthlyQuote * 12 * (1 - annualDiscountPercent / 100) * 100) / 100;

  return {
    planKey: plan.key,
    basePrice,
    monthlyQuote,
    annualQuote,
    annualDiscountPercent,
    isHighIntent,
    priceMode: params.dynamicPricingEnabled ? 'dynamic' : 'static',
  };
}
