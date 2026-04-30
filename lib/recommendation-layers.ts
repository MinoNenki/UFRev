import { convertCurrency, normalizeCurrencyCode, type SupportedCurrency } from '@/lib/currency';
import { fetchPublicPageData, type MarketDataSummary, type ScrapedPageData } from '@/lib/market-data';
import type { Language } from '@/lib/i18n';
import { searchMarketplaceOffers } from '@/lib/marketplace-adapters';

export type SourcingOffer = {
  title: string;
  url: string;
  platform: string;
  price: number | null;
  currency: string | null;
  reviewCount: number | null;
  rating: number | null;
  risk: 'low' | 'medium' | 'high';
  whyItFits: string;
  sourceType: 'primary' | 'competitor' | 'research' | 'connector';
};

export type ProductSourcingLayer = {
  shortlistTitle: string;
  recommendedOffers: SourcingOffer[];
  notes: string[];
  recommendedNextStep: string;
};

export type ServiceSetupEquipment = {
  item: string;
  purpose: string;
  priority: 'starter' | 'scale';
  estimatedCost: number | null;
};

export type ServiceCapexBucket = {
  label: string;
  low: number | null;
  high: number | null;
  note: string;
};

export type ServicePricePackage = {
  name: string;
  target: string;
  priceFrom: number | null;
  priceTo: number | null;
  note: string;
};

export type ServiceSetupLayer = {
  primaryLane: string;
  secondaryLane: string | null;
  laneReason: string;
  equipment: ServiceSetupEquipment[];
  capexBuckets: ServiceCapexBucket[];
  pricePackages: ServicePricePackage[];
  starterSteps: string[];
  benchmarkLinks: string[];
  riskNotes: string[];
};

type MarketSummaryWithResearch = MarketDataSummary & {
  resaleResearchUrls: string[];
  rentalResearchUrls: string[];
};

function uniqUrls(urls: string[]) {
  return Array.from(new Set(urls.filter(Boolean)));
}

function hostnameLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return url;
  }
}

function localized(params: { language: Language; pl: string; en: string }) {
  return params.language === 'pl' ? params.pl : params.en;
}

function scoreRisk(page: ScrapedPageData) {
  let score = 0;
  if (page.source === 'unavailable') score += 3;
  if (page.price == null) score += 1;
  if (page.reviewCount == null) score += 1;
  if (page.availability === 'out_of_stock') score += 1;

  if (score <= 1) return 'low' as const;
  if (score <= 3) return 'medium' as const;
  return 'high' as const;
}

function mapOffer(params: {
  page: ScrapedPageData;
  sourceType: 'primary' | 'competitor' | 'research';
  displayCurrency: SupportedCurrency;
  language: Language;
}) : SourcingOffer {
  const { page, sourceType, displayCurrency, language } = params;
  const convertedPrice = page.priceUsd != null ? convertCurrency(page.priceUsd, 'USD', displayCurrency) : page.price;
  const risk = scoreRisk(page);
  const whyItFits = sourceType === 'primary'
    ? localized({
        language,
        pl: 'To główny link wejściowy lub bezpośredni benchmark użytkownika, więc nadaje ton całej analizie.',
        en: 'This is the main user-provided offer or direct benchmark, so it anchors the whole analysis.',
      })
    : sourceType === 'competitor'
      ? localized({
          language,
          pl: 'To bezpośredni benchmark konkurencyjny do sprawdzenia ceny, proofu i pozycjonowania.',
          en: 'This is a direct competitor benchmark for pricing, proof, and positioning.',
        })
      : localized({
          language,
          pl: 'Ten link został znaleziony w live researchu rynku i może dać dodatkowe opcje sourcingu lub benchmarku.',
          en: 'This link was surfaced by live public market research and can expand sourcing or benchmarking options.',
        });

  return {
    title: page.title || hostnameLabel(page.url),
    url: page.url,
    platform: page.platform,
    price: convertedPrice != null && Number.isFinite(convertedPrice) ? Number(convertedPrice.toFixed(2)) : null,
    currency: displayCurrency,
    reviewCount: page.reviewCount,
    rating: null,
    risk,
    whyItFits,
    sourceType,
  };
}

