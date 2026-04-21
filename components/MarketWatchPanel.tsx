'use client';

import { useEffect, useState } from 'react';
import { tr, type Language } from '@/lib/i18n';

const tt = tr;

type MarketWatchReport = {
  status: 'opportunity' | 'watch' | 'risk';
  headline: string;
  summary: string;
  strongestMove: string;
  changed: boolean;
  alerts: string[];
  opportunities: string[];
  records: Array<{
    url: string;
    role: 'primary' | 'competitor';
    title: string | null;
    price: number | null;
    currency: string | null;
    availability: 'in_stock' | 'out_of_stock' | 'unknown';
  }>;
};

type RecentEvent = {
  sourceUrl: string;
  competitorUrl: string | null;
  price: number | null;
  currency: string | null;
  availability: 'in_stock' | 'out_of_stock' | 'unknown';
  title: string | null;
  alertLevel: string;
  changeSummary: string;
  createdAt: string;
};

function statusLabel(language: Language, status: 'opportunity' | 'watch' | 'risk') {
  if (language === 'pl') {
    if (status === 'opportunity') return 'okazja';
    if (status === 'risk') return 'ryzyko';
    return 'obserwacja';
  }

  return status;
}

function eventStatusLabel(language: Language, status: string) {
  if (language === 'pl') {
    if (status === 'opportunity') return 'Wykryto okazję rynkową';
    if (status === 'risk') return 'Wykryto ryzyko rynkowe';
    return 'Zapisany snapshot rynku';
  }

  if (status === 'opportunity') return 'Market opportunity detected';
  if (status === 'risk') return 'Market risk detected';
  return 'Market snapshot saved';
}

function hostLabel(url: string | null) {
  if (!url) return '';

  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return url;
  }
}

function compactUrl(url: string | null) {
  if (!url) return '';
  return url.length > 88 ? `${url.slice(0, 88)}...` : url;
}

function localizeStoredSummary(language: Language, summary: string) {
  if (language !== 'pl') return summary;

  const normalized = summary.trim();
  if (normalized === 'The market is stable for now, but keep watching competitor moves closely.') {
    return 'Rynek jest na razie stabilny, ale obserwuj ruchy konkurencji bardzo uważnie.';
  }

  if (normalized === 'The market is opening up - there may be room to move faster or test a price lift.' || normalized === 'The market is opening up — there may be room to move faster or test a price lift.') {
    return 'Rynek się otwiera - może pojawiać się przestrzeń na szybszy ruch albo test podwyżki ceny.';
  }

  if (normalized === 'The market is pushing back - protect conversion and margin before scaling.' || normalized === 'The market is pushing back — protect conversion and margin before scaling.') {
    return 'Rynek stawia opór - chroń konwersję i marżę zanim wejdziesz w skalę.';
  }

  if (normalized === 'Market watch event recorded.') {
    return 'Zdarzenie market watch zostało zapisane.';
  }

  return summary;
}

function tone(status: 'opportunity' | 'watch' | 'risk') {
  if (status === 'opportunity') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100';
  if (status === 'risk') return 'border-rose-400/30 bg-rose-400/10 text-rose-100';
  return 'border-amber-300/30 bg-amber-300/10 text-amber-100';
}

