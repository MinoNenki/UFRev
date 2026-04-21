import type { ProMarketDataSummary } from '@/lib/market-connectors';
import type { Language } from '@/lib/i18n';
import { supabaseAdmin } from '@/lib/supabase-admin';

export type StoredMarketWatchEventRow = {
  source_url: string | null;
  competitor_url: string | null;
  price: number | string | null;
  price_usd: number | string | null;
  currency: string | null;
  availability: string | null;
  title: string | null;
  review_count: number | null;
  alert_level?: string | null;
  change_summary?: string | null;
  created_at: string;
};

export type MarketWatchSnapshot = {
  url: string;
  role: 'primary' | 'competitor';
  title: string | null;
  price: number | null;
  priceUsd: number | null;
  currency: string | null;
  availability: 'in_stock' | 'out_of_stock' | 'unknown';
  reviewCount: number | null;
  capturedAt?: string | null;
};

export type MarketWatchReport = {
  status: 'opportunity' | 'watch' | 'risk';
  headline: string;
  summary: string;
  strongestMove: string;
  changed: boolean;
  alerts: string[];
  opportunities: string[];
  records: MarketWatchSnapshot[];
};

export type StoredMarketWatchlistRow = {
  id: string;
  user_id: string;
  label: string | null;
  website_url: string;
  competitor_urls: unknown;
  status: string | null;
  updated_at?: string | null;
};

export type WeeklyMarketDigest = {
  title: string;
  summary: string;
  highlights: string[];
  status: 'opportunity' | 'watch' | 'risk';
};

function isPolish(language?: Language) {
  return language === 'pl';
}

function marketWatchText(language: Language | undefined, values: { en: string; pl: string }) {
  return isPolish(language) ? values.pl : values.en;
}

function round(value: number, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function diffPercent(current: number | null, previous: number | null) {
  if (current == null || previous == null || previous <= 0) return null;
  return round(((current - previous) / previous) * 100, 1);
}

function hostLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return url;
  }
}

function normalizeAvailability(value: string | null | undefined): MarketWatchSnapshot['availability'] {
  return value === 'in_stock' || value === 'out_of_stock' ? value : 'unknown';
}

function latestPreviousSnapshot(rows: StoredMarketWatchEventRow[], url: string) {
  return rows.find((row) => row.competitor_url === url || row.source_url === url) || null;
}