function mapConnectorOffer(params: {
  offer: Awaited<ReturnType<typeof searchMarketplaceOffers>>[number];
  displayCurrency: SupportedCurrency;
  language: Language;
}) : SourcingOffer {
  const convertedPrice = params.offer.price != null && params.offer.currency
    ? convertCurrency(params.offer.price, normalizeCurrencyCode(params.offer.currency, 'USD'), params.displayCurrency)
    : params.offer.price;
  const risk = params.offer.sourceConfidence === 'high' && (params.offer.rating || params.offer.sellerScore || 0) >= 90
    ? 'low'
    : params.offer.sourceConfidence === 'low'
      ? 'high'
      : 'medium';

  return {
    title: params.offer.title,
    url: params.offer.url,
    platform: params.offer.provider,
    price: convertedPrice != null && Number.isFinite(convertedPrice) ? Number(convertedPrice.toFixed(2)) : null,
    currency: params.displayCurrency,
    reviewCount: params.offer.reviewCount,
    rating: params.offer.rating,
    risk,
    whyItFits: localized({
      language: params.language,
      pl: 'Ta oferta pochodzi bezpośrednio z aktywnego konektora marketplace i przeszła podstawowe filtrowanie anty-stratowe.',
      en: 'This offer comes directly from an active marketplace connector and passed the basic anti-loss filtering.',
    }),
    sourceType: 'connector',
  };
}

export async function buildProductSourcingLayer(params: {
  productName: string;
  marketData: MarketSummaryWithResearch;
  displayCurrency: SupportedCurrency;
  enabledIntegrationLanes: string[];
  country?: string;
  currentLanguage: Language;
}) : Promise<ProductSourcingLayer> {
  const { productName, marketData, displayCurrency, enabledIntegrationLanes, currentLanguage } = params;
  const researchUrls = uniqUrls((marketData.resaleResearchUrls || []).slice(0, 3));
  const connectorOffers = await searchMarketplaceOffers({
    query: productName || marketData.researchQuery || '',
    country: params.country || 'PL',
    maxResults: 5,
    enabledLanes: enabledIntegrationLanes,
  });
  const researchPages = await Promise.all(researchUrls.map((url) => fetchPublicPageData(url)));

  const candidates = [
    ...connectorOffers.map((offer) => mapConnectorOffer({ offer, displayCurrency, language: currentLanguage })),
    ...(marketData.product ? [mapOffer({ page: marketData.product, sourceType: 'primary', displayCurrency, language: currentLanguage })] : []),
    ...marketData.competitors.map((page) => mapOffer({ page, sourceType: 'competitor', displayCurrency, language: currentLanguage })),
    ...researchPages.map((page) => mapOffer({ page, sourceType: 'research', displayCurrency, language: currentLanguage })),
  ];

  const recommendedOffers = Array.from(new Map(candidates.map((item) => [item.url, item])).values())
    .sort((left, right) => {
      const riskRank = { low: 0, medium: 1, high: 2 };
      if (riskRank[left.risk] !== riskRank[right.risk]) return riskRank[left.risk] - riskRank[right.risk];
      if ((right.rating || 0) !== (left.rating || 0)) return (right.rating || 0) - (left.rating || 0);
      return (right.reviewCount || 0) - (left.reviewCount || 0);
    })
    .slice(0, 5);

  const notes = [
    enabledIntegrationLanes.length
      ? localized({
          language: currentLanguage,
          pl: `Aktywne kanały marketplace w panelu admina: ${enabledIntegrationLanes.join(', ')}.`,
          en: `Enabled marketplace lanes in admin: ${enabledIntegrationLanes.join(', ')}.`,
        })
      : localized({
          language: currentLanguage,
          pl: 'Żaden marketplace nie jest jeszcze aktywny w panelu admina, więc shortlista opiera się na danych publicznych i podanych linkach.',
          en: 'No marketplace lane is enabled in admin yet, so the shortlist relies on public signals and provided links.',
        }),
    localized({
      language: currentLanguage,
      pl: connectorOffers.length ? 'Shortlista zawiera też oferty z prawdziwych konektorów marketplace. Nadal obowiązuje kontrolowany test przed wejściem w większy zakup.' : 'To nie jest jeszcze pełny sourcing po oficjalnych API marketplace. To shortlista oparta o podane linki i live public research.',
      en: connectorOffers.length ? 'The shortlist already includes offers from real marketplace connectors. A controlled test is still required before any larger buy-in.' : 'This is not full official marketplace-API sourcing yet. It is a shortlist built from provided links and live public research.',
    }),
  ];

  return {
    shortlistTitle: localized({
      language: currentLanguage,
      pl: productName ? `Shortlista sourcingowa dla: ${productName}` : 'Shortlista sourcingowa',
      en: productName ? `Product sourcing shortlist for: ${productName}` : 'Product sourcing shortlist',
    }),
    recommendedOffers,
    notes,
    recommendedNextStep: localized({
      language: currentLanguage,
      pl: 'Porównaj 2-3 najbezpieczniejsze linki pod kątem ceny, proofu i dostępności, a dopiero potem buduj finalny wybór.',
      en: 'Compare the 2-3 safest links on price, proof, and availability before making the final sourcing choice.',
    }),
  };
}

