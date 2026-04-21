type ChurnInput = {
  daysSinceLastAnalysis: number;
  analysesLast30d: number;
  planKey?: string;
  creditsBalance?: number;
};

export function calculateChurnRisk(input: ChurnInput) {
  let score = 0.1;
  if (input.daysSinceLastAnalysis >= 14) score += 0.35;
  else if (input.daysSinceLastAnalysis >= 7) score += 0.2;

  if (input.analysesLast30d <= 1) score += 0.25;
  else if (input.analysesLast30d <= 3) score += 0.12;

  if ((input.planKey || 'free') === 'free') score += 0.08;
  if ((input.creditsBalance || 0) <= 0) score += 0.1;

  const churnRisk = Math.max(0, Math.min(1, Math.round(score * 100) / 100));
  const segment = churnRisk >= 0.65 ? 'high' : churnRisk >= 0.4 ? 'medium' : 'low';

  return {
    churnRisk,
    segment,
    actions: segment === 'high'
      ? ['Offer win-back credits', 'Send retention message', 'Show discount CTA']
      : segment === 'medium'
        ? ['Show in-app reminder', 'Surface new use cases', 'Offer guided retest']
        : ['Promote upgrade', 'Promote referral', 'Promote advanced features'],
  };
}
