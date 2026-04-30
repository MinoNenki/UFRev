export type PlanKey = 'free' | 'starter' | 'pro' | 'scale';
export type LegacyPlanKey = 'starter19' | 'growth49' | 'scale99' | 'command149';
export type AnyPlanKey = PlanKey | LegacyPlanKey;
export type CreditPackKey = 'pack9' | 'pack19' | 'pack39';

const matchesStripeReference = (configuredRef: string | undefined, priceId: string | null | undefined, productId?: string | null) => {
  if (!configuredRef) return false;
  return configuredRef === priceId || configuredRef === productId;
};

export const BILLING_UNIT_LABEL = 'AI tokens';
export const BILLING_UNIT_LABEL_SINGULAR = 'AI token';

export const LEGACY_PLAN_ALIASES: Record<LegacyPlanKey, PlanKey> = {
  starter19: 'starter',
  growth49: 'pro',
  scale99: 'scale',
  command149: 'scale',
};

export const PLANS = {
  free: { key: 'free', name: 'Free', audience: 'Pierwsze testy i szybka walidacja', priceLabel: '$0', monthlyCredits: 2, monthlyAnalyses: 2, featured: false, description: 'Dla osób, które chcą szybko sprawdzić pojedynczy produkt, koszt albo pomysł zanim wydadzą pierwsze pieniądze.', bullets: ['2 AI tokens / month', '2 protected analyses / month', 'Historia analiz', 'Ścieżka przejścia do Starter, Pro lub Scale'] },
  starter: { key: 'starter', name: 'Starter', audience: 'Oszczędny start dla userów, side-hustle i małych sklepów', priceLabel: '$19', monthlyCredits: 24, monthlyAnalyses: 24, featured: false, description: 'Budżetowy plan dla klientów indywidualnych, początkujących sklepów, dropshippingu i małych startupów, które chcą regularnie sprawdzać decyzje bez dużego abonamentu.', bullets: ['24 AI tokens / month', 'Analizy produktów, ofert, faktur i screenów', 'Lepszy balans ceny do liczby sprawdzeń', 'Dobry pierwszy płatny krok przed Pro'] },
  pro: { key: 'pro', name: 'Pro', audience: 'Sklepy, startupy i operatorzy działający co tydzień', priceLabel: '$59', monthlyCredits: 90, monthlyAnalyses: 90, featured: true, description: 'Główny plan dla osób i firm, które regularnie testują produkty, pilnują marży i chcą szybciej podejmować decyzje zakupowe, reklamowe i kosztowe.', bullets: ['90 AI tokens / month', 'Decision engine + AI recommendations', 'Workspace do regularnej pracy', 'Najlepszy balans dla tygodniowej walidacji i wzrostu'] },
  scale: { key: 'scale', name: 'Scale', audience: 'Firmy, zespoły i większe operacje e-commerce', priceLabel: '$149', monthlyCredits: 240, monthlyAnalyses: 240, featured: false, description: 'Warstwa premium dla firm i zespołów, które potrzebują market watch, alertów, większej pojemności oraz szerszej kontroli nad ruchem, reklamą i sourcingiem.', bullets: ['240 AI tokens / month', 'Live market watch', 'Alert routing and heavier workflows', 'Najlepsze dla firm, startupów i zespołów operacyjnych'] },
} as const;

export const CREDIT_PACKS = {
  pack9: { key: 'pack9', name: 'Micro Pack', audience: 'Szybkie doładowanie', priceLabel: '$9', credits: 10, stripePriceEnv: 'STRIPE_PRICE_PACK_9', description: 'Mały pakiet dla osób, które chcą zrobić kilka dodatkowych sprawdzeń bez wchodzenia od razu w wyższy abonament.', bullets: ['10 one-time AI tokens', 'No subscription', 'Dobry na pilne sprawdzenie produktu lub faktury'] },
  pack19: { key: 'pack19', name: 'Flex Pack', audience: 'Najpraktyczniejsze doładowanie', priceLabel: '$19', credits: 28, stripePriceEnv: 'STRIPE_PRICE_PACK_19', description: 'Rozsądny pakiet dla użytkowników i sklepów, które chwilowo potrzebują więcej analiz, ale chcą pilnować budżetu.', bullets: ['28 one-time AI tokens', 'Dobry punkt wejścia po Free', 'Mocny upsell dla użytkowników przed subskrypcją'] },
  pack39: { key: 'pack39', name: 'Pro Pack', audience: 'Sprint kampanii lub launch', priceLabel: '$39', credits: 80, stripePriceEnv: 'STRIPE_PRICE_PACK_39', description: 'Większy pakiet na intensywny tydzień pracy, start kampanii, porównania dostawców albo cięższe dokumenty i multimedia.', bullets: ['80 one-time AI tokens', 'Najlepsza ekonomia dużego pakietu', 'Dobre przed większym skalowaniem'] },
} as const;

export const USAGE_TOKEN_RULES = [
  { key: 'text', title: 'Text, URL, short prompt', tokens: '1 token', note: 'Best for quick market, pricing, or idea validation.' },
  { key: 'image', title: 'Image / screenshot / basic file', tokens: '1-2 tokens', note: 'Single visual jobs stay low-friction and competitive.' },
  { key: 'pdf', title: 'PDF / document / spreadsheet', tokens: '2-4 tokens', note: 'Larger or denser files consume more protected capacity.' },
  { key: 'video', title: 'Video analysis', tokens: '4-8 tokens', note: 'Pricing scales with file size because video is materially heavier to process.' },
  { key: 'multi', title: 'Multi-file due diligence', tokens: '3-8 tokens', note: 'Complex jobs are weighted to protect margins and keep the model sustainable.' },
] as const;