export function buildMarketWatchReport(params: {
  marketData: ProMarketDataSummary;
  previousSnapshots?: StoredMarketWatchEventRow[];
  language?: Language;
}): MarketWatchReport {
  const previousSnapshots = params.previousSnapshots || [];
  const language = params.language;
  const records: MarketWatchSnapshot[] = [
    ...(params.marketData.product ? [{
      url: params.marketData.product.url,
      role: 'primary' as const,
      title: params.marketData.product.title,
      price: params.marketData.product.price,
      priceUsd: params.marketData.product.priceUsd,
      currency: params.marketData.product.currency,
      availability: params.marketData.product.availability,
      reviewCount: params.marketData.product.reviewCount,
    }] : []),
    ...params.marketData.competitors.map((item) => ({
      url: item.url,
      role: 'competitor' as const,
      title: item.title,
      price: item.price,
      priceUsd: item.priceUsd,
      currency: item.currency,
      availability: item.availability,
      reviewCount: item.reviewCount,
    })),
  ];

  const alerts: string[] = [];
  const opportunities: string[] = [];
  let changed = false;

  for (const record of records) {
    const previous = latestPreviousSnapshot(previousSnapshots, record.url);
    const currentPrice = typeof record.priceUsd === 'number' ? record.priceUsd : (typeof record.price === 'number' ? record.price : null);
    const previousPrice = previous ? (Number(previous.price_usd || previous.price || 0) || null) : null;
    const delta = diffPercent(currentPrice, previousPrice);
    const previousAvailability = normalizeAvailability(previous?.availability);
    const label = hostLabel(record.url);

    if (delta != null && Math.abs(delta) >= 3) {
      changed = true;
      if (delta <= -5) {
        alerts.push(marketWatchText(language, {
          en: `${label} dropped price by ${Math.abs(delta)}% since the last scan.`,
          pl: `${label} obniżył cenę o ${Math.abs(delta)}% względem poprzedniego skanu.`,
        }));
      } else if (delta >= 5) {
        opportunities.push(marketWatchText(language, {
          en: `${label} raised price by ${delta}%, which may open room for your next price test.`,
          pl: `${label} podniósł cenę o ${delta}%, więc możesz mieć miejsce na kolejny test ceny.`,
        }));
      }
    }

    if (previousAvailability !== 'out_of_stock' && record.availability === 'out_of_stock') {
      changed = true;
      if (record.role === 'competitor') {
        opportunities.push(marketWatchText(language, {
          en: `${label} looks out of stock right now, which can open a short-term demand window.`,
          pl: `${label} wygląda teraz na niedostępny, co może otwierać krótkie okno popytu.`,
        }));
      } else {
        alerts.push(marketWatchText(language, {
          en: 'Your tracked offer looks out of stock, so the current market window cannot be captured cleanly.',
          pl: 'Twoja obserwowana oferta wygląda na niedostępną, więc obecnego okna rynkowego nie da się dobrze wykorzystać.',
        }));
      }
    }
  }

  const product = params.marketData.product;
  const competitorAvg = params.marketData.competitorAvgPriceUsd;
  if (product?.priceUsd != null && competitorAvg != null && competitorAvg > 0) {
    const productDelta = diffPercent(product.priceUsd, competitorAvg);
    if (productDelta != null && productDelta <= -6) {
      opportunities.push(marketWatchText(language, {
        en: `Your tracked price sits about ${Math.abs(productDelta)}% below the public competitor average.`,
        pl: `Twoja obserwowana cena jest około ${Math.abs(productDelta)}% niższa od publicznej średniej konkurencji.`,
      }));
    } else if (productDelta != null && productDelta >= 8) {
      alerts.push(marketWatchText(language, {
        en: `Your tracked price is about ${productDelta}% above the public competitor average.`,
        pl: `Twoja obserwowana cena jest około ${productDelta}% wyższa od publicznej średniej konkurencji.`,
      }));
    }
  }

  if ((params.marketData.marketMonthlyUnitsEstimate || 0) >= 1400) {
    opportunities.push(marketWatchText(language, {
      en: 'Public demand proxy still looks strong based on marketplace activity signals.',
      pl: 'Sygnały aktywności marketplace nadal wskazują na mocny publiczny popyt.',
    }));
  } else if ((params.marketData.marketMonthlyUnitsEstimate || 0) > 0 && (params.marketData.marketMonthlyUnitsEstimate || 0) < 500) {
    alerts.push(marketWatchText(language, {
      en: 'Demand proxy is relatively soft, so the market may need a tighter niche or stronger creative angle.',
      pl: 'Sygnał popytu jest dość miękki, więc rynek może wymagać węższej niszy albo mocniejszego kąta komunikacji.',
    }));
  }

  const riskSignalCount = alerts.length;
  const opportunitySignalCount = opportunities.length;
  const status: MarketWatchReport['status'] = riskSignalCount >= 2
    ? 'risk'
    : opportunitySignalCount > riskSignalCount
      ? 'opportunity'
      : 'watch';

  const headline = status === 'opportunity'
    ? marketWatchText(language, {
        en: 'The market is opening up - there may be room to move faster or test a price lift.',
        pl: 'Rynek się otwiera - może pojawiać się przestrzeń na szybszy ruch albo test podwyżki ceny.',
      })
    : status === 'risk'
      ? marketWatchText(language, {
          en: 'The market is pushing back - protect conversion and margin before scaling.',
          pl: 'Rynek stawia opór - chroń konwersję i marżę zanim wejdziesz w skalę.',
        })
      : marketWatchText(language, {
          en: 'The market is stable for now, but keep watching competitor moves closely.',
          pl: 'Rynek jest na razie stabilny, ale obserwuj ruchy konkurencji bardzo uważnie.',
        });

  const summary = changed
    ? marketWatchText(language, {
        en: 'A live competitor change or availability shift was detected versus the last saved scan.',
        pl: 'Wykryto zmianę po stronie konkurencji albo dostępności względem ostatniego zapisanego skanu.',
      })
    : marketWatchText(language, {
        en: 'No major change was detected versus the last saved scan, so the market looks stable for now.',
        pl: 'Nie wykryto dużej zmiany względem ostatniego zapisanego skanu, więc rynek wygląda obecnie stabilnie.',
      });

  const strongestMove = opportunities[0]
    || alerts[0]
    || marketWatchText(language, {
      en: 'Keep scanning the same URLs to build a stronger live history of competitor moves.',
      pl: 'Skanuj te same URL-e dalej, aby zbudować mocniejszą historię ruchów konkurencji.',
    });

  return {
    status,
    headline,
    summary,
    strongestMove,
    changed,
    alerts: Array.from(new Set(alerts)).slice(0, 5),
    opportunities: Array.from(new Set(opportunities)).slice(0, 5),
    records,
  };
}

