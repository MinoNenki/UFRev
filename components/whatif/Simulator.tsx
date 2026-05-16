'use client';

import { useEffect, useMemo, useState } from 'react';
import { calculateDecision, deriveOpportunityProfile, type DecisionInput } from '@/lib/decision-engine';
import { formatMoney, getCurrencyForLanguage, normalizeCurrencyCode, type SupportedCurrency } from '@/lib/currency';
import type { Language } from '@/lib/i18n';

const tt = (l: Language, v: { en: string; pl: string; de?: string; es?: string; pt?: string; ja?: string; zh?: string; id?: string; ru?: string }) =>
  l === 'pl' ? v.pl : l === 'de' ? (v.de ?? v.en) : l === 'es' ? (v.es ?? v.pt ?? v.en) : l === 'pt' ? (v.pt ?? v.es ?? v.en) : l === 'ja' ? (v.ja ?? v.en) : l === 'zh' ? (v.zh ?? v.en) : l === 'id' ? (v.id ?? v.en) : l === 'ru' ? (v.ru ?? v.en) : v.en;

type ResultLike = {
  score?: number;
  confidence?: number;
  moatScore?: number;
  burnRisk?: 'Low' | 'Medium' | 'High';
  verdict?: 'BUY' | 'TEST' | 'AVOID';
  executionMode?: 'safe_test' | 'manual_review' | 'scale_ready' | 'blocked';
  pricing?: {
    currentPrice?: number | null;
    estimatedCost?: number | null;
    marginPercent?: number | null;
    currency?: string | null;
  };
  market?: {
    competitorAvgPrice?: number | null;
    marketMonthlyUnits?: number | null;
    estimatedMonthlyRevenue?: number | null;
    displayCurrency?: string | null;
  };
  adStrategy?: {
    testBudget?: number | null;
  };
  factors?: Array<{ key: string; score: number }>;
};

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function round(value: number, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function getFactorScore(result: ResultLike, key: string, fallback: number) {
  const hit = (result.factors || []).find((factor) => factor.key === key);
  return typeof hit?.score === 'number' ? hit.score : fallback;
}

function inferBaseInput(result: ResultLike, fallbackCurrency: SupportedCurrency): DecisionInput {
  const displayCurrency = normalizeCurrencyCode(String(result.pricing?.currency || result.market?.displayCurrency || fallbackCurrency), fallbackCurrency);
  const currentPrice = Math.max(12, Number(result.pricing?.currentPrice || 49));
  const marginPercent = Math.max(8, Number(result.pricing?.marginPercent || getFactorScore(result, 'margin', 56)));
  const estimatedCost = Number(result.pricing?.estimatedCost || round(currentPrice * (1 - Math.min(marginPercent, 85) / 100), 2));
  const demand = clamp(Number(getFactorScore(result, 'demand', result.score || 60)), 15, 98);
  const competitionGap = clamp(Number(getFactorScore(result, 'competition', 58)), 8, 96);
  const competition = clamp(100 - competitionGap, 4, 96);
  const adBudget = Math.max(50, Number(result.adStrategy?.testBudget || currentPrice * 6));
  const competitorAvgPrice = Math.max(10, Number(result.market?.competitorAvgPrice || round(currentPrice * 1.04, 2)));
  const marketMonthlyUnits = Math.max(120, Number(result.market?.marketMonthlyUnits || 800));

  return {
    price: round(currentPrice, 2),
    cost: round(Math.min(currentPrice * 0.92, Math.max(1, estimatedCost)), 2),
    demand,
    competition,
    adBudget: round(adBudget, 0),
    competitorAvgPrice: round(competitorAvgPrice, 2),
    marketMonthlyUnits: round(marketMonthlyUnits, 0),
    websiteUrl: (result.confidence || 0) >= 50 ? 'https://scenario.local/offer' : '',
    competitorUrls: (result.market?.competitorAvgPrice || 0) > 0 ? 'https://scenario.local/competitor' : '',
    salesChannel: 'Shopify',
    targetMarket: displayCurrency,
    content: 'Scenario simulation with pricing, positioning, and risk controls.',
    uploadedFileCount: (result.confidence || 0) >= 58 ? 1 : 0,
    uploadedImageCount: (result.moatScore || 0) >= 60 ? 1 : 0,
    displayCurrency,
  };
}

function RangeControl({
  language,
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  language: Language;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  const [manualValue, setManualValue] = useState(String(value));

  useEffect(() => {
    setManualValue(String(value));
  }, [value]);

  const stepPrecision = (() => {
    const raw = String(step);
    const dot = raw.indexOf('.');
    return dot === -1 ? 0 : raw.length - dot - 1;
  })();

  const commitManualValue = (rawValue: string) => {
    const normalized = rawValue.replace(',', '.').trim();
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) {
      setManualValue(String(value));
      return;
    }

    const clamped = clamp(parsed, min, max);
    const snapped = round(Math.round(clamped / step) * step, stepPrecision);
    onChange(snapped);
    setManualValue(String(snapped));
  };

  const applyDelta = (direction: -1 | 1) => {
    const next = clamp(round(value + direction * step, stepPrecision), min, max);
    onChange(next);
    setManualValue(String(next));
  };

  return (
    <label className="block rounded-[18px] border border-cyan-300/30 bg-cyan-300/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-200">
        <span className="min-w-0 flex-1 text-[13px] leading-5 text-slate-200">{label}</span>
        <span className="shrink-0 whitespace-nowrap rounded-lg border border-cyan-300/30 bg-slate-950/45 px-2 py-0.5 font-semibold text-cyan-100">{value}{suffix || ''}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full accent-cyan-300"
      />

      <div className="mt-2.5">
        <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
          {tt(language, { en: 'Enter manually', pl: 'Wpisz ręcznie' })}
        </div>
        <div className="mt-1 grid grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-2">
          <button
            type="button"
            onClick={() => applyDelta(-1)}
            className="h-9 w-full rounded-lg border border-cyan-300/30 bg-slate-950/45 text-base font-semibold text-cyan-100"
            aria-label={tt(language, { en: 'Decrease', pl: 'Zmniejsz' })}
          >
            -
          </button>
          <input
            type="text"
            inputMode="decimal"
            value={manualValue}
            onChange={(event) => setManualValue(event.target.value)}
            onBlur={() => commitManualValue(manualValue)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitManualValue(manualValue);
              }
            }}
            className="min-w-0 w-full rounded-lg border border-cyan-300/30 bg-slate-950/45 px-2 py-1.5 text-center text-sm font-semibold text-white outline-none transition focus:border-cyan-300/70"
          />
          <button
            type="button"
            onClick={() => applyDelta(1)}
            className="h-9 w-full rounded-lg border border-cyan-300/30 bg-slate-950/45 text-base font-semibold text-cyan-100"
            aria-label={tt(language, { en: 'Increase', pl: 'Zwiększ' })}
          >
            +
          </button>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">{min} - {max}</div>
      </div>
    </label>
  );
}