function pickPrimaryServiceLane(input: string) {
  const text = input.toLowerCase();
  const scores = [
    {
      key: 'mobile_steam',
      label: 'Mobilna myjnia parowa / premium mobile cleaning',
      score: /parow|steam|mobiln|detailing|auto|samochod/.test(text) ? 3 : 0,
    },
    {
      key: 'truck_wash',
      label: 'Myjnia TIR / fleet wash',
      score: /tir|truck|fleet|ciężar|ciezar/.test(text) ? 3 : 0,
    },
    {
      key: 'facade_paving',
      label: 'Mycie elewacji / kostki / zewnętrzne czyszczenie',
      score: /elewac|kostk|brukow|fasad|pressure washing|zewn/.test(text) ? 3 : 0,
    },
  ].sort((left, right) => right.score - left.score);

  return {
    primary: scores[0]?.label || 'Mobilna usługa premium',
    secondary: scores[1]?.score ? scores[1].label : null,
    key: scores[0]?.key || 'mobile_steam',
  };
}

function convertPlnRange(low: number, high: number, currency: SupportedCurrency) {
  return {
    low: Number(convertCurrency(low, 'PLN', currency).toFixed(2)),
    high: Number(convertCurrency(high, 'PLN', currency).toFixed(2)),
  };
}