export async function getRecentMarketWatchSnapshots(userId: string, urls: string[]) {
  const normalizedUrls = new Set(urls.filter(Boolean));
  if (!normalizedUrls.size) return [] as StoredMarketWatchEventRow[];

  try {
    const { data, error } = await supabaseAdmin
      .from('market_watch_events')
      .select('source_url, competitor_url, price, price_usd, currency, availability, title, review_count, alert_level, change_summary, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(80);

    if (error || !Array.isArray(data)) return [];

    return data.filter((row: any) => normalizedUrls.has(String(row.source_url || '')) || normalizedUrls.has(String(row.competitor_url || '')));
  } catch {
    return [];
  }
}

export async function getRecentMarketWatchDigest(userId: string, limit = 12) {
  try {
    const { data, error } = await supabaseAdmin
      .from('market_watch_events')
      .select('source_url, competitor_url, price, price_usd, currency, availability, title, alert_level, change_summary, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !Array.isArray(data)) return [];

    return data.map((row: any) => ({
      sourceUrl: String(row.source_url || ''),
      competitorUrl: row.competitor_url ? String(row.competitor_url) : null,
      price: row.price != null ? Number(row.price) : null,
      priceUsd: row.price_usd != null ? Number(row.price_usd) : null,
      currency: row.currency ? String(row.currency) : null,
      availability: normalizeAvailability(row.availability),
      title: row.title ? String(row.title) : null,
      alertLevel: String(row.alert_level || 'watch'),
      changeSummary: String(row.change_summary || 'Market watch event recorded.'),
      createdAt: String(row.created_at),
    }));
  } catch {
    return [];
  }
}

export async function getActiveMarketWatchlists(limit = 50) {
  try {
    const { data, error } = await supabaseAdmin
      .from('market_watchlists')
      .select('id, user_id, label, website_url, competitor_urls, status, updated_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error || !Array.isArray(data)) return [] as StoredMarketWatchlistRow[];
    return data as StoredMarketWatchlistRow[];
  } catch {
    return [] as StoredMarketWatchlistRow[];
  }
}

export function buildWeeklyMarketDigest(params: { label?: string | null; reports: MarketWatchReport[] }): WeeklyMarketDigest {
  const label = params.label?.trim() || 'Market watchlist';
  const reports = params.reports || [];
  const opportunityCount = reports.filter((item) => item.status === 'opportunity').length;
  const riskCount = reports.filter((item) => item.status === 'risk').length;
  const changedCount = reports.filter((item) => item.changed).length;
  const highlights = Array.from(new Set(reports.flatMap((item) => [item.strongestMove, ...item.alerts.slice(0, 1), ...item.opportunities.slice(0, 1)]).filter(Boolean as any))).slice(0, 4);

  const status: WeeklyMarketDigest['status'] = riskCount >= Math.max(2, opportunityCount + 1)
    ? 'risk'
    : opportunityCount > riskCount
      ? 'opportunity'
      : 'watch';

  const title = status === 'opportunity'
    ? `${label}: weekly market upside detected`
    : status === 'risk'
      ? `${label}: weekly market risk update`
      : `${label}: weekly market watch summary`;

  const summary = status === 'opportunity'
    ? `The past scans surfaced ${opportunityCount} upside signal(s) and ${changedCount} meaningful market change(s).`
    : status === 'risk'
      ? `The past scans surfaced ${riskCount} risk signal(s), so pricing and conversion should be reviewed.`
      : `The past scans stayed mostly stable, with ${changedCount} noteworthy change(s) worth watching.`;

  return {
    title,
    summary,
    highlights: highlights.length ? highlights : ['Keep scanning the same watchlist to build a stronger market history.'],
    status,
  };
}

export async function persistMarketWatchReport(params: {
  userId: string;
  websiteUrl?: string;
  competitorUrls?: string[];
  report: MarketWatchReport;
  saveWatchlist?: boolean;
}) {
  const { userId, websiteUrl = '', competitorUrls = [], report, saveWatchlist = false } = params;

  try {
    if (saveWatchlist && websiteUrl) {
      await supabaseAdmin.from('market_watchlists').upsert({
        user_id: userId,
        label: hostLabel(websiteUrl),
        website_url: websiteUrl,
        competitor_urls: competitorUrls,
        status: 'active',
        updated_at: new Date().toISOString(),
      });
    }

    if (report.records.length) {
      await supabaseAdmin.from('market_watch_events').insert(
        report.records.map((record) => ({
          user_id: userId,
          source_url: websiteUrl || record.url,
          competitor_url: record.role === 'competitor' ? record.url : null,
          price: record.price,
          price_usd: record.priceUsd,
          currency: record.currency,
          availability: record.availability,
          title: record.title,
          review_count: record.reviewCount,
          alert_level: report.status,
          change_summary: report.headline,
          metadata: {
            role: record.role,
            strongest_move: report.strongestMove,
            alerts: report.alerts,
            opportunities: report.opportunities,
          },
        }))
      );
    }

    if (report.status !== 'watch') {
      await supabaseAdmin.from('notification_events').insert({
        user_id: userId,
        channel: 'in_app',
        title: 'Market watch alert',
        message: report.headline,
        status: 'queued',
      });
    }
  } catch {
    // ignore persistence issues in environments without the optional market watch tables
  }
}
