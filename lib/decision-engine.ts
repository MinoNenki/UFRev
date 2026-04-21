import type { PlanKey } from '@/lib/plans';

export type DecisionVerdict = 'BUY' | 'TEST' | 'AVOID';
export type DataMode = 'manual_only' | 'manual_plus_evidence' | 'connector_ready';

export type DecisionFactor = {
  key: string;
  label: string;
  score: number;
  weight: number;
  impact: 'positive' | 'neutral' | 'negative';
  explanation: string;
};

export type RiskGuardrails = {
  minMarginPercent: number;
  minConfidenceForBuy: number;
  maxSafeTestBudgetUsd: number;
  requireCompetitorEvidenceForBuy: boolean;
  requireUrlForBuy: boolean;
  requireManualApprovalForScale: boolean;
  killSwitchEnabled: boolean;
  maxDailySpendUsd: number;
  maxAllowedRefundRatePercent: number;
  maxAllowedCACPercentOfAOV: number;
  cooldownHoursAfterLoss: number;
  stagedRolloutPercent: number;
  stagedRolloutMaxWaves: number;
};

export type DecisionInput = {
  price: number;
  cost?: number;
  demand: number;
  competition: number;
  adBudget?: number;
  competitorAvgPrice?: number;
  marketMonthlyUnits?: number;
  analysisType?: string;
  targetMarket?: string;
  salesChannel?: string;
  websiteUrl?: string;
  competitorUrls?: string;
  content?: string;
  displayCurrency?: string | null;
  uploadedImageCount?: number;
  uploadedFileCount?: number;
  guardrails?: Partial<RiskGuardrails>;
};

export type DecisionResult = {
  score: number;
  profitability: number;
  verdict: DecisionVerdict;
  confidence: number;
  confidenceLabel: 'Low' | 'Medium' | 'High';
  moatScore: number;
  burnRisk: 'Low' | 'Medium' | 'High';
  executionMode: 'safe_test' | 'manual_review' | 'scale_ready' | 'blocked';
  killSwitchArmed: boolean;
  dataMode: DataMode;
  why: string[];
  issues: string[];
  improvements: string[];
  factors: DecisionFactor[];
  marketSignals: string[];
  guardrailsTriggered: string[];
  capitalProtection: string[];
  rolloutPlan: string[];
  revenuePlaybook: string[];
  market: {
    competitorAvgPrice: number | null;
    marketMonthlyUnits: number | null;
    estimatedMonthlyRevenue: number | null;
    estimatedMonthlyTurnoverRange: { low: number | null; high: number | null };
    sources?: {
      ownPrice?: 'manual' | 'public_page' | 'estimated' | null;
      competitorAvgPrice?: 'manual' | 'public_page' | 'estimated' | null;
      marketMonthlyUnits?: 'manual' | 'public_page' | 'estimated' | null;
    };
    displayCurrency?: string | null;
  };
  adStrategy: {
    primaryChannel: string;
    testBudget: number;
    dailyBudget: number;
    firstObjective: string;
    creativeAngle: string;
    nextStep: string;
  };
  pricing: {
    currentPrice: number;
    estimatedCost: number;
    currency?: string | null;
    marginPercent: number;
    breakEvenROAS: number | null;
    suggestedPriceMin: number | null;
    suggestedPriceMax: number | null;
    suggestedTestPrice: number | null;
  };
  monetization: {
    paywallMode: 'free_soft' | 'upsell_after_result' | 'premium_gate';
    recommendedPlan: Exclude<PlanKey, 'free'>;
    upsellReason: string;
    unlockCTA: string;
  };
};

export type OpportunityProfile = {
  opportunityWindow: 'open' | 'guarded' | 'closed';
  actionBias: 'accelerate' | 'validate' | 'protect';
  momentumScore: number;
  pricePowerScore: number;
  executionReadiness: number;
  headline: string;
};

export type MarketWatchProfile = {
  pricePosition: 'below_market' | 'near_market' | 'above_market' | 'unknown';
  priceDeltaPercent: number | null;
  demandProxy: 'strong' | 'moderate' | 'weak';
  saturationRisk: 'low' | 'medium' | 'high';
  pressureIndex: number;
  headline: string;
  alerts: string[];
  moves: string[];
};

