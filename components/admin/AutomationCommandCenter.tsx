'use client';

import { useState } from 'react';
import type { Language } from '@/lib/i18n';

const tt = (l: Language, v: { en: string; pl: string }) => (l === 'pl' ? v.pl : v.en);

type DeliveryRouting = {
  channel: string;
  label?: string;
  enabled: boolean;
  ready: boolean;
  target?: string | null;
  reason?: string | null;
};

type RunResult = {
  success?: boolean;
  processedCount?: number;
  alertsQueued?: number;
  digestsQueued?: number;
  processed?: Array<{ watchlist: string; status: string; changed: boolean; strongestMove: string }>;
  dispatchResult?: { processed?: number; provider?: string; routing?: DeliveryRouting[] } | null;
  provider?: string;
  routing?: DeliveryRouting[];
  error?: string;
};

function formatWatchlistLabel(value: string) {
  try {
    const url = new URL(value);
    const pathname = url.pathname.length > 42 ? `${url.pathname.slice(0, 42)}...` : url.pathname;
    return `${url.hostname}${pathname}`;
  } catch {
    return value.length > 72 ? `${value.slice(0, 72)}...` : value;
  }
}

function formatWatchlistMeta(value: string) {
  try {
    const url = new URL(value);
    return url.pathname || '/';
  } catch {
    return value;
  }
}

export default function AutomationCommandCenter({ language }: { language: Language }) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeRouting = result?.dispatchResult?.routing || result?.routing || [];
  const deliveryProvider = result?.dispatchResult?.provider || result?.provider;

  async function runAction(key: 'scan' | 'weekly' | 'dispatch') {
    try {
      setLoadingKey(key);
      setError(null);

      let response: Response;
      if (key === 'dispatch') {
        response = await fetch('/api/notifications/dispatch', { method: 'POST' });
      } else {
        response = await fetch('/api/automations/market-watch/run', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ weeklyDigest: key === 'weekly', dispatchNow: key === 'weekly' }),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || tt(language, { en: 'Automation run failed.', pl: 'Uruchomienie automatyzacji nie powiodło się.' }));
        return;
      }

      setResult(data);
    } catch {
      setError(tt(language, { en: 'Connection error.', pl: 'Błąd połączenia.' }));
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <section className="rounded-[32px] border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
      <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tt(language, { en: 'Automation command center', pl: 'Command center automatyzacji' })}</div>
      <h2 className="mt-2 text-3xl font-black text-white">{tt(language, { en: 'Run alerts and weekly digests', pl: 'Uruchamiaj alerty i tygodniowe digesty' })}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
        {tt(language, {
          en: 'Manual control for the new market-watch cron layer. Use it to scan saved watchlists, queue weekly digests, and dispatch alerts immediately.',
          pl: 'Ręczne sterowanie nową warstwą cron market-watch. Użyj tego do skanowania watchlist, kolejkowania digestów i natychmiastowego wysyłania alertów.',
        })}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => runAction('scan')} disabled={loadingKey !== null} className="rounded-2xl bg-cyan-300 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60">
          {loadingKey === 'scan' ? tt(language, { en: 'Scanning...', pl: 'Skanuję...' }) : tt(language, { en: 'Run market scans now', pl: 'Uruchom skany rynku teraz' })}
        </button>
        <button type="button" onClick={() => runAction('weekly')} disabled={loadingKey !== null} className="rounded-2xl bg-emerald-300 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60">
          {loadingKey === 'weekly' ? tt(language, { en: 'Queueing digest...', pl: 'Kolejkuję digest...' }) : tt(language, { en: 'Queue weekly digest', pl: 'Kolejkuj tygodniowy digest' })}
        </button>
        <button type="button" onClick={() => runAction('dispatch')} disabled={loadingKey !== null} className="rounded-2xl border border-white/10 px-4 py-2 font-semibold text-white disabled:opacity-60">
          {loadingKey === 'dispatch' ? tt(language, { en: 'Dispatching...', pl: 'Wysyłam...' }) : tt(language, { en: 'Dispatch queued alerts', pl: 'Wyślij kolejkę alertów' })}
        </button>
      </div>

      {error ? <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-100">{error}</div> : null}

      {result ? (
        <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{tt(language, { en: 'Last automation run', pl: 'Ostatnie uruchomienie' })}</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
              <div className="text-xs text-slate-400">{tt(language, { en: 'Processed watchlists', pl: 'Przetworzone watchlisty' })}</div>
              <div className="mt-1 text-xl font-black text-white">{result.processedCount ?? result.dispatchResult?.processed ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
              <div className="text-xs text-slate-400">{tt(language, { en: 'Alerts queued', pl: 'Alerty w kolejce' })}</div>
              <div className="mt-1 text-xl font-black text-white">{result.alertsQueued ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
              <div className="text-xs text-slate-400">{tt(language, { en: 'Digests queued', pl: 'Digesty w kolejce' })}</div>
              <div className="mt-1 text-xl font-black text-white">{result.digestsQueued ?? 0}</div>
            </div>
          </div>

          {deliveryProvider || activeRouting.length ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-sm text-slate-200">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{tt(language, { en: 'Delivery routing', pl: 'Routing wysyłki' })}</div>
              <div className="mt-2 text-white">{tt(language, { en: 'Provider', pl: 'Provider' })}: <span className="font-semibold uppercase">{deliveryProvider || 'none'}</span></div>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeRouting.filter((item) => item.enabled).map((item) => (
                  <span key={`${item.channel}-${item.target || 'default'}`} className={`rounded-full border px-3 py-1 text-xs ${item.ready ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : 'border-amber-300/30 bg-amber-300/10 text-amber-100'}`}>
                    {(item.label || item.channel).replace('_', ' ')}{item.target ? ` • ${item.target}` : ''}{item.ready ? '' : ` • ${item.reason || 'setup required'}`}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {Array.isArray(result.processed) && result.processed.length ? (
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              {result.processed.slice(0, 5).map((item) => (
                <div key={`${item.watchlist}-${item.strongestMove}`} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${item.status === 'opportunity' ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : item.status === 'risk' ? 'border-rose-300/30 bg-rose-300/10 text-rose-100' : 'border-amber-300/30 bg-amber-300/10 text-amber-100'}`}>
                          {item.status}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${item.changed ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-300'}`}>
                          {item.changed ? tt(language, { en: 'Changed', pl: 'Zmiana' }) : tt(language, { en: 'Stable', pl: 'Stabilne' })}
                        </span>
                      </div>
                      <div className="mt-3 break-all text-sm font-semibold text-white">{formatWatchlistLabel(item.watchlist)}</div>
                      <div className="mt-1 break-all text-xs text-slate-500">{formatWatchlistMeta(item.watchlist)}</div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-300">{item.strongestMove}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