export function estimateAnalysisTokenCost(params: {
  contentLength?: number;
  uploadedImageCount?: number;
  uploadedFiles?: Array<{ name?: string | null; size?: number | null; type?: string | null }>;
  analysisMode?: string | null;
}) {
  const files = params.uploadedFiles || [];
  const totalBytes = files.reduce((sum, file) => sum + Number(file.size || 0), 0);
  const fileCount = files.length;
  const imageCount = Number(params.uploadedImageCount || 0);
  const contentLength = Number(params.contentLength || 0);

  const hasVideo = files.some((file) => {
    const name = String(file.name || '').toLowerCase();
    const type = String(file.type || '').toLowerCase();
    return type.startsWith('video/') || /\.(mp4|mov|webm|m4v|avi)$/i.test(name);
  });
  const hasPdf = files.some((file) => /\.pdf$/i.test(String(file.name || '')));
  const hasDocument = files.some((file) => /\.(txt|md|csv|json|html|htm|xml)$/i.test(String(file.name || '')));

  let cost = 1;

  if (hasPdf || hasDocument || params.analysisMode === 'document_analysis') {
    cost = Math.max(cost, 2);
  }

  if (imageCount >= 3) cost += 1;
  if (fileCount >= 3) cost += 1;
  if (contentLength > 7000) cost += 1;
  if (!hasVideo && totalBytes > 2 * 1024 * 1024) cost += 1;
  if (!hasVideo && totalBytes > 6 * 1024 * 1024) cost += 1;

  if (hasVideo) {
    cost = 4;
    if (totalBytes > 8 * 1024 * 1024) cost = 6;
    if (totalBytes > 14 * 1024 * 1024) cost = 8;
    if (fileCount > 1 || contentLength > 5000) cost += 1;
  }

  return Math.max(1, Math.min(cost, 8));
}

export const PLAN_ORDER = [PLANS.free, PLANS.starter, PLANS.pro, PLANS.scale] as const;
export const CREDIT_PACK_ORDER = [CREDIT_PACKS.pack9, CREDIT_PACKS.pack19, CREDIT_PACKS.pack39] as const;

export function normalizePlanKey(planKey: string | null | undefined): PlanKey {
  if (planKey === 'starter' || planKey === 'pro' || planKey === 'scale' || planKey === 'free') return planKey;
  if (planKey === 'starter19' || planKey === 'growth49' || planKey === 'scale99' || planKey === 'command149') {
    return LEGACY_PLAN_ALIASES[planKey];
  }

  return 'free';
}

export const getPlanDisplayName = (planKey: string | null | undefined) => {
  const normalized = normalizePlanKey(planKey);
  const match = PLAN_ORDER.find((plan) => plan.key === normalized);
  return match?.name || PLANS.free.name;
};

export const getPlanByStripePriceId = (priceId: string | null | undefined, productId?: string | null): PlanKey | null => {
  if (!priceId && !productId) return null;
  if (matchesStripeReference(process.env.STRIPE_PRICE_STARTER, priceId, productId) || matchesStripeReference(process.env.STRIPE_PRICE_STARTER_19, priceId, productId)) return 'starter';
  if (matchesStripeReference(process.env.STRIPE_PRICE_PRO, priceId, productId) || matchesStripeReference(process.env.STRIPE_PRICE_GROWTH_49, priceId, productId)) return 'pro';
  if (matchesStripeReference(process.env.STRIPE_PRICE_SCALE, priceId, productId) || matchesStripeReference(process.env.STRIPE_PRICE_SCALE_99, priceId, productId) || matchesStripeReference(process.env.STRIPE_PRICE_COMMAND_149, priceId, productId)) return 'scale';
  return null;
};

export const getStripePriceIdForPlan = (planKey: string | null | undefined) => {
  const normalized = normalizePlanKey(planKey);

  if (normalized === 'starter') {
    return process.env.STRIPE_PRICE_STARTER || process.env.STRIPE_PRICE_STARTER_19 || null;
  }

  if (normalized === 'pro') {
    return process.env.STRIPE_PRICE_PRO || process.env.STRIPE_PRICE_GROWTH_49 || null;
  }

  if (normalized === 'scale') {
    return process.env.STRIPE_PRICE_SCALE || process.env.STRIPE_PRICE_SCALE_99 || process.env.STRIPE_PRICE_COMMAND_149 || null;
  }

  return null;
};

export const getCreditPackByStripePriceId = (priceId: string | null | undefined, productId?: string | null): CreditPackKey | null => {
  if (!priceId && !productId) return null;
  if (matchesStripeReference(process.env.STRIPE_PRICE_PACK_9, priceId, productId)) return 'pack9';
  if (matchesStripeReference(process.env.STRIPE_PRICE_PACK_19, priceId, productId)) return 'pack19';
  if (matchesStripeReference(process.env.STRIPE_PRICE_PACK_39, priceId, productId)) return 'pack39';
  return null;
};
