'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { tr, type Language } from '@/lib/i18n';

type ShowcaseScenario = {
  id: 'product' | 'document' | 'video';
  eyebrow: string;
  title: string;
  source: string;
  verdict: 'BUY' | 'TEST' | 'SKIP';
  score: number;
  confidence: number;
  risk: string;
  usageCost: string;
  summary: string;
  why: string[];
  risks: string[];
  nextMoves: string[];
  signals: Array<{ label: string; value: string }>;
};

export default function ExampleVerdictShowcase({ language }: { language: Language }) {
  const scenarios = useMemo<ShowcaseScenario[]>(() => [
    {
      id: 'product',
      eyebrow: tr(language, { en: 'Showcase 01', pl: 'Showcase 01' }),
      title: tr(language, { en: 'Portable blender product page with healthy margin and clear test path', pl: 'Strona blendera przenośnego z dobrą marżą i jasną ścieżką testu' }),
      source: tr(language, { en: 'Supplier page + competitor check + target market', pl: 'Strona dostawcy + check konkurencji + rynek docelowy' }),
      verdict: 'TEST',
      score: 78,
      confidence: 84,
      risk: tr(language, { en: 'Medium', pl: 'Średnie' }),
      usageCost: '2 AI tokens',
      summary: tr(language, { en: 'This product deserves a controlled test: margin survives, demand looks real, but proof and differentiation should improve before full ad scale.', pl: 'Ten produkt zasługuje na kontrolowany test: marża się broni, popyt wygląda realnie, ale proof i wyróżnienie trzeba poprawić przed pełną skalą reklam.' }),
      why: [
        tr(language, { en: 'Margin remains healthy after estimated landed cost and basic ad pressure.', pl: 'Marża pozostaje zdrowa po uwzględnieniu szacowanego kosztu landed i podstawowej presji reklamowej.' }),
        tr(language, { en: 'Competitor pricing does not close the offer window yet.', pl: 'Ceny konkurencji nie zamykają jeszcze okna tej oferty.' }),
        tr(language, { en: 'Decision engine sees a viable test path with limited downside.', pl: 'Decision engine widzi wykonalną ścieżkę testu z ograniczonym downside.' }),
      ],
      risks: [
        tr(language, { en: 'Creative proof is still weaker than the top competitor.', pl: 'Proof kreacji jest nadal słabszy niż u topowego konkurenta.' }),
        tr(language, { en: 'The offer may need a sharper landing page hook for colder traffic.', pl: 'Oferta może potrzebować mocniejszego hooka na landing page pod zimniejszy ruch.' }),
      ],
      nextMoves: [
        tr(language, { en: 'Launch a 3-5 day test with capped budget and margin guardrails.', pl: 'Uruchom test 3-5 dni z ograniczonym budżetem i guardrails marży.' }),
        tr(language, { en: 'Strengthen product proof above the fold before ad scale.', pl: 'Wzmocnij proof produktu above the fold przed skalą reklam.' }),
      ],
      signals: [
        { label: tr(language, { en: 'Verdict mode', pl: 'Tryb werdyktu' }), value: 'BUY / TEST / SKIP' },
        { label: tr(language, { en: 'Margin outlook', pl: 'Perspektywa marży' }), value: '+18.4%' },
        { label: tr(language, { en: 'Execution', pl: 'Wykonanie' }), value: tr(language, { en: 'Controlled test', pl: 'Kontrolowany test' }) },
      ],
    },
    {
      id: 'document',
      eyebrow: tr(language, { en: 'Showcase 02', pl: 'Showcase 02' }),
      title: tr(language, { en: 'Invoice and supplier PDF read with cost leakage exposed early', pl: 'Odczyt faktury i PDF dostawcy z szybkim wykryciem wycieku kosztowego' }),
      source: tr(language, { en: 'Invoice PDF + shipping terms + surcharge notes', pl: 'PDF faktury + warunki wysyłki + notatki o dopłatach' }),
      verdict: 'SKIP',
      score: 42,
      confidence: 88,
      risk: tr(language, { en: 'High', pl: 'Wysokie' }),
      usageCost: '4 AI tokens',
      summary: tr(language, { en: 'The document layer catches hidden fees fast. This deal should be rejected until shipping, handling and payment surcharges are renegotiated.', pl: 'Warstwa dokumentów szybko wyłapuje ukryte opłaty. Ten deal powinien zostać odrzucony, dopóki koszty wysyłki, obsługi i dopłat płatniczych nie zostaną renegocjowane.' }),
      why: [
        tr(language, { en: 'The PDF exposes extra fees that destroy the expected margin.', pl: 'PDF ujawnia dodatkowe opłaty, które niszczą oczekiwaną marżę.' }),
        tr(language, { en: 'The readout is consistent across invoice totals, terms and surcharge notes.', pl: 'Odczyt jest spójny między sumą faktury, warunkami i notatkami o dopłatach.' }),
        tr(language, { en: 'The system turns a dense document into one clear anti-loss verdict.', pl: 'System zamienia gęsty dokument w jeden jasny werdykt anti-loss.' }),
      ],
      risks: [
        tr(language, { en: 'Landed cost is materially higher than the offer implies.', pl: 'Landed cost jest realnie wyższy niż sugeruje oferta.' }),
        tr(language, { en: 'A hidden fee cluster makes break-even too fragile.', pl: 'Klaster ukrytych opłat sprawia, że break-even jest zbyt kruchy.' }),
      ],
      nextMoves: [
        tr(language, { en: 'Reject this version of the deal and ask for a clean revised invoice.', pl: 'Odrzuć tę wersję dealu i poproś o czystą, poprawioną fakturę.' }),
        tr(language, { en: 'Re-run the document only after surcharge clauses are corrected.', pl: 'Uruchom dokument ponownie dopiero po poprawieniu klauzul o dopłatach.' }),
      ],
      signals: [
        { label: tr(language, { en: 'Document read', pl: 'Odczyt dokumentu' }), value: tr(language, { en: 'Deep PDF review', pl: 'Głęboki review PDF' }) },
        { label: tr(language, { en: 'Cost leak', pl: 'Wyciek kosztu' }), value: tr(language, { en: 'Hidden surcharges', pl: 'Ukryte dopłaty' }) },
        { label: tr(language, { en: 'Action', pl: 'Akcja' }), value: tr(language, { en: 'Reject and renegotiate', pl: 'Odrzuć i renegocjuj' }) },
      ],
    },
    {
      id: 'video',
      eyebrow: tr(language, { en: 'Showcase 03', pl: 'Showcase 03' }),
      title: tr(language, { en: 'Video ad review showing why a creative deserves TEST, not blind scale', pl: 'Review reklamy wideo pokazujący, dlaczego kreacja zasługuje na TEST, a nie ślepą skalę' }),
      source: tr(language, { en: 'UGC clip + product hook + CTA pacing', pl: 'Klip UGC + hook produktu + pacing CTA' }),
      verdict: 'TEST',
      score: 81,
      confidence: 79,
      risk: tr(language, { en: 'Medium', pl: 'Średnie' }),
      usageCost: '6 AI tokens',
      summary: tr(language, { en: 'The clip has real promise: the hook is strong and attention survives, but product proof lands too late for a full BUY call. Test it first, tighten the first seconds, then scale.', pl: 'Klip ma realny potencjał: hook jest mocny, a uwaga się utrzymuje, ale proof produktu wpada za późno na pełne BUY. Najpierw go przetestuj, skróć pierwsze sekundy, dopiero potem skaluj.' }),
      why: [
        tr(language, { en: 'The system reads hook, pacing, product clarity and CTA timing together.', pl: 'System czyta razem hook, pacing, klarowność produktu i timing CTA.' }),
        tr(language, { en: 'Weighted video analysis makes the decision more honest for creative-heavy jobs.', pl: 'Ważona analiza wideo czyni decyzję bardziej uczciwą dla cięższych zadań kreatywnych.' }),
        tr(language, { en: 'The verdict board shows where the creative wins and where it still leaks trust.', pl: 'Tablica werdyktu pokazuje, gdzie kreacja wygrywa, a gdzie nadal gubi zaufanie.' }),
      ],
      risks: [
        tr(language, { en: 'Proof lands too late for colder paid traffic.', pl: 'Proof wpada za późno dla zimniejszego płatnego ruchu.' }),
        tr(language, { en: 'The CTA could arrive earlier and with stronger visual focus.', pl: 'CTA mogłoby wejść wcześniej i z mocniejszym focusem wizualnym.' }),
      ],
      nextMoves: [
        tr(language, { en: 'Cut the intro by 2-3 seconds and run a fresh retest.', pl: 'Skróć intro o 2-3 sekundy i uruchom świeży retest.' }),
        tr(language, { en: 'Scale only after the first creative test confirms hold rate and click quality.', pl: 'Skaluj dopiero po tym, jak pierwszy test kreacji potwierdzi hold rate i jakość kliknięć.' }),
      ],
      signals: [
        { label: tr(language, { en: 'Read path', pl: 'Ścieżka odczytu' }), value: tr(language, { en: 'Frames + hook + CTA', pl: 'Klatki + hook + CTA' }) },
        { label: tr(language, { en: 'Creative promise', pl: 'Obietnica kreacji' }), value: tr(language, { en: 'Strong opening, late proof', pl: 'Mocne otwarcie, późny proof' }) },
        { label: tr(language, { en: 'Decision lane', pl: 'Tor decyzji' }), value: tr(language, { en: 'Retest before scale', pl: 'Retest przed skalą' }) },
      ],
    },
  ], [language]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(Math.floor(Math.random() * scenarios.length));
  }, [scenarios.length]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % scenarios.length);
    }, 11000);

    return () => window.clearInterval(interval);
  }, [scenarios.length]);

  const activeScenario = scenarios[activeIndex];
  const progress = ((activeIndex + 1) / scenarios.length) * 100;
  const verdictTone = activeScenario.verdict === 'BUY'
    ? 'text-emerald-200 border-emerald-300/25 bg-emerald-400/10'
    : activeScenario.verdict === 'SKIP'
      ? 'text-rose-100 border-rose-300/25 bg-rose-400/10'
      : 'text-amber-100 border-amber-300/25 bg-amber-400/10';

  return (
    <section className="example-verdict-shell premium-panel overflow-hidden p-6 sm:p-7 xl:p-8">
      <div className="example-verdict-orb example-verdict-orb-a" />
      <div className="example-verdict-orb example-verdict-orb-b" />
      <div className="example-verdict-scan" />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">
              {tr(language, { en: 'Animated example verdicts', pl: 'Animowane przykładowe werdykty' })}
            </div>
            <h1 className="mt-3 text-balance max-w-4xl text-[clamp(2.4rem,4.2vw,4.6rem)] font-black leading-[0.95] tracking-[-0.045em] text-white">
              {tr(language, { en: 'Three premium sample analyses that show exactly how the engine explains a decision.', pl: 'Trzy premium przykładowe analizy pokazujące dokładnie, jak silnik wyjaśnia decyzję.' })}
            </h1>
            <p className="mt-4 max-w-3xl text-[1rem] leading-8 text-slate-300 sm:text-[1.06rem]">
              {tr(language, { en: 'This is not a review wall. It is a rotating showcase of realistic product, document, and video verdict boards built to show how UFREV protects margin, catches risk and recommends the safest next move.', pl: 'To nie jest ściana opinii. To rotujący showcase realistycznych tablic werdyktów dla produktu, dokumentu i wideo, zbudowany tak, aby pokazać, jak UFREV chroni marżę, wyłapuje ryzyko i rekomenduje najbezpieczniejszy kolejny ruch.' })}
            </p>
          </div>

          <div className="rounded-[24px] border border-cyan-300/18 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-50 shadow-[0_18px_50px_rgba(34,211,238,0.12)]">
            {tr(language, { en: 'Rotation every 11 seconds', pl: 'Rotacja co 11 sekund' })}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {scenarios.map((scenario, index) => {
            const selected = index === activeIndex;

            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selected ? 'border-amber-200/30 bg-amber-300/14 text-amber-50 shadow-[0_0_24px_rgba(251,191,36,0.12)]' : 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]'}`}
              >
                {scenario.eyebrow} - {scenario.verdict}
              </button>
            );
          })}
        </div>

        <div className="mt-5 h-2 rounded-full bg-white/5">
          <div className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,1),rgba(251,191,36,0.92),rgba(168,85,247,0.95))] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
          <div className="example-verdict-source rounded-[30px] border border-white/10 bg-slate-950/55 p-5 shadow-[0_20px_70px_rgba(2,6,23,0.24)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{activeScenario.eyebrow}</div>
                <div className="mt-2 text-2xl font-black leading-[1.02] text-white">{activeScenario.title}</div>
              </div>
              <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${verdictTone}`}>
                {activeScenario.verdict}
              </span>
            </div>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">{tr(language, { en: 'Source bundle', pl: 'Pakiet źródeł' })}</div>
              <div className="mt-3 text-base font-semibold leading-7 text-white">{activeScenario.source}</div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {activeScenario.signals.map((signal) => (
                <div key={signal.label} className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{signal.label}</div>
                  <div className="mt-2 text-sm font-semibold leading-6 text-white">{signal.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[22px] border border-white/10 bg-slate-950/60 p-4 text-sm leading-7 text-slate-200">
              {activeScenario.summary}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/dashboard" className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">
                {tr(language, { en: 'Open real dashboard', pl: 'Otwórz prawdziwy dashboard' })}
              </Link>
              <Link href="/pricing" className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 font-semibold text-white hover:bg-white/[0.06]">
                {tr(language, { en: 'See pricing logic', pl: 'Zobacz logikę cen' })}
              </Link>
            </div>
          </div>

          <div className="example-verdict-board rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(15,23,42,0.72))] p-5 sm:p-6 xl:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">{tr(language, { en: 'Example full decision board', pl: 'Przykładowa pełna tablica decyzji' })}</div>
                <div className="mt-2 text-3xl font-black text-white">{activeScenario.verdict}</div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200">
                <div className="flex items-center justify-between gap-6"><span>{tr(language, { en: 'Score', pl: 'Wynik' })}</span><span className="font-semibold text-white">{activeScenario.score}/100</span></div>
                <div className="mt-2 flex items-center justify-between gap-6"><span>{tr(language, { en: 'Confidence', pl: 'Pewność' })}</span><span className="font-semibold text-white">{activeScenario.confidence}/100</span></div>
                <div className="mt-2 flex items-center justify-between gap-6"><span>{tr(language, { en: 'Risk', pl: 'Ryzyko' })}</span><span className="font-semibold text-white">{activeScenario.risk}</span></div>
                <div className="mt-2 flex items-center justify-between gap-6"><span>{tr(language, { en: 'Usage cost', pl: 'Koszt użycia' })}</span><span className="font-semibold text-white">{activeScenario.usageCost}</span></div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:col-span-3">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{tr(language, { en: 'Executive summary', pl: 'Podsumowanie executive' })}</div>
                <div className="mt-3 text-base font-semibold leading-7 text-white">{activeScenario.summary}</div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{tr(language, { en: 'Why this verdict', pl: 'Dlaczego taki werdykt' })}</div>
                <div className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
                  {activeScenario.why.map((item) => <div key={item}>• {item}</div>)}
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{tr(language, { en: 'Main risks', pl: 'Główne ryzyka' })}</div>
                <div className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
                  {activeScenario.risks.map((item) => <div key={item}>• {item}</div>)}
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{tr(language, { en: 'Recommended next move', pl: 'Rekomendowany kolejny ruch' })}</div>
                <div className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
                  {activeScenario.nextMoves.map((item) => <div key={item}>• {item}</div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}