export function buildServiceSetupLayer(params: {
  content: string;
  competitorUrls: string;
  marketData: MarketSummaryWithResearch;
  displayCurrency: SupportedCurrency;
  selectedCountry: string;
  currentLanguage: Language;
}) : ServiceSetupLayer {
  const { content, competitorUrls, marketData, displayCurrency, selectedCountry, currentLanguage } = params;
  const lane = pickPrimaryServiceLane(content);
  const regionalNote = selectedCountry && selectedCountry !== 'PL'
    ? localized({
        language: currentLanguage,
        pl: `Widełki kosztów i pakietów przeliczono do ${displayCurrency}, ale przed startem trzeba jeszcze sprawdzić lokalne koszty pracy, paliwa i compliance dla ${selectedCountry}.`,
        en: `Cost and package bands were converted into ${displayCurrency}, but local labor, fuel, and compliance still need confirmation for ${selectedCountry}.`,
      })
    : localized({
        language: currentLanguage,
        pl: 'Widełki bazują na bezpiecznym starcie bez wchodzenia od razu we wszystkie nisze naraz.',
        en: 'The ranges assume a conservative starter launch instead of entering every lane at once.',
      });

  const starterMachine = lane.key === 'truck_wash' ? 18000 : lane.key === 'facade_paving' ? 14000 : 12000;
  const equipment: ServiceSetupEquipment[] = [
    {
      item: lane.key === 'truck_wash' ? 'Przemysłowa myjka gorącowodna / wysokowydajna' : lane.key === 'facade_paving' ? 'Przemysłowa myjka ciśnieniowa + surface cleaner' : 'Parownica / myjka premium mobile',
      purpose: localized({ language: currentLanguage, pl: 'Rdzeń usługi i główna przewaga jakościowa.', en: 'Core service machine and main quality edge.' }),
      priority: 'starter',
      estimatedCost: Number(convertCurrency(starterMachine, 'PLN', displayCurrency).toFixed(2)),
    },
    {
      item: localized({ language: currentLanguage, pl: 'Auto robocze / van / przyczepa', en: 'Work vehicle / van / trailer' }),
      purpose: localized({ language: currentLanguage, pl: 'Mobilność, dojazd i przewóz osprzętu.', en: 'Mobility, travel, and equipment transport.' }),
      priority: 'starter',
      estimatedCost: Number(convertCurrency(lane.key === 'truck_wash' ? 40000 : 25000, 'PLN', displayCurrency).toFixed(2)),
    },
    {
      item: localized({ language: currentLanguage, pl: 'Osprzęt, chemia, węże, pianownica, szczotki, BHP', en: 'Accessories, chemicals, hoses, foam cannon, brushes, HSE' }),
      purpose: localized({ language: currentLanguage, pl: 'Pakiet operacyjny potrzebny do wejścia bez przestojów.', en: 'Operating pack needed to launch without downtime.' }),
      priority: 'starter',
      estimatedCost: Number(convertCurrency(6500, 'PLN', displayCurrency).toFixed(2)),
    },
    {
      item: localized({ language: currentLanguage, pl: 'Dodatkowy zestaw do skali / druga ekipa', en: 'Scale-up kit / second crew pack' }),
      purpose: localized({ language: currentLanguage, pl: 'Rozszerzenie po pierwszych płatnych zleceniach.', en: 'Expansion after the first paid jobs.' }),
      priority: 'scale',
      estimatedCost: Number(convertCurrency(12000, 'PLN', displayCurrency).toFixed(2)),
    },
  ];

  const capexBase = lane.key === 'truck_wash'
    ? [
        { label: 'Core machine', low: 18000, high: 42000, note: 'Truck wash equipment and water performance.' },
        { label: 'Vehicle / mobility', low: 35000, high: 90000, note: 'Van, pickup, or trailer setup.' },
        { label: 'Chemicals / accessories', low: 4000, high: 12000, note: 'Nozzles, hoses, foam, brushes, PPE.' },
        { label: 'Branding / compliance / reserve', low: 5000, high: 15000, note: 'Logo, website, insurance, reserve, wastewater admin.' },
      ]
    : lane.key === 'facade_paving'
      ? [
          { label: 'Core machine', low: 14000, high: 28000, note: 'Pressure washer, surface cleaner, ladders or reach tools.' },
          { label: 'Vehicle / mobility', low: 25000, high: 65000, note: 'Van or trailer setup.' },
          { label: 'Chemicals / accessories', low: 5000, high: 12000, note: 'Chemicals, hoses, treatment kit, PPE.' },
          { label: 'Branding / compliance / reserve', low: 5000, high: 14000, note: 'Website, branding, safety reserve, insurance.' },
        ]
      : [
          { label: 'Core machine', low: 12000, high: 26000, note: 'Steam/mobile premium cleaning setup.' },
          { label: 'Vehicle / mobility', low: 22000, high: 60000, note: 'Van, small trailer, or mobile setup.' },
          { label: 'Chemicals / accessories', low: 4000, high: 10000, note: 'Vacuum, chemicals, hoses, detailing accessories.' },
          { label: 'Branding / compliance / reserve', low: 4000, high: 12000, note: 'Landing page, branding, insurance, reserve.' },
        ];

  const capexBuckets: ServiceCapexBucket[] = capexBase.map((bucket) => {
    const range = convertPlnRange(bucket.low, bucket.high, displayCurrency);
    return {
      label: bucket.label,
      low: range.low,
      high: range.high,
      note: currentLanguage === 'pl' ? bucket.note.replace('and ', 'i ') : bucket.note,
    };
  });

  const packagesPln = lane.key === 'truck_wash'
    ? [
        { name: 'Starter truck wash', target: '1 vehicle', from: 180, to: 320, note: 'Fast entry package for fleet leads.' },
        { name: 'Cab + trailer full clean', target: 'full set', from: 350, to: 650, note: 'Higher-ticket package with upsell room.' },
        { name: 'Fleet subscription', target: 'B2B recurring', from: 1200, to: 3500, note: 'Monthly recurring route contract.' },
      ]
    : lane.key === 'facade_paving'
      ? [
          { name: 'Mini exterior job', target: 'small entrance / small paving', from: 250, to: 600, note: 'Fast proof-of-demand package.' },
          { name: 'Facade / driveway standard', target: 'homeowner core package', from: 700, to: 1800, note: 'Main homeowner margin lane.' },
          { name: 'Premium restoration', target: 'large property / business', from: 2000, to: 6000, note: 'Scale package for commercial clients.' },
        ]
      : [
          { name: 'Mobile express', target: 'solo / private customer', from: 120, to: 220, note: 'Entry-level lead magnet.' },
          { name: 'Interior + steam premium', target: 'upsell core package', from: 220, to: 420, note: 'Higher-margin main package.' },
          { name: 'Fleet / recurring care', target: 'B2B recurring', from: 900, to: 2800, note: 'Subscription angle for stable monthly revenue.' },
        ];

  const pricePackages: ServicePricePackage[] = packagesPln.map((item) => ({
    name: item.name,
    target: item.target,
    priceFrom: Number(convertCurrency(item.from, 'PLN', displayCurrency).toFixed(2)),
    priceTo: Number(convertCurrency(item.to, 'PLN', displayCurrency).toFixed(2)),
    note: currentLanguage === 'pl' ? item.note.replace('lead magnet', 'magnes leadowy').replace('Higher-margin main package', 'główny pakiet o wyższej marży').replace('Subscription angle for stable monthly revenue', 'kąt abonamentowy pod stabilny przychód miesięczny') : item.note,
  }));

  return {
    primaryLane: lane.primary,
    secondaryLane: lane.secondary,
    laneReason: localized({
      language: currentLanguage,
      pl: `${lane.primary} wygląda na najlepszy pierwszy ruch, bo pozwala wejść w rynek z mniejszym CAPEX-em i szybciej zebrać proof niż uruchamianie wszystkich nisz naraz. ${regionalNote}`,
      en: `${lane.primary} looks like the best first move because it allows a lower-capex entry and faster proof than launching every service lane at once. ${regionalNote}`,
    }),
    equipment,
    capexBuckets,
    pricePackages,
    starterSteps: [
      localized({ language: currentLanguage, pl: 'Wybierz jedną niszę startową i jeden konkretny ICP klienta.', en: 'Pick one starter lane and one specific ICP first.' }),
      localized({ language: currentLanguage, pl: 'Zbuduj pakiet starter, pakiet premium i pakiet abonamentowy.', en: 'Build a starter package, premium package, and recurring package.' }),
      localized({ language: currentLanguage, pl: 'Zbierz 5-10 benchmarków cen i 20 pierwszych leadów w promieniu operacyjnym.', en: 'Collect 5-10 pricing benchmarks and 20 first leads inside the operating radius.' }),
      localized({ language: currentLanguage, pl: 'Uruchom mały test lokalny i sprawdź realny koszt pozyskania oraz czas obsługi.', en: 'Run a small local test and measure real acquisition cost plus service time.' }),
      localized({ language: currentLanguage, pl: 'Dopiero po pierwszych płatnych zleceniach rozważ wejście w drugą niszę.', en: 'Only after the first paid jobs should you consider expanding into the second lane.' }),
    ],
    benchmarkLinks: uniqUrls([
      ...competitorUrls.split(/\s+/).filter((item) => /^https?:\/\//.test(item)),
      ...(marketData.rentalResearchUrls || []),
      ...(marketData.resaleResearchUrls || []),
    ]).slice(0, 6),
    riskNotes: [
      localized({ language: currentLanguage, pl: 'Największe ryzyko to wejście jednocześnie w kilka modeli usługowych bez jednego ostrego pozycjonowania.', en: 'The biggest risk is launching several service models at once without one sharp positioning angle.' }),
      localized({ language: currentLanguage, pl: 'Nie licz pakietów cenowych bez bufora na dojazd, chemię, serwis i reklamacje.', en: 'Do not price packages without a buffer for travel, chemicals, servicing, and complaints.' }),
      regionalNote,
    ],
  };
}