export default function MarketWatchPanel({ currentLanguage = 'en' as Language }) {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [competitorUrls, setCompetitorUrls] = useState('');
  const [saveWatchlist, setSaveWatchlist] = useState(true);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<MarketWatchReport | null>(null);
  const [events, setEvents] = useState<RecentEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/market-watch/report?language=${currentLanguage}`)
      .then((response) => response.json())
      .then((data) => setEvents(Array.isArray(data.events) ? data.events : []))
      .catch(() => {});
  }, [currentLanguage]);

  async function scanMarket() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/market-watch/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ websiteUrl, competitorUrls, saveWatchlist, language: currentLanguage }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || tt(currentLanguage, { en: 'Scan failed.', pl: 'Skan nie powiódł się.' }));
        return;
      }

      setReport(data.report || null);
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch {
      setError(tt(currentLanguage, { en: 'Connection error.', pl: 'Błąd połączenia.' }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.96))] p-6 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
      <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">
        {tt(currentLanguage, { en: 'Live market guidance', pl: 'Live przewodnik po rynku' })}
      </div>
      <h2 className="mt-2 text-3xl font-black text-white">
        {tt(currentLanguage, { en: 'See competitor moves before they hurt your margin', pl: 'Zobacz ruchy konkurencji zanim uderzą w Twoją marżę' })}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
        {tt(currentLanguage, {
          en: 'Compare your offer, notice market pressure earlier, and keep a saved watchlist for safer next decisions.',
          pl: 'Porównuj swoją ofertę, wcześniej zauważaj presję rynku i zapisuj watchlistę do bezpieczniejszych kolejnych decyzji.',
        })}
      </p>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">{tt(currentLanguage, { en: 'Main product URL', pl: 'Główny URL produktu' })}</span>
            <input
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              placeholder={tt(currentLanguage, { en: 'https://your-store.com/products/main-offer', pl: 'https://twoj-sklep.pl/produkt/twoja-oferta' })}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none"
            />
          </label>

          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">{tt(currentLanguage, { en: 'Competitor URLs', pl: 'URL-e konkurencji' })}</span>
            <textarea
              value={competitorUrls}
              onChange={(event) => setCompetitorUrls(event.target.value)}
              placeholder={tt(currentLanguage, {
                en: 'https://competitor-a.com/product\nhttps://competitor-b.com/product',
                pl: 'https://konkurent-a.pl/produkt\nhttps://konkurent-b.pl/produkt',
              })}
              rows={5}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={saveWatchlist} onChange={(event) => setSaveWatchlist(event.target.checked)} />
            <span>{tt(currentLanguage, { en: 'Save this watchlist for future market history', pl: 'Zapisz tę watchlistę do przyszłej historii rynku' })}</span>
          </label>

          <button
            type="button"
            onClick={scanMarket}
            disabled={loading}
            className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
          >
            {loading
              ? tt(currentLanguage, { en: 'Scanning market...', pl: 'Skanuję rynek...' })
              : tt(currentLanguage, { en: 'Run live market scan', pl: 'Uruchom live scan rynku' })}
          </button>

          {error ? <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-100">{error}</div> : null}
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          {report ? (
            <div>
              <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${tone(report.status)}`}>
                {statusLabel(currentLanguage, report.status)}
              </div>
              <h3 className="mt-3 text-xl font-black text-white">{report.headline}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">{report.summary}</p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 p-3">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{tt(currentLanguage, { en: 'Strongest move', pl: 'Najmocniejszy ruch' })}</div>
                <div className="mt-1 text-sm font-semibold text-white">{report.strongestMove}</div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-rose-200">{tt(currentLanguage, { en: 'Alerts', pl: 'Alerty' })}</div>
                  <div className="mt-2 space-y-2 text-sm text-slate-200">
                    {report.alerts.length ? report.alerts.map((item) => <div key={item}>• {item}</div>) : <div>—</div>}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-200">{tt(currentLanguage, { en: 'Opportunities', pl: 'Okazje' })}</div>
                  <div className="mt-2 space-y-2 text-sm text-slate-200">
                    {report.opportunities.length ? report.opportunities.map((item) => <div key={item}>• {item}</div>) : <div>—</div>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm leading-7 text-slate-300">
              {tt(currentLanguage, {
                en: 'Run a live scan to build a saved competitor history and detect real market pressure.',
                pl: 'Uruchom live scan, aby zbudować historię konkurencji i wykryć realną presję rynku.',
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{tt(currentLanguage, { en: 'Recent market history', pl: 'Ostatnia historia rynku' })}</div>
        <div className="mt-3 space-y-3 text-sm text-slate-200">
          {events.length ? events.map((event, index) => (
            <div key={`${event.sourceUrl}-${event.competitorUrl || 'self'}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
              <div className="font-semibold text-white">{eventStatusLabel(currentLanguage, event.alertLevel)}</div>
              <div className="mt-1 text-xs text-slate-300">{hostLabel(event.competitorUrl || event.sourceUrl)}</div>
              <div className="mt-2 text-sm leading-6 text-slate-300">{localizeStoredSummary(currentLanguage, event.changeSummary)}</div>
              <div className="mt-2 text-xs text-slate-400">{compactUrl(event.competitorUrl || event.sourceUrl)} • {new Date(event.createdAt).toLocaleString(currentLanguage === 'pl' ? 'pl-PL' : 'en-US')}</div>
            </div>
          )) : <div className="text-slate-400">{tt(currentLanguage, { en: 'No saved market scans yet.', pl: 'Brak zapisanych skanów rynku.' })}</div>}
        </div>
      </div>
    </section>
  );
}
