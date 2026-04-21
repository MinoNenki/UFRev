export function getPersonalizationSuggestions(params: {
  latestScore?: number;
  latestVerdict?: string;
  analysesCount?: number;
  planKey?: string;
}) {
  const suggestions: string[] = [];
  if ((params.latestVerdict || '') === 'BUY') suggestions.push('Offer automation and premium monitoring.');
  if ((params.latestVerdict || '') === 'TEST') suggestions.push('Offer a guided retest and credit pack.');
  if ((params.latestVerdict || '') === 'AVOID') suggestions.push('Recommend a new product search flow and educational content.');
  if ((params.analysesCount || 0) >= 5) suggestions.push('Promote Growth or Scale plan.');
  if ((params.planKey || 'free') === 'free') suggestions.push('Show premium-gate CTA and referral loop.');
  if (!suggestions.length) suggestions.push('Encourage first analysis and onboarding completion.');
  return suggestions.slice(0, 4);
}
