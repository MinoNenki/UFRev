import { normalizeCurrencyCode, type SupportedCurrency, convertToUsd } from '@/lib/currency';

export type ScrapedPageData = {
  url: string;
  title: string | null;
  price: number | null;
  priceUsd: number | null;
  currency: SupportedCurrency | null;
  reviewCount: number | null;
  availability: 'in_stock' | 'out_of_stock' | 'unknown';
  platform: 'amazon' | 'shopify' | 'allegro' | 'alibaba' | 'aliexpress' | 'other';
  source: 'public_page' | 'unavailable';
};

export type MarketDataSummary = {
  product: ScrapedPageData | null;
  competitors: ScrapedPageData[];
  competitorAvgPrice: number | null;
  competitorAvgPriceUsd: number | null;
  marketMonthlyUnitsEstimate: number | null;
  demandScore: number | null;
  competitionScore: number | null;
  resaleSignalCount: number | null;
  rentalSignalCount: number | null;
  researchQuery: string | null;
  resaleResearchUrls: string[];
  rentalResearchUrls: string[];
  sourceNotes: string[];
};

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const WHOLESALE_SUPPLIER_PATTERN = /(alibaba\.com|aliexpress\.com|1688\.com|made-in-china\.com|globalsources\.com)/i;
const BLOCKED_MARKETPLACE_PATTERNS = [
  /nocaptcha/i,
  /captcha/i,
  /unusual traffic/i,
  /verify(?:\s+that)?\s+you(?:'| a)?re human/i,
  /slide\s+to\s+continue/i,
  /punishpage/i,
  /x5secdata/i,
];
const MARKET_QUERY_STOPWORDS = new Set([
  'and', 'the', 'for', 'with', 'from', 'theme', 'cartoon', 'animal', 'kids', 'kid', 'children', 'child', 'commercial',
  'inflatable', 'pvc', 'custom', 'new', 'sale', 'offer', 'product', 'house', 'castle', 'playground', 'bounce', 'lilytoys',
  'oraz', 'dla', 'oraz', 'dzieci', 'motyw', 'temat', 'produkt', 'oferta', 'sprzedaz', 'sprzedaż', 'wynajem', 'polska',
]);
const MARKET_QUERY_OVERRIDES = [
  { pattern: /bounce house|bouncy castle|inflatable castle|inflatable playground|chateau/i, replacement: 'dmuchaniec zamek dmuchany' },
  { pattern: /inflatable slide|water slide/i, replacement: 'dmuchana zjezdzalnia' },
  { pattern: /soft play|ball pit/i, replacement: 'suchy basen kulki' },
];

function clamp(value: number, min = 0, max = 100) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function buildMarketResearchSeed(value: string) {
  let normalized = decodeHtml(String(value || '').toLowerCase());
  for (const rule of MARKET_QUERY_OVERRIDES) {
    if (rule.pattern.test(normalized)) {
      normalized = `${rule.replacement} ${normalized}`;
    }
  }

  const tokens = normalized
    .split(/[^a-z0-9ąćęłńóśżź]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !MARKET_QUERY_STOPWORDS.has(token));

  return Array.from(new Set(tokens)).slice(0, 6).join(' ');
}

function decodeSearchResultUrl(rawUrl: string) {
  try {
    const withProtocol = rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
    const parsed = new URL(withProtocol, 'https://duckduckgo.com');
    const redirected = parsed.searchParams.get('uddg');
    return redirected ? decodeURIComponent(redirected) : parsed.toString();
  } catch {
    return rawUrl;
  }
}

function extractSearchResultUrls(html: string) {
  const matches = Array.from(html.matchAll(/<a[^>]+class=["'][^"']*result__a[^"']*["'][^>]+href=["']([^"']+)["']/gi));
  const urls = matches
    .map((match) => decodeSearchResultUrl(match[1] || ''))
    .filter((url) => /^https?:\/\//i.test(url));

  return Array.from(new Set(urls)).slice(0, 10);
}

async function fetchDuckDuckGoResultUrls(query: string) {
  if (!query.trim()) return [] as string[];

  try {
    const response = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'pl-PL,pl;q=0.9,en-US,en;q=0.8',
      },
      cache: 'no-store',
    });

    if (!response.ok) return [] as string[];
    const html = await response.text();
    return extractSearchResultUrls(html);
  } catch {
    return [] as string[];
  }
}

async function researchTargetMarket(params: { queryText?: string; selectedCountry?: string; includeRentalResearch?: boolean }) {
  const seed = buildMarketResearchSeed(params.queryText || '');
  if (!seed) {
    return null;
  }

  const marketLabel = String(params.selectedCountry || '').toUpperCase() === 'PL' ? 'Polska' : '';
  const resaleQuery = [seed, marketLabel, 'allegro olx sprzedajemy'].filter(Boolean).join(' ');
  const rentalQuery = params.includeRentalResearch ? [seed, marketLabel, 'wynajem wypożyczalnia event'].filter(Boolean).join(' ') : '';

  const [resaleUrls, rentalUrls] = await Promise.all([
    fetchDuckDuckGoResultUrls(resaleQuery),
    rentalQuery ? fetchDuckDuckGoResultUrls(rentalQuery) : Promise.resolve([] as string[]),
  ]);

  const resaleDomains = Array.from(new Set(resaleUrls.map((url) => {
    try {
      return new URL(url).hostname.replace(/^www\./i, '');
    } catch {
      return url;
    }
  })));
  const rentalDomains = Array.from(new Set(rentalUrls.map((url) => {
    try {
      return new URL(url).hostname.replace(/^www\./i, '');
    } catch {
      return url;
    }
  })));

  const demandScore = resaleUrls.length || rentalUrls.length
    ? clamp(20 + resaleUrls.length * 5 + rentalUrls.length * 8 + resaleDomains.length + rentalDomains.length, 18, 92)
    : null;
  const competitionScore = resaleUrls.length || rentalUrls.length
    ? clamp(16 + resaleUrls.length * 8 + rentalUrls.length * 6 + resaleDomains.length, 16, 94)
    : null;

  return {
    researchQuery: seed,
    resaleSignalCount: resaleUrls.length,
    rentalSignalCount: rentalUrls.length,
    resaleUrls: resaleUrls.slice(0, 5),
    rentalUrls: rentalUrls.slice(0, 5),
    demandScore,
    competitionScore,
    resaleSources: resaleDomains.slice(0, 5),
    rentalSources: rentalDomains.slice(0, 5),
  };
}

export function isWholesaleSupplierUrl(url: string) {
  return WHOLESALE_SUPPLIER_PATTERN.test(url || '');
}

export function detectBlockedMarketplacePage(html: string, url: string) {
  if (!isWholesaleSupplierUrl(url)) return false;
  const sample = String(html || '').slice(0, 12000).toLowerCase();
  return BLOCKED_MARKETPLACE_PATTERNS.some((pattern) => pattern.test(sample));
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function cleanNumber(raw: string): number | null {
  const trimmed = raw.replace(/\s/g, '').replace(/,/g, '.').replace(/[^0-9.]/g, '');
  if (!trimmed) return null;
  const parts = trimmed.split('.');
  const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : trimmed;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractTitle(html: string): string | null {
  const direct = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (direct?.[1]) return decodeHtml(direct[1]).trim().slice(0, 200);
  const og = html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  return og?.[1] ? decodeHtml(og[1]).trim().slice(0, 200) : null;
}

function detectPlatform(url: string): ScrapedPageData['platform'] {
  const lower = url.toLowerCase();
  if (lower.includes('amazon.')) return 'amazon';
  if (lower.includes('allegro.')) return 'allegro';
  if (lower.includes('alibaba.')) return 'alibaba';
  if (lower.includes('aliexpress.')) return 'aliexpress';
  if (lower.includes('myshopify.com') || lower.includes('/products/')) return 'shopify';
  return 'other';
}

function detectAvailability(html: string): ScrapedPageData['availability'] {
  const compact = html.toLowerCase();
  if (/out of stock|sold out|niedostępny|brak w magazynie|currently unavailable/.test(compact)) return 'out_of_stock';
  if (/in stock|available now|dodaj do koszyka|add to cart|kup teraz/.test(compact)) return 'in_stock';
  return 'unknown';
}

function inferCurrencyFromContext(html: string, url: string): SupportedCurrency | null {
  const compact = html.toLowerCase();
  const lowerUrl = url.toLowerCase();

  if (/zł|\bpln\b|cena\s*[0-9,.]+\s*zł/.test(compact) || /\.pl([/?#]|$)/.test(lowerUrl)) return 'PLN';
  if (/€|\beur\b/.test(compact)) return 'EUR';
  if (/£|\bgbp\b/.test(compact)) return 'GBP';
  if (/\$|\busd\b/.test(compact)) return 'USD';

  return null;
}

function extractJsonLdInfo(html: string): { price: number | null; currency: SupportedCurrency | null; reviewCount: number | null } {
  const scripts = Array.from(html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)).map((m) => m[1]);
  let price: number | null = null;
  let currency: SupportedCurrency | null = null;
  let reviewCount: number | null = null;

  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const offers = item?.offers ? (Array.isArray(item.offers) ? item.offers : [item.offers]) : [];
        for (const offer of offers) {
          if (price == null && offer?.price != null) price = cleanNumber(String(offer.price));
          if (!currency && offer?.priceCurrency) currency = normalizeCurrencyCode(String(offer.priceCurrency), 'USD');
        }
        const aggregate = item?.aggregateRating;
        if (reviewCount == null && aggregate?.reviewCount != null) reviewCount = cleanNumber(String(aggregate.reviewCount));
        if (reviewCount == null && aggregate?.ratingCount != null) reviewCount = cleanNumber(String(aggregate.ratingCount));
      }
    } catch {
      // ignore invalid json-ld
    }
  }

  return { price, currency, reviewCount };
}

function extractRegexPrice(html: string): { price: number | null; currency: SupportedCurrency | null } {
  const patterns: Array<{ regex: RegExp; priceIndex: number; currencyIndex?: number }> = [
    { regex: /"sale_price"\s*:\s*\{[\s\S]{0,120}?"amount"\s*:\s*"?([0-9]+(?:[\.,][0-9]{1,2})?)"?/i, priceIndex: 1 },
    { regex: /"retail_price"\s*:\s*\{[\s\S]{0,120}?"amount"\s*:\s*"?([0-9]+(?:[\.,][0-9]{1,2})?)"?/i, priceIndex: 1 },
    { regex: /"amountWithSymbol"\s*:\s*"([0-9]+(?:[\.,][0-9]{1,2})?)\s*(USD|EUR|PLN|GBP|ZŁ|ZL|[$€£])/i, priceIndex: 1, currencyIndex: 2 },
    { regex: /"price"\s*:\s*"?([0-9]+(?:[\.,][0-9]{1,2})?)"?/i, priceIndex: 1 },
    { regex: /itemprop=["']price["'][^>]*content=["']([0-9]+(?:[\.,][0-9]{1,2})?)["']/i, priceIndex: 1 },
    { regex: /priceToPay[^0-9]{0,40}([0-9]+(?:[\.,][0-9]{1,2})?)/i, priceIndex: 1 },
    { regex: /a-offscreen[^>]*>\s*([$€£])?\s*([0-9]+(?:[\.,][0-9]{1,2})?)/i, priceIndex: 2, currencyIndex: 1 },
    { regex: /([0-9]+(?:[\.,][0-9]{1,2})?)\s?(USD|EUR|PLN|GBP|ZŁ|ZL)\b/i, priceIndex: 1, currencyIndex: 2 },
    { regex: /([$€£])\s*([0-9]+(?:[\.,][0-9]{1,2})?)/i, priceIndex: 2, currencyIndex: 1 },
  ];

  for (const entry of patterns) {
    const match = html.match(entry.regex);
    if (!match) continue;
    const price = cleanNumber(match[entry.priceIndex] || '');
    if (price == null) continue;
    const currency = entry.currencyIndex ? normalizeCurrencyCode(match[entry.currencyIndex] || 'USD', 'USD') : null;
    return { price, currency };
  }

  return { price: null, currency: null };
}

function extractReviewCount(html: string): number | null {
  const patterns = [
    /"reviewCount"\s*:\s*"?([0-9,.]+)"?/i,
    /"ratingCount"\s*:\s*"?([0-9,.]+)"?/i,
    /([0-9,.]+)\s+ratings?/i,
    /([0-9,.]+)\s+reviews?/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;
    const parsed = cleanNumber(match[1]);
    if (parsed != null) return parsed;
  }
  return null;
}

export function extractUrlList(value: string) {
  return value
    .split(/[\n,\s]+/)
    .map((item) => item.trim())
    .filter((item) => /^https?:\/\//i.test(item));
}

export async function fetchPublicPageData(url: string): Promise<ScrapedPageData> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, {
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'pl-PL,pl;q=0.9,en-US,en;q=0.8',
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { url, title: null, price: null, priceUsd: null, currency: null, reviewCount: null, availability: 'unknown', platform: detectPlatform(url), source: 'unavailable' };
    }

    const html = await response.text();
    if (detectBlockedMarketplacePage(html, url)) {
      return { url, title: null, price: null, priceUsd: null, currency: null, reviewCount: null, availability: 'unknown', platform: detectPlatform(url), source: 'unavailable' };
    }

    const title = extractTitle(html);
    const jsonLd = extractJsonLdInfo(html);
    const regexPrice = extractRegexPrice(html);
    const price = jsonLd.price ?? regexPrice.price;
    const currency = jsonLd.currency ?? regexPrice.currency ?? inferCurrencyFromContext(html, url);
    const reviewCount = jsonLd.reviewCount ?? extractReviewCount(html);
    const availability = detectAvailability(html);
    const priceUsd = price != null && currency ? convertToUsd(price, currency) : null;

    return { url, title, price, priceUsd, currency, reviewCount, availability, platform: detectPlatform(url), source: 'public_page' };
  } catch {
    return { url, title: null, price: null, priceUsd: null, currency: null, reviewCount: null, availability: 'unknown', platform: detectPlatform(url), source: 'unavailable' };
  }
}

function average(values: number[]) {
  if (!values.length) return null;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

export async function collectMarketData(params: { websiteUrl?: string; competitorUrls?: string; queryText?: string; selectedCountry?: string; includeRentalResearch?: boolean }) : Promise<MarketDataSummary> {
  const websiteUrl = params.websiteUrl?.trim() || '';
  const competitorUrls = extractUrlList(params.competitorUrls || '').slice(0, 3);

  const shouldRunLiveResearch = Boolean((params.queryText || '').trim()) && (
    String(params.selectedCountry || '').toUpperCase() === 'PL'
    || isWholesaleSupplierUrl(websiteUrl)
    || !competitorUrls.length
    || Boolean(params.includeRentalResearch)
  );

  const [product, competitors, research] = await Promise.all([
    websiteUrl ? fetchPublicPageData(websiteUrl) : Promise.resolve(null),
    Promise.all(competitorUrls.map((url) => fetchPublicPageData(url))),
    shouldRunLiveResearch
      ? researchTargetMarket({ queryText: params.queryText, selectedCountry: params.selectedCountry, includeRentalResearch: params.includeRentalResearch })
      : Promise.resolve(null),
  ]);

  const competitorPricesUsd = competitors.map((item) => item.priceUsd).filter((value): value is number => value != null && value > 0);
  const competitorAvgPriceUsd = average(competitorPricesUsd);
  const competitorAvgPrice = competitors.length && competitorAvgPriceUsd != null
    ? average(competitors.map((item) => item.price ?? item.priceUsd).filter((value): value is number => value != null && value > 0))
    : null;
  const reviewCounts = [product?.reviewCount ?? null, ...competitors.map((item) => item.reviewCount)]
    .filter((value): value is number => value != null && value > 0);

  const marketMonthlyUnitsEstimate = reviewCounts.length ? Math.max(0, Math.round(reviewCounts.reduce((a, b) => a + b, 0) / reviewCounts.length)) : null;

  const sourceNotes: string[] = [];
  if (product?.title) sourceNotes.push(`Offer title detected from the public page: ${product.title}.`);
  if (product?.price) sourceNotes.push(`Public ${product.platform} page price detected for the main offer: ${product.price}${product.currency ? ` ${product.currency}` : ''}.`);
  if (product?.availability === 'out_of_stock') sourceNotes.push('Main public product page currently looks out of stock or unavailable.');
  if (competitorAvgPriceUsd) sourceNotes.push(`Average competitor price estimated from ${competitorPricesUsd.length} public page(s): ${competitorAvgPriceUsd} USD normalized.`);
  if (marketMonthlyUnitsEstimate) sourceNotes.push(`Market activity proxy detected from public review/rating counts: about ${marketMonthlyUnitsEstimate}.`);
  if (research?.resaleSignalCount) sourceNotes.push(`Live public resale search found ${research.resaleSignalCount} signal(s) across ${research.resaleSources.join(', ')}.`);
  if (research?.rentalSignalCount) sourceNotes.push(`Live public rental search found ${research.rentalSignalCount} signal(s) across ${research.rentalSources.join(', ')}.`);
  if (research?.resaleUrls?.length) sourceNotes.push(`Top resale research links: ${research.resaleUrls.slice(0, 3).join(', ')}.`);
  if (research?.rentalUrls?.length) sourceNotes.push(`Top rental/service research links: ${research.rentalUrls.slice(0, 3).join(', ')}.`);
  if (research?.demandScore != null) sourceNotes.push(`Demand score was derived from live public search evidence: ${research.demandScore}/100.`);
  if (research?.competitionScore != null) sourceNotes.push(`Competition score was derived from live public search evidence: ${research.competitionScore}/100.`);
  if (websiteUrl && product?.source === 'unavailable' && isWholesaleSupplierUrl(websiteUrl)) {
    sourceNotes.push('The supplier marketplace page looks protected by captcha or unusual-traffic checks, so automatic price and title extraction was limited. Add manual landed cost, MOQ, shipping, or a screenshot/PDF for a more accurate result.');
  }
  if ((websiteUrl && isWholesaleSupplierUrl(websiteUrl)) || competitorUrls.some((url) => isWholesaleSupplierUrl(url))) {
    sourceNotes.push('Supplier links like Alibaba or AliExpress show sourcing context, not direct proof of retail demand. Validate demand using Allegro/Amazon/local competitor listings, review counts, and price gaps.');
  }
  if (!sourceNotes.length && (websiteUrl || competitorUrls.length)) sourceNotes.push('Public links were provided, but no reliable price signal could be extracted from the pages.');

  return {
    product,
    competitors,
    competitorAvgPrice,
    competitorAvgPriceUsd,
    marketMonthlyUnitsEstimate,
    demandScore: research?.demandScore ?? null,
    competitionScore: research?.competitionScore ?? null,
    resaleSignalCount: research?.resaleSignalCount ?? null,
    rentalSignalCount: research?.rentalSignalCount ?? null,
    researchQuery: research?.researchQuery ?? null,
    resaleResearchUrls: research?.resaleUrls ?? [],
    rentalResearchUrls: research?.rentalUrls ?? [],
    sourceNotes,
  };
}