const DEFAULT_GUARDRAILS: RiskGuardrails = {
  minMarginPercent: 22,
  minConfidenceForBuy: 60,
  maxSafeTestBudgetUsd: 800,
  requireCompetitorEvidenceForBuy: true,
  requireUrlForBuy: true,
  requireManualApprovalForScale: true,
  killSwitchEnabled: true,
  maxDailySpendUsd: 1500,
  maxAllowedRefundRatePercent: 8,
  maxAllowedCACPercentOfAOV: 35,
  cooldownHoursAfterLoss: 24,
  stagedRolloutPercent: 20,
  stagedRolloutMaxWaves: 3,
};

function clamp(value: number, min = 0, max = 100) {
  if (Number.isNaN(value) || !Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function round(value: number, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function estimateEvidenceStrength(input: DecisionInput) {
  let score = 18;
  if ((input.content || '').trim().length > 200) score += 14;
  if ((input.content || '').trim().length > 1000) score += 8;
  if ((input.websiteUrl || '').trim()) score += 14;
  if ((input.competitorUrls || '').trim()) score += 14;
  if ((input.uploadedFileCount || 0) > 0) score += 14;
  if ((input.uploadedImageCount || 0) > 0) score += 8;
  if ((input.salesChannel || '').trim()) score += 6;
  if ((input.targetMarket || '').trim()) score += 6;

  const normalized = clamp(score);
  let dataMode: DataMode = 'manual_only';
  if (normalized >= 55) dataMode = 'manual_plus_evidence';
  if ((input.salesChannel || '').toLowerCase().includes('shopify') || (input.salesChannel || '').toLowerCase().includes('amazon')) {
    dataMode = normalized >= 55 ? 'connector_ready' : 'manual_plus_evidence';
  }

  return { evidenceStrength: normalized, dataMode };
}

function analyzeMargin(price: number, cost: number) {
  if (price <= 0) {
    if (cost > 0) {
      return {
        marginPercent: 0,
        breakEvenROAS: null as number | null,
        suggestedPriceMin: round(cost / 0.78, 2),
        suggestedPriceMax: round(cost / 0.58, 2),
        suggestedTestPrice: round(cost / 0.68, 2),
      };
    }

    return {
      marginPercent: 0,
      breakEvenROAS: null as number | null,
      suggestedPriceMin: null,
      suggestedPriceMax: null,
      suggestedTestPrice: null,
    };
  }

  if (cost <= 0) {
    return {
      marginPercent: 0,
      breakEvenROAS: null as number | null,
      suggestedPriceMin: round(price * 0.98, 2),
      suggestedPriceMax: round(price * 1.12, 2),
      suggestedTestPrice: round(price * 1.05, 2),
    };
  }

  const marginPercent = ((price - cost) / price) * 100;

  if (cost >= price) {
    const floorMargin = 0.22;
    const testMargin = 0.32;
    const stretchMargin = 0.42;

    return {
      marginPercent: round(marginPercent, 1),
      breakEvenROAS: null as number | null,
      suggestedPriceMin: round(Math.max(cost / (1 - floorMargin), price * 1.05), 2),
      suggestedPriceMax: round(Math.max(cost / (1 - stretchMargin), price * 1.22), 2),
      suggestedTestPrice: round(Math.max(cost / (1 - testMargin), price * 1.12), 2),
    };
  }

  const breakEvenROAS = marginPercent > 0 ? round(100 / marginPercent, 2) : null;

  let suggestedMultiplier = 1;
  if (marginPercent < 20) suggestedMultiplier = 1.18;
  else if (marginPercent < 30) suggestedMultiplier = 1.12;
  else if (marginPercent > 55) suggestedMultiplier = 0.98;

  const suggestedTestPrice = round(price * suggestedMultiplier, 2);

  return {
    marginPercent: round(marginPercent, 1),
    breakEvenROAS,
    suggestedPriceMin: round(Math.max(cost * 1.45, price * 0.95), 2),
    suggestedPriceMax: round(Math.max(cost * 1.95, price * 1.2), 2),
    suggestedTestPrice,
  };
}

function getImpact(score: number): 'positive' | 'neutral' | 'negative' {
  if (score >= 67) return 'positive';
  if (score <= 44) return 'negative';
  return 'neutral';
}

export function calculateDecision(input: DecisionInput): DecisionResult {
  const guardrails: RiskGuardrails = { ...DEFAULT_GUARDRAILS, ...(input.guardrails || {}) };

  const price = Math.max(0, Number(input.price || 0));
  const cost = Math.max(0, Number(input.cost || 0));
  const demand = clamp(Number(input.demand || 0));
  const competition = clamp(Number(input.competition || 0));
  const adBudget = Math.max(0, Number(input.adBudget || 0));
  const competitorAvgPrice = Math.max(0, Number(input.competitorAvgPrice || 0));
  const marketMonthlyUnits = Math.max(0, Number(input.marketMonthlyUnits || 0));
  const margin = analyzeMargin(price, cost);
  const hasMarginData = price > 0 && cost > 0;
  const hasCostData = cost > 0;
  const { evidenceStrength, dataMode } = estimateEvidenceStrength(input);

  const hasCompetitorEvidence = !!(input.competitorUrls || '').trim() || competitorAvgPrice > 0;
  const hasUrlEvidence = !!(input.websiteUrl || '').trim();

  const marginScore = price <= 0
    ? 26
    : cost <= 0
      ? 28
      : price <= cost
        ? clamp(18 + margin.marginPercent, 0, 40)
        : clamp(margin.marginPercent * 1.45);

  const competitionScore = clamp(100 - competition);
  const budgetScore = adBudget <= 0 ? 38 : adBudget < 200 ? 48 : adBudget < 800 ? 66 : adBudget < 2500 ? 78 : 84;
  const evidenceScore = evidenceStrength;
  const positioningScore = clamp(
    40
    + (hasCompetitorEvidence ? 12 : 0)
    + (hasUrlEvidence ? 8 : 0)
    + ((input.content || '').toLowerCase().includes('bundle') ? 10 : 0)
    + ((input.content || '').toLowerCase().includes('guarantee') ? 8 : 0)
    + ((input.content || '').toLowerCase().includes('review') ? 6 : 0)
  );

  const weightedScore = round(
    demand * 0.24
    + competitionScore * 0.2
    + marginScore * 0.24
    + budgetScore * 0.1
    + evidenceScore * 0.1
    + positioningScore * 0.12
  );

  const moatScore = clamp(round(
    positioningScore * 0.42
    + evidenceScore * 0.18
    + competitionScore * 0.18
    + (marginScore > 60 ? 14 : 6)
  ));

  const profitability = clamp(round(
    margin.marginPercent * 0.62
    + demand * 0.18
    + competitionScore * 0.12
    + (budgetScore >= 66 ? 8 : 3)
  ));

  const estimatedMonthlyRevenue = marketMonthlyUnits > 0
    ? round(marketMonthlyUnits * (competitorAvgPrice > 0 ? competitorAvgPrice : price || 0), 0)
    : null;

  const estimatedMonthlyTurnoverRange = estimatedMonthlyRevenue
    ? { low: round(estimatedMonthlyRevenue * 0.7, 0), high: round(estimatedMonthlyRevenue * 1.3, 0) }
    : { low: null, high: null };

  const confidence = clamp(round(
    evidenceScore * 0.68
    + ((input.uploadedImageCount || 0) > 0 ? 6 : 0)
    + ((input.uploadedFileCount || 0) > 0 ? 8 : 0)
    + (hasCompetitorEvidence ? 6 : 0)
    + (hasUrlEvidence ? 6 : 0)
  ));

  let confidenceLabel: DecisionResult['confidenceLabel'] = 'Medium';
  if (confidence < 45) confidenceLabel = 'Low';
  if (confidence >= 70) confidenceLabel = 'High';

  const factors: DecisionFactor[] = [
    { key: 'demand', label: 'Demand', score: round(demand), weight: 24, impact: getImpact(demand), explanation: demand >= 70 ? 'Demand input supports stronger initial traction.' : demand <= 40 ? 'Demand looks weak and requires validation before scale.' : 'Demand is decent but still needs stronger evidence.' },
    { key: 'competition', label: 'Competitive gap', score: round(competitionScore), weight: 20, impact: getImpact(competitionScore), explanation: competitionScore >= 67 ? 'Competition pressure is manageable.' : competitionScore <= 44 ? 'Crowded market means harder CAC and weaker pricing power.' : 'Competition is moderate and requires clear differentiation.' },
    { key: 'margin', label: 'Unit economics', score: round(marginScore), weight: 24, impact: getImpact(marginScore), explanation: margin.marginPercent >= 45 ? 'Margin supports testing, creative iteration, and paid acquisition.' : margin.marginPercent <= 20 ? 'Margin is thin and can break under ads, refunds, or discounting.' : 'Margin is acceptable but should improve before aggressive scale.' },
    { key: 'positioning', label: 'Offer strength', score: round(positioningScore), weight: 12, impact: getImpact(positioningScore), explanation: positioningScore >= 67 ? 'Your offer already shows signs of differentiation.' : positioningScore <= 44 ? 'Offer lacks strong reasons to win against alternatives.' : 'Offer is workable, but messaging is not yet a moat.' },
    { key: 'evidence', label: 'Evidence quality', score: round(evidenceScore), weight: 10, impact: getImpact(evidenceScore), explanation: evidenceScore >= 67 ? 'Decision is backed by meaningful context, files, or URLs.' : evidenceScore <= 44 ? 'Analysis is relying too much on manual input without proof.' : 'There is some evidence, but more market proof would improve accuracy.' },
    { key: 'budget', label: 'Testing power', score: round(budgetScore), weight: 10, impact: getImpact(budgetScore), explanation: budgetScore >= 67 ? 'Budget is large enough for controlled testing.' : budgetScore <= 44 ? 'Budget may be too small for clean validation.' : 'Budget is enough for basic testing, not large-scale certainty.' },
  ];

  let score = clamp(weightedScore);
  if (confidence < 35) score = clamp(score - 6);
  if (hasMarginData && margin.marginPercent < 18) score = clamp(score - 10);
  if (demand > 75 && competition < 45 && hasMarginData && margin.marginPercent > 35) score = clamp(score + 6);

  const guardrailsTriggered: string[] = [];
  const capitalProtection: string[] = [
    `Keep initial test budget at or below $${guardrails.maxSafeTestBudgetUsd}.`,
    `Never exceed daily spend cap of $${guardrails.maxDailySpendUsd} without manual review.`,
    `Pause scaling if refund rate rises above ${guardrails.maxAllowedRefundRatePercent}%.`,
    `Pause scaling if CAC exceeds ${guardrails.maxAllowedCACPercentOfAOV}% of AOV.`,
    'Do not scale unless conversion rate, CAC trend, and refund risk are stable.',
    'Protect cash by testing price before increasing ad spend.',
  ];
  const rolloutPlan: string[] = [
    `Wave 1: launch at ${guardrails.stagedRolloutPercent}% of intended scale budget.`,
    `Wave 2: only continue if CAC, margin, and refund signals stay within guardrails.`,
    `Maximum rollout waves before full scale: ${guardrails.stagedRolloutMaxWaves}.`,
  ];
  const revenuePlaybook: string[] = [
    'Use strong results to trigger premium gate or Growth/Scale upsell.',
    'Use medium results to sell more analyses, credit packs, and guided iteration.',
    'Use weak results to monetize via ads, referrals, and low-cost reactivation.',
  ];

  if (hasMarginData && margin.marginPercent < guardrails.minMarginPercent) {
    guardrailsTriggered.push(`Margin below guardrail (${guardrails.minMarginPercent}%).`);
  }
  if (confidence < guardrails.minConfidenceForBuy) {
    guardrailsTriggered.push(`Confidence below BUY threshold (${guardrails.minConfidenceForBuy}).`);
  }
  if (guardrails.requireCompetitorEvidenceForBuy && !hasCompetitorEvidence) {
    guardrailsTriggered.push('Competitor evidence missing for BUY verdict.');
  }
  if (guardrails.requireUrlForBuy && !hasUrlEvidence) {
    guardrailsTriggered.push('Offer URL missing for BUY verdict.');
  }
  if (adBudget > guardrails.maxSafeTestBudgetUsd) {
    guardrailsTriggered.push(`Ad budget exceeds safe test cap ($${guardrails.maxSafeTestBudgetUsd}).`);
    capitalProtection.push('Budget should be staged in waves, not deployed all at once.');
  }
  if (adBudget > guardrails.maxDailySpendUsd) {
    guardrailsTriggered.push(`Daily spend exceeds hard cap ($${guardrails.maxDailySpendUsd}).`);
  }

  let verdict: DecisionVerdict = 'TEST';
  if (score >= 78 && confidence >= 52) verdict = 'BUY';
  if (score <= 46 || (hasMarginData && margin.marginPercent < 12)) verdict = 'AVOID';

  if (verdict === 'BUY' && guardrailsTriggered.length) {
    verdict = 'TEST';
  }

  let burnRisk: DecisionResult['burnRisk'] = 'Medium';
  if ((hasMarginData && margin.marginPercent < 18) || competition > 75 || adBudget > guardrails.maxSafeTestBudgetUsd) burnRisk = 'High';
  else if (hasMarginData && margin.marginPercent >= 30 && confidence >= 60 && competition < 60) burnRisk = 'Low';

  let executionMode: DecisionResult['executionMode'] = 'safe_test';
  const killSwitchArmed = Boolean(guardrails.killSwitchEnabled);
  if (verdict === 'AVOID') executionMode = 'blocked';
  else if (verdict === 'BUY' && !guardrails.requireManualApprovalForScale) executionMode = 'scale_ready';
  else if (verdict === 'BUY' && guardrails.requireManualApprovalForScale) executionMode = 'manual_review';
  else if (guardrailsTriggered.length >= 2) executionMode = 'manual_review';
  if (killSwitchArmed && (burnRisk === 'High' || adBudget > guardrails.maxDailySpendUsd)) executionMode = 'blocked';

  const issues: string[] = [];
  const improvements: string[] = [];
  const why: string[] = [];
  const marketSignals: string[] = [];

  if (demand >= 70) {
    why.push('Demand input is strong enough to justify structured product testing.');
    marketSignals.push('Demand signal is favorable based on your scoring input.');
  } else {
    issues.push('Demand signal is not yet strong enough for confident scale.');
    improvements.push('Validate demand with a short test campaign or marketplace research before committing inventory.');
  }

  if (competition >= 75) {
    issues.push('Competition pressure is high, which weakens pricing power and increases CAC risk.');
    improvements.push('Add a stronger moat: bundle, guarantee, unique angle, before/after proof, or niche targeting.');
  } else {
    marketSignals.push('Competition appears manageable for testing.');
  }

  if (!hasCostData) {
    issues.push('Cost input is missing, so margin is still unverified.');
    improvements.push('Add landed cost, shipping, fees, and VAT before trusting the profit estimate.');
  }

  if (!price) {
    issues.push('Sell price is not fixed yet, so unit economics are still only a scenario estimate.');
    improvements.push('Compare current Polish sell or rental rates before committing more inventory.');
  }

  if (hasMarginData && margin.marginPercent < guardrails.minMarginPercent) {
    issues.push('Margin buffer is below your protected profitability guardrail.');
    improvements.push(`Raise price or reduce landed cost until margin clears at least ${guardrails.minMarginPercent}%.`);
  } else if (hasMarginData) {
    why.push(`Unit economics are healthier with an estimated margin of ${margin.marginPercent}%.`);
  }

  if (confidence < 50) {
    issues.push('Confidence is limited because the model has too little supporting evidence.');
    improvements.push('Add competitor URLs, product page URLs, files, screenshots, and stronger customer research to increase confidence.');
  } else {
    why.push(`Confidence is ${confidenceLabel.toLowerCase()} because the analysis includes supporting evidence beyond raw manual inputs.`);
  }

  if (competitorAvgPrice > 0) marketSignals.push(`Average competitor sell price is estimated at $${round(competitorAvgPrice, 2)}.`);
  if (marketMonthlyUnits > 0) marketSignals.push(`Estimated market turnover volume is about ${round(marketMonthlyUnits, 0)} units per month.`);
  if (hasUrlEvidence) marketSignals.push('A direct product URL was provided, which improves offer-level analysis.');
  if (hasCompetitorEvidence) marketSignals.push('Competitor references were provided, allowing better positioning logic.');
  if ((input.uploadedFileCount || 0) > 0 || (input.uploadedImageCount || 0) > 0) marketSignals.push('Uploaded files and visuals improve context depth for the AI layer.');
  if (!marketSignals.length) marketSignals.push('No external market evidence was attached, so this is still a manual-input-heavy estimate.');

  improvements.push('Show “why this product wins” above the fold in the offer and tighten the first-screen USP.');
  improvements.push('Run at least two pricing tests and one bundle or bonus variant.');
  improvements.push('Track conversion, CAC, and refund signals before increasing ad spend.');

  if (issues.length === 0) issues.push('No critical red flags detected, but execution quality will still decide the outcome.');
  if (guardrailsTriggered.length) {
    issues.push('Capital-protection guardrails were triggered, so scale should remain restricted.');
    why.push('The engine protected the verdict from overconfidence to reduce burn risk.');
  }
  if (killSwitchArmed && (burnRisk === 'High' || adBudget > guardrails.maxDailySpendUsd)) {
    issues.push('Kill switch is armed and has blocked unsafe scaling conditions.');
    why.push('Hard anti-loss protection was applied before scale to avoid budget burn.');
  }

  const recommendedPlan: DecisionResult['monetization']['recommendedPlan'] = score >= 82 ? 'scale' : score >= 60 ? 'pro' : 'starter';
  const paywallMode: DecisionResult['monetization']['paywallMode'] = score >= 75 || confidence >= 65 ? 'premium_gate' : score >= 55 ? 'upsell_after_result' : 'free_soft';
  if (verdict === 'BUY' && confidence >= 70) revenuePlaybook.unshift('Push annual plan, deep-dive report, and guarded automation as the primary CTA.');
  if (verdict === 'TEST') revenuePlaybook.unshift('Offer Starter/Growth plus extra credits for controlled retests.');
  if (verdict === 'AVOID') revenuePlaybook.unshift('Keep the user active with referrals, ads, watchlists, and new product discovery.');

  const adStrategyChannel = (input.salesChannel || '').trim() || 'Meta / TikTok';
  const safeTestBudget = Math.min(adBudget || guardrails.maxSafeTestBudgetUsd, guardrails.maxSafeTestBudgetUsd);
  const adStrategy = {
    primaryChannel: adStrategyChannel,
    testBudget: round(safeTestBudget || 0, 0),
    dailyBudget: round(Math.max(20, Math.min((safeTestBudget || 90) / 7, 120)), 0),
    firstObjective: verdict === 'BUY' ? 'Conversion test with two creatives and one strong offer angle.' : verdict === 'TEST' ? 'Click-through and add-to-cart validation before scaling.' : 'Audience and message validation with minimal spend only.',
    creativeAngle: moatScore >= 60 ? 'Show the product advantage fast and compare against weaker alternatives.' : 'Lead with one clear pain point, one proof point, and one direct offer.',
    nextStep: verdict === 'BUY' ? 'Run 2 ad creatives, 1 bundle test, and review CAC after 3 days.' : verdict === 'TEST' ? 'Run a small 3-day test and compare CTR, CPC, and early conversion quality.' : 'Do not scale ads yet. Improve offer, price, or proof first.',
  };

  const upsellReason = confidence < 50
    ? 'Unlock deeper competitor intelligence and richer evidence-backed analysis.'
    : verdict === 'BUY'
      ? 'This is a high-potential product, so premium monitoring and guarded scaling are valuable.'
      : 'Use premium analysis to iterate faster and reduce false positives.';
  const unlockCTA = paywallMode === 'premium_gate'
    ? 'Unlock deep-dive analysis + guarded automation'
    : paywallMode === 'upsell_after_result'
      ? 'Upgrade for richer verdict details'
      : 'Keep testing with more credits';

  return {
    score,
    profitability,
    verdict,
    confidence,
    confidenceLabel,
    moatScore,
    burnRisk,
    executionMode,
    killSwitchArmed,
    dataMode,
    why,
    issues: Array.from(new Set(issues)).slice(0, 7),
    improvements: Array.from(new Set(improvements)).slice(0, 7),
    factors,
    marketSignals: Array.from(new Set(marketSignals)).slice(0, 6),
    guardrailsTriggered: Array.from(new Set(guardrailsTriggered)).slice(0, 6),
    capitalProtection: Array.from(new Set(capitalProtection)).slice(0, 7),
    rolloutPlan: Array.from(new Set(rolloutPlan)).slice(0, 5),
    revenuePlaybook: Array.from(new Set(revenuePlaybook)).slice(0, 5),
    market: {
      competitorAvgPrice: competitorAvgPrice > 0 ? round(competitorAvgPrice, 2) : null,
      marketMonthlyUnits: marketMonthlyUnits > 0 ? round(marketMonthlyUnits, 0) : null,
      estimatedMonthlyRevenue,
      estimatedMonthlyTurnoverRange,
      displayCurrency: input.displayCurrency || 'USD',
    },
    adStrategy,
    pricing: {
      currentPrice: round(price, 2),
      estimatedCost: round(cost, 2),
      currency: input.displayCurrency || 'USD',
      marginPercent: margin.marginPercent,
      breakEvenROAS: margin.breakEvenROAS,
      suggestedPriceMin: margin.suggestedPriceMin,
      suggestedPriceMax: margin.suggestedPriceMax,
      suggestedTestPrice: margin.suggestedTestPrice,
    },
    monetization: {
      paywallMode,
      recommendedPlan,
      upsellReason,
      unlockCTA,
    },
  };
}

export function deriveOpportunityProfile(
  result: Pick<DecisionResult, 'score' | 'confidence' | 'burnRisk' | 'verdict' | 'executionMode' | 'moatScore' | 'pricing' | 'market'>
): OpportunityProfile {
  const margin = Number(result.pricing?.marginPercent || 0);
  const currentPrice = Number(result.pricing?.currentPrice || 0);
  const competitorAvg = Number(result.market?.competitorAvgPrice || 0);
  const revenueSignal = Number(result.market?.estimatedMonthlyRevenue || 0);

  const momentumScore = clamp(round(
    Number(result.score || 0) * 0.5
    + Number(result.confidence || 0) * 0.2
    + Number(result.moatScore || 0) * 0.3
  ));

  const pricePowerScore = clamp(round(
    Math.max(0, margin) * 0.75
    + Number(result.moatScore || 0) * 0.3
    + (competitorAvg > 0 && currentPrice > 0 && currentPrice <= competitorAvg ? 12 : 0)
    + (revenueSignal > 0 ? 6 : 0)
  ));

  const executionReadiness = clamp(round(
    Number(result.confidence || 0) * 0.45
    + Number(result.score || 0) * 0.25
    + (result.burnRisk === 'Low' ? 16 : result.burnRisk === 'Medium' ? 6 : -16)
    + (result.executionMode === 'scale_ready' ? 12 : result.executionMode === 'safe_test' ? 8 : result.executionMode === 'manual_review' ? 0 : -22)
  ));

  let opportunityWindow: OpportunityProfile['opportunityWindow'] = 'guarded';
  let actionBias: OpportunityProfile['actionBias'] = 'validate';
  let headline = 'Do not scale this blind - validate with a controlled test first.';

  if (
    result.verdict === 'BUY'
    && result.burnRisk === 'Low'
    && executionReadiness >= 68
    && pricePowerScore >= 52
  ) {
    opportunityWindow = 'open';
    actionBias = 'accelerate';
    headline = 'Momentum is real - scale carefully while the pricing window is still open.';
  } else if (
    result.verdict === 'AVOID'
    || result.executionMode === 'blocked'
    || result.burnRisk === 'High'
    || margin < 15
  ) {
    opportunityWindow = 'closed';
    actionBias = 'protect';
    headline = 'Do not push harder yet - the market window is not safe enough to scale.';
  }

  return {
    opportunityWindow,
    actionBias,
    momentumScore,
    pricePowerScore,
    executionReadiness,
    headline,
  };
}

export function deriveMarketWatch(
  result: Pick<DecisionResult, 'score' | 'confidence' | 'burnRisk' | 'moatScore' | 'pricing' | 'market' | 'factors'>
): MarketWatchProfile {
  const currentPrice = Number(result.pricing?.currentPrice || 0);
  const competitorAvg = Number(result.market?.competitorAvgPrice || 0);
  const marketUnits = Number(result.market?.marketMonthlyUnits || 0);
  const margin = Number(result.pricing?.marginPercent || 0);
  const competitionGap = Number(result.factors?.find((factor) => factor.key === 'competition')?.score || 50);

  const priceDeltaPercent = competitorAvg > 0 && currentPrice > 0
    ? round(((currentPrice - competitorAvg) / competitorAvg) * 100, 1)
    : null;

  const pricePosition: MarketWatchProfile['pricePosition'] = priceDeltaPercent == null
    ? 'unknown'
    : priceDeltaPercent <= -6
      ? 'below_market'
      : priceDeltaPercent >= 8
        ? 'above_market'
        : 'near_market';

  const demandProxy: MarketWatchProfile['demandProxy'] = marketUnits >= 1500 || Number(result.score || 0) >= 78
    ? 'strong'
    : marketUnits >= 700 || Number(result.score || 0) >= 58
      ? 'moderate'
      : 'weak';

  const saturationRisk: MarketWatchProfile['saturationRisk'] = result.burnRisk === 'High' || competitionGap <= 40
    ? 'high'
    : result.burnRisk === 'Medium' || competitionGap <= 62
      ? 'medium'
      : 'low';

  const pressureIndex = clamp(round(
    (100 - competitionGap) * 0.38
    + (result.burnRisk === 'High' ? 22 : result.burnRisk === 'Medium' ? 10 : 0)
    + (pricePosition === 'above_market' ? 18 : pricePosition === 'near_market' ? 8 : 0)
    + (demandProxy === 'weak' ? 14 : demandProxy === 'moderate' ? 6 : 0)
    + (margin < 20 ? 12 : 0)
    - Number(result.moatScore || 0) * 0.12
  ));

  const alerts: string[] = [];
  const moves: string[] = [];

  if (pricePosition === 'below_market') {
    alerts.push(`You are priced about ${Math.abs(priceDeltaPercent || 0)}% below the competitor average.`);
    if (margin >= 25 && demandProxy !== 'weak') {
      moves.push('Test a 3-8% price increase while keeping the same offer stack.');
    } else {
      moves.push('Use the lower price as a CTR hook, but protect margin before scaling spend.');
    }
  } else if (pricePosition === 'above_market') {
    alerts.push(`You are priced about ${priceDeltaPercent}% above the competitor average.`);
    moves.push('Defend the higher price with a clearer moat, guarantee, bundle, or proof block.');
  } else if (pricePosition === 'near_market') {
    alerts.push('Your current price is close to the market average, so positioning and proof will decide conversion.');
    moves.push('Focus on offer framing, reviews, and angle testing to win without discounting.');
  } else {
    alerts.push('No reliable competitor price benchmark is available yet.');
    moves.push('Add competitor URLs or market data to sharpen the pricing readout.');
  }

  if (demandProxy === 'strong') {
    alerts.push('Demand proxy looks strong enough for a controlled acquisition test.');
  } else if (demandProxy === 'weak') {
    alerts.push('Demand proxy is still weak, so the market window may be narrow.');
    moves.push('Validate demand with small-budget creative tests before inventory or scale decisions.');
  }

  if (saturationRisk === 'high') {
    alerts.push('Competition saturation is high, which increases CAC pressure and false-positive risk.');
    moves.push('Go niche-first or improve the moat before increasing spend.');
  } else if (saturationRisk === 'low') {
    alerts.push('Competition pressure looks manageable relative to the current offer strength.');
  }

  let headline = 'Watch the market closely before you spend more.';
  if (pricePosition === 'below_market' && demandProxy === 'strong' && saturationRisk !== 'high') {
    headline = 'You may have room to lift price without killing conversion.';
  } else if (pricePosition === 'above_market' && saturationRisk === 'high') {
    headline = 'The market is pushing back - protect conversion before defending a premium price.';
  } else if (demandProxy === 'weak') {
    headline = 'Demand is too soft right now to justify scale.';
  }

  return {
    pricePosition,
    priceDeltaPercent,
    demandProxy,
    saturationRisk,
    pressureIndex,
    headline,
    alerts: Array.from(new Set(alerts)).slice(0, 4),
    moves: Array.from(new Set(moves)).slice(0, 4),
  };
}