export default function Simulator({
  result,
  currentLanguage,
}: {
  result: ResultLike;
  currentLanguage: Language;
}) {
  if (!result) return null;

  const fallbackCurrency = getCurrencyForLanguage(currentLanguage);
  const seed = useMemo(() => inferBaseInput(result, fallbackCurrency), [result, fallbackCurrency]);
  const [controls, setControls] = useState<DecisionInput>(seed);

  useEffect(() => {
    setControls(seed);
  }, [seed]);

  const baseDecision = useMemo(() => calculateDecision(seed), [seed]);
  const simulatedDecision = useMemo(() => calculateDecision(controls), [controls]);
  const opportunity = useMemo(() => deriveOpportunityProfile(simulatedDecision), [simulatedDecision]);

  const currency = normalizeCurrencyCode(String(controls.displayCurrency || fallbackCurrency), fallbackCurrency);
  const formatAmount = (value?: number | null) => (typeof value === 'number' ? formatMoney(value, currentLanguage, currency as SupportedCurrency) : '—');

  const scenarioCards = useMemo(() => {
    const build = (key: string, label: string, patch: Partial<DecisionInput>) => {
      const next = calculateDecision({ ...controls, ...patch });
      return {
        key,
        label,
        decision: next,
        delta: next.score - simulatedDecision.score,
      };
    };

    return [
      build('price-up', tt(currentLanguage, { en: 'Price +8%', pl: 'Cena +8%' }), { price: round(Number(controls.price || 0) * 1.08, 2) }),
      build('cost-down', tt(currentLanguage, { en: 'Cost -10%', pl: 'Koszt -10%' }), { cost: round(Number(controls.cost || 0) * 0.9, 2) }),
      build('pressure', tt(currentLanguage, { en: 'Competition spike', pl: 'Skok konkurencji' }), { competition: clamp(Number(controls.competition || 0) + 15, 0, 100) }),
    ];
  }, [controls, currentLanguage, simulatedDecision.score]);

  function update<K extends keyof DecisionInput>(key: K, value: NonNullable<DecisionInput[K]>) {
    setControls((prev) => ({ ...prev, [key]: value }));
  }

  function applyPreset(kind: 'upside' | 'defensive' | 'efficiency' | 'reset') {
    if (kind === 'reset') {
      setControls(seed);
      return;
    }

    setControls((prev) => {
      if (kind === 'upside') {
        return {
          ...prev,
          price: round(Number(prev.price || 0) * 1.08, 2),
          demand: clamp(Number(prev.demand || 0) + 10, 0, 100),
          competition: clamp(Number(prev.competition || 0) - 8, 0, 100),
        };
      }

      if (kind === 'defensive') {
        return {
          ...prev,
          adBudget: round(Number(prev.adBudget || 0) * 0.75, 0),
          competition: clamp(Number(prev.competition || 0) + 8, 0, 100),
          demand: clamp(Number(prev.demand || 0) - 4, 0, 100),
        };
      }

      return {
        ...prev,
        cost: round(Number(prev.cost || 0) * 0.9, 2),
        demand: clamp(Number(prev.demand || 0) + 6, 0, 100),
      };
    });
  }

  const tone = opportunity.opportunityWindow === 'open'
    ? 'border-cyan-300/35 bg-cyan-300/12 text-cyan-100'
    : opportunity.opportunityWindow === 'closed'
      ? 'border-rose-400/30 bg-rose-400/10 text-rose-200'
      : 'border-amber-300/30 bg-amber-300/10 text-amber-100';

  return (
    <div className="simulator-wow-shell rounded-[30px] border border-cyan-300/24 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.10),transparent_34%),linear-gradient(180deg,rgba(10,20,38,0.78),rgba(7,14,30,0.96))] p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">
            {tt(currentLanguage, { en: 'What-if command cockpit', pl: 'Cockpit scenariuszy what-if' })}
          </div>
          <h3 className="mt-2 text-2xl font-black text-white sm:text-[2rem]">
            {tt(currentLanguage, { en: 'Live scenario simulator', pl: 'Symulator przewagi na żywo' })}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
            {tt(currentLanguage, {
              en: 'Stress-test pricing, demand, cost, and competition locally before you risk budget in the market.',
              pl: 'Przetestuj lokalnie cenę, popyt, koszt i konkurencję zanim zaryzykujesz realny budżet na rynku.',
            })}
          </p>
        </div>

        <div className={`rounded-2xl border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${tone}`}>
          {opportunity.opportunityWindow === 'open'
            ? tt(currentLanguage, { en: 'Window open', pl: 'Okno okazji otwarte' })
            : opportunity.opportunityWindow === 'closed'
              ? tt(currentLanguage, { en: 'Capital protection', pl: 'Tryb ochrony kapitału' })
              : tt(currentLanguage, { en: 'Guarded test', pl: 'Kontrolowany test' })}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{tt(currentLanguage, { en: 'Scenario verdict', pl: 'Werdykt scenariusza' })}</div>
          <div className="mt-2 text-2xl font-black text-white">{simulatedDecision.verdict}</div>
        </div>
        <div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{tt(currentLanguage, { en: 'Score delta', pl: 'Zmiana score' })}</div>
          <div className={`mt-2 text-2xl font-black ${(simulatedDecision.score || 0) >= (baseDecision.score || 0) ? 'text-cyan-200' : 'text-amber-200'}`}>
            {(simulatedDecision.score || 0) - (baseDecision.score || 0) >= 0 ? '+' : ''}{(simulatedDecision.score || 0) - (baseDecision.score || 0)}
          </div>
        </div>
        <div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{tt(currentLanguage, { en: 'Momentum', pl: 'Momentum' })}</div>
          <div className="mt-2 text-2xl font-black text-white">{opportunity.momentumScore}/100</div>
        </div>
        <div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{tt(currentLanguage, { en: 'Execution readiness', pl: 'Gotowość wykonania' })}</div>
          <div className="mt-2 text-2xl font-black text-white">{opportunity.executionReadiness}/100</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => applyPreset('upside')} className="rounded-full border border-cyan-300/35 bg-cyan-300/14 px-3 py-1.5 text-xs font-semibold text-cyan-100">
          {tt(currentLanguage, { en: 'Upside case', pl: 'Scenariusz wzrostowy' })}
        </button>
        <button type="button" onClick={() => applyPreset('efficiency')} className="rounded-full border border-amber-300/30 bg-amber-300/12 px-3 py-1.5 text-xs font-semibold text-amber-100">
          {tt(currentLanguage, { en: 'Efficiency case', pl: 'Scenariusz efektywności' })}
        </button>
        <button type="button" onClick={() => applyPreset('defensive')} className="rounded-full border border-cyan-300/32 bg-cyan-300/12 px-3 py-1.5 text-xs font-semibold text-cyan-100">
          {tt(currentLanguage, { en: 'Defensive case', pl: 'Scenariusz defensywny' })}
        </button>
        <button type="button" onClick={() => applyPreset('reset')} className="rounded-full border border-amber-300/30 bg-slate-950/35 px-3 py-1.5 text-xs font-semibold text-amber-100">
          {tt(currentLanguage, { en: 'Reset', pl: 'Reset' })}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1.28fr)_minmax(0,0.92fr)] lg:gap-4">
        <div className="min-w-0 rounded-[20px] border border-cyan-300/30 bg-cyan-300/8 p-2.5 sm:p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-200 sm:text-[11px] sm:tracking-[0.22em]">
            {tt(currentLanguage, { en: 'Controls', pl: 'Sterowanie' })}
          </div>
          <div className="mt-2 space-y-2">
            <RangeControl language={currentLanguage} label={tt(currentLanguage, { en: 'Sell price', pl: 'Cena sprzedaży' })} value={Number(controls.price || 0)} min={5} max={500} step={1} onChange={(value) => update('price', value)} />
            <RangeControl language={currentLanguage} label={tt(currentLanguage, { en: 'Estimated cost', pl: 'Szacowany koszt' })} value={Number(controls.cost || 0)} min={1} max={350} step={1} onChange={(value) => update('cost', value)} />
            <RangeControl language={currentLanguage} label={tt(currentLanguage, { en: 'Demand', pl: 'Popyt' })} value={Number(controls.demand || 0)} min={0} max={100} step={1} suffix="/100" onChange={(value) => update('demand', value)} />
            <RangeControl language={currentLanguage} label={tt(currentLanguage, { en: 'Competition', pl: 'Konkurencja' })} value={Number(controls.competition || 0)} min={0} max={100} step={1} suffix="/100" onChange={(value) => update('competition', value)} />
            <RangeControl language={currentLanguage} label={tt(currentLanguage, { en: 'Test budget', pl: 'Budżet testu' })} value={Number(controls.adBudget || 0)} min={50} max={2500} step={10} onChange={(value) => update('adBudget', value)} />
            <RangeControl language={currentLanguage} label={tt(currentLanguage, { en: 'Market monthly units', pl: 'Miesięczny wolumen rynku' })} value={Number(controls.marketMonthlyUnits || 0)} min={100} max={10000} step={50} onChange={(value) => update('marketMonthlyUnits', value)} />
          </div>
        </div>

        <div className="min-w-0 self-start rounded-[20px] border border-cyan-300/30 bg-cyan-300/8 p-2.5 backdrop-blur lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto sm:rounded-[24px] sm:border-cyan-300/30 sm:bg-cyan-300/8 sm:p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-200 sm:text-[11px] sm:tracking-[0.22em]">
            {tt(currentLanguage, { en: 'Live scenario economy', pl: 'Ekonomia scenariusza na żywo' })}
          </div>
          <div className="mt-2 grid gap-2">
            <div className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-2 sm:rounded-2xl sm:p-3">
              <div className="text-[11px] text-slate-400">{tt(currentLanguage, { en: 'Margin', pl: 'Marża' })}</div>
              <div className="mt-0.5 text-lg font-bold text-white sm:mt-1 sm:text-xl">{simulatedDecision.pricing.marginPercent}%</div>
            </div>
            <div className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-2 sm:rounded-2xl sm:p-3">
              <div className="text-[11px] text-slate-400">{tt(currentLanguage, { en: 'Suggested test price', pl: 'Sugerowana cena testowa' })}</div>
              <div className="mt-0.5 text-lg font-bold text-white sm:mt-1 sm:text-xl">{formatAmount(simulatedDecision.pricing.suggestedTestPrice)}</div>
            </div>
            <div className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-2 sm:rounded-2xl sm:p-3">
              <div className="text-[11px] text-slate-400">{tt(currentLanguage, { en: 'Monthly revenue proxy', pl: 'Proxy miesięcznego przychodu' })}</div>
              <div className="mt-0.5 text-lg font-bold text-white sm:mt-1 sm:text-xl">{formatAmount(simulatedDecision.market.estimatedMonthlyRevenue)}</div>
            </div>
            <div className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-2 sm:rounded-2xl sm:p-3">
              <div className="text-[11px] text-slate-400">{tt(currentLanguage, { en: 'Action bias', pl: 'Bias działania' })}</div>
              <div className="mt-0.5 text-lg font-bold text-white sm:mt-1 sm:text-xl">{opportunity.actionBias}</div>
            </div>
          </div>
          <p className="mt-2.5 text-xs leading-6 text-slate-300 sm:text-sm sm:leading-7">{opportunity.headline}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {scenarioCards.map((item) => (
          <div key={item.key} className="rounded-[22px] border border-cyan-300/30 bg-cyan-300/10 p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="text-xl font-black text-white">{item.decision.verdict}</div>
              <div className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.delta >= 0 ? 'bg-cyan-300/12 text-cyan-100' : 'bg-amber-300/10 text-amber-100'}`}>
                {item.delta >= 0 ? '+' : ''}{item.delta}
              </div>
            </div>
            <div className="mt-2 text-sm text-slate-300">{tt(currentLanguage, { en: 'Score', pl: 'Wynik' })}: {item.decision.score}/100</div>
            <div className="text-sm text-slate-400">{tt(currentLanguage, { en: 'Risk', pl: 'Ryzyko' })}: {item.decision.burnRisk}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
