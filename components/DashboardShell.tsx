'use client';

import { useMemo, useState } from 'react';
import AnalyzeForm from '@/components/AnalyzeForm';
import DecisionResult, { AdvancedDecisionReasoning } from '@/components/DecisionResult';
import RewardAdsPanel from '@/components/RewardAdsPanel';
import ReferralPanel from '@/components/ReferralPanel';
import Simulator from '@/components/whatif/Simulator';
import TutorialMode, { TutorialStep } from '@/components/pro-ui/TutorialMode';
import { tr, type Language } from '@/lib/i18n';

const tt = tr;

type Decision = any;

export default function DashboardShell({
  language,
  initialLatestDecision,
  rewardAdsProps,
  referralProps,
}: {
  language: Language;
  initialLatestDecision: Decision | null;
  rewardAdsProps: {
    initialCredits: number;
    watchedToday: number;
    dailyLimit: number;
    rewardCredits: number;
    rewardToken: string;
  };
  referralProps: {
    referralCode: string;
    rewardCredits: number;
  };
}) {
  const [currentDecision, setCurrentDecision] = useState<Decision | null>(initialLatestDecision);

  const panelTitle = useMemo(
    () =>
      currentDecision === initialLatestDecision
        ? tt(language, {
            en: 'Latest saved result',
            pl: 'Najnowszy zapisany wynik',
            de: 'Neuester gespeicherter Bericht',
            es: 'Último resultado guardado',
            ja: '最新の保存結果',
            zh: '最近保存的结果',
            ru: 'Последний сохранённый результат',
            pt: 'Último resultado guardado',
          })
        : tt(language, {
            en: 'Current result',
            pl: 'Aktualny wynik',
            de: 'Aktuelles Ergebnis',
            es: 'Resultado actual',
            ja: '現在の結果',
            zh: '当前结果',
            id: 'Hasil saat ini',
            ru: 'Текущий результат',
            pt: 'Resultado atual',
          }),
    [currentDecision, initialLatestDecision, language]
  );

  const liveSignalCount = Array.isArray(currentDecision?.marketSignals) ? currentDecision.marketSignals.length : 0;
  const marketStatus = typeof currentDecision?.marketWatch?.status === 'string' ? currentDecision.marketWatch.status.toUpperCase() : tt(language, { en: 'LIVE', pl: 'LIVE' });
  const confidenceValue = typeof currentDecision?.confidence === 'number' ? `${currentDecision.confidence}/100` : tt(language, { en: 'Protected', pl: 'Chronione' });

  const quickVisibilityCards = [
    {
      label: tt(language, { en: 'Market radar', pl: 'Market radar' }),
      value: marketStatus,
      note: currentDecision?.marketWatch?.headline || tt(language, { en: 'Competitor and market signals stay in view.', pl: 'Sygnały konkurencji i rynku są stale widoczne.' }),
    },
    {
      label: tt(language, { en: 'Signal layer', pl: 'Warstwa sygnałów' }),
      value: liveSignalCount ? `${liveSignalCount}` : tt(language, { en: 'Armed', pl: 'Uzbrojona' }),
      note: liveSignalCount
        ? tt(language, { en: 'Fresh intelligence cues detected in the current view.', pl: 'W bieżącym widoku wykryto świeże sygnały inteligencji.' })
        : tt(language, { en: 'The alert layer is ready for the next analysis.', pl: 'Warstwa alertów jest gotowa na kolejną analizę.' }),
    },
    {
      label: tt(language, { en: 'Scenario lab', pl: 'Scenario lab' }),
      value: tt(language, { en: 'Interactive', pl: 'Interaktywny' }),
      note: tt(language, { en: 'Price, cost, demand, and competition what-if controls now sit inside the result view.', pl: 'Kontrola what-if dla ceny, kosztu, popytu i konkurencji jest teraz w widoku wyniku.' }),
    },
    {
      label: tt(language, { en: 'Anti-loss confidence', pl: 'Pewność anti-loss' }),
      value: confidenceValue,
      note: tt(language, { en: 'Safeguards remain visible so growth still feels safe, not chaotic.', pl: 'Zabezpieczenia pozostają widoczne, więc wzrost nadal jest bezpieczny, a nie chaotyczny.' }),
    },
  ];

  const tutorialSteps = [
    {
      step: '01',
      title: tt(language, { en: 'Read the dashboard pulse first', pl: 'Najpierw odczytaj puls dashboardu' }),
      description: tt(language, { en: 'These cards show whether your market view, signals, scenario tools, and protection layer are ready.', pl: 'Te karty pokazują czy widok rynku, sygnały, scenariusze i warstwa ochrony są już gotowe.' }),
    },
    {
      step: '02',
      title: tt(language, { en: 'Run or review an analysis', pl: 'Uruchom lub przejrzyj analizę' }),
      description: tt(language, { en: 'Use the form on the left to check an idea, URL, screenshot, or PDF and get a concrete verdict.', pl: 'Użyj formularza po lewej, aby sprawdzić pomysł, URL, screen albo PDF i dostać konkretny werdykt.' }),
    },
    {
      step: '03',
      title: tt(language, { en: 'Use rewards and referrals', pl: 'Korzystaj z nagród i poleceń' }),
      description: tt(language, { en: 'These panels help you unlock more AI usage and invite others without leaving the dashboard.', pl: 'Te panele pomagają odblokować więcej użycia AI i zapraszać innych bez opuszczania dashboardu.' }),
    },
  ];

  return (
    <TutorialMode
      language={language}
      title={tt(language, { en: 'Need help using the main dashboard?', pl: 'Potrzebujesz pomocy z głównym dashboardem?' })}
      intro={tt(language, { en: 'Turn on tutorial mode to highlight the most important areas and follow the page step by step.', pl: 'Włącz tryb samouczka, aby podświetlić najważniejsze obszary i przejść przez stronę krok po kroku.' })}
      steps={tutorialSteps}
      storageKey="ufrev-dashboard-tutorial"
    >
      <section className="mb-5 hidden rounded-[24px] border border-cyan-300/20 bg-cyan-300/10 p-4 sm:block sm:p-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-100">{tt(language, { en: 'Quick start for new users', pl: 'Szybki start dla nowych użytkowników' })}</div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {[
            {
              title: tt(language, { en: '1. Enter your idea', pl: '1. Wpisz pomysł' }),
              text: tt(language, { en: 'Paste link/text or add file. Keep it short and specific.', pl: 'Wklej link/tekst albo dodaj plik. Krótko i konkretnie.' }),
            },
            {
              title: tt(language, { en: '2. Read 4 key fields', pl: '2. Przeczytaj 4 pola' }),
              text: tt(language, { en: 'Verdict, margin/readiness, risk, and next step.', pl: 'Werdykt, marża/gotowość, ryzyko i następny krok.' }),
            },
            {
              title: tt(language, { en: '3. Launch controlled test', pl: '3. Uruchom kontrolowany test' }),
              text: tt(language, { en: 'Use the recommended order and avoid full-scale entry.', pl: 'Użyj rekomendowanej kolejności i unikaj pełnego wejścia od razu.' }),
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <div className="text-sm font-semibold text-white">{item.title}</div>
              <div className="mt-2 text-sm leading-6 text-slate-300">{item.text}</div>
            </div>
          ))}
        </div>
      </section>

      <TutorialStep
        step="01"
        title={tt(language, { en: 'Start with the top dashboard signals', pl: 'Zacznij od górnych sygnałów dashboardu' })}
        description={tt(language, { en: 'This row tells you what is happening right now: market view, live signals, scenario tools, and safety confidence.', pl: 'Ten rząd pokazuje co dzieje się teraz: widok rynku, live signals, scenariusze i pewność bezpieczeństwa.' })}
      >
        <div className="hidden gap-4 md:grid xl:grid-cols-4">
          {quickVisibilityCards.map((item, index) => (
            <div key={`${item.label}-${index}`} className="dashboard-signal-card metric-card-3d group relative overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/55 p-5 shadow-[0_18px_80px_rgba(2,6,23,0.45)] transition duration-300 hover:-translate-y-1 hover:border-amber-200/20 sm:p-6">
              <div className={`absolute inset-0 opacity-80 ${[
                'bg-gradient-to-br from-amber-300/18 via-transparent to-transparent',
                'bg-gradient-to-br from-amber-200/16 via-transparent to-transparent',
                'bg-gradient-to-br from-fuchsia-400/12 via-transparent to-transparent',
                'bg-gradient-to-br from-rose-400/16 via-transparent to-transparent',
              ][index]}`} />
              <div className="metric-card-grid absolute inset-0 opacity-40" />
              <div className="metric-card-floor absolute inset-x-[12%] bottom-2 h-8 rounded-full blur-xl bg-amber-300/15" />
              <div className="relative">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{item.label}</div>
                <div className="mt-3 text-[clamp(1.8rem,2.5vw,2.5rem)] font-black leading-[0.96] tracking-[-0.04em] text-white break-normal [overflow-wrap:anywhere]">{item.value}</div>
                <div className="mt-3 text-sm leading-7 text-slate-300">{item.note}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="dashboard-signal-mobile-grid grid grid-cols-2 gap-1.5 md:hidden">
          {quickVisibilityCards.map((item, index) => index < 4 && (
            <div key={item.label} className="w-full rounded-xl border border-white/10 bg-slate-950/45 px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-[0.15em] text-slate-500">{item.label}</div>
              <div className="mt-0.5 text-xs font-black text-white break-normal [overflow-wrap:anywhere]">{item.value}</div>
              <div className="mt-0.5 text-[10px] text-slate-400 line-clamp-1">{item.note}</div>
            </div>
          ))}
        </div>
      </TutorialStep>

      <TutorialStep
        step="02"
        title={tt(language, { en: 'Run an analysis or review the latest result', pl: 'Uruchom analizę albo przejrzyj ostatni wynik' })}
        description={tt(language, { en: 'Use the left form to send data in, then read the result panel on the right for the safest next move.', pl: 'Użyj formularza po lewej, aby wysłać dane, a potem przeczytaj panel wyniku po prawej, by zobaczyć najbezpieczniejszy kolejny ruch.' })}
      >
        <section id="analyze-form-anchor" className="grid items-start gap-3 2xl:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)] 2xl:gap-7 sm:gap-5">
        <AnalyzeForm currentLanguage={language} onResultChange={setCurrentDecision} />

        <div className="min-w-0 space-y-3 sm:space-y-5">
        <div className="mesh-panel dashboard-premium-shell dashboard-result-shell glow-ring p-4 sm:p-5 xl:p-6 2xl:p-7">
          <div className="spotlight-sweep" />
          <div className="noise-overlay" />
          <div className="dashboard-result-aura" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">
                {tt(language, {
                  en: 'Your decision guide',
                  pl: 'Twój przewodnik decyzji',
                  de: 'Globales Entscheidungszentrum',
                  es: 'Centro global de decisión',
                  ja: 'グローバル意思決定コマンド',
                  zh: '全球决策指挥台',
                  id: 'Command keputusan global',
                  ru: 'Глобальный командный центр решений',
                  pt: 'Centro global de decisão',
                })}
              </div>

              <h2 className="mt-2 text-2xl font-black sm:text-3xl">{panelTitle}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 xl:max-w-[72ch]">
                {tt(language, {
                  en: 'This result area is built to give you one clear answer, explain why, and help you move forward with less doubt.',
                  pl: 'Ten obszar wyniku ma dać Ci jedną jasną odpowiedź, wyjaśnić dlaczego i pomóc ruszyć dalej z mniejszą niepewnością.',
                  de: 'Ein Enterprise-Layout mit Fokus auf Endurteil, Lesbarkeit und schnellere Operator-Entscheidungen.',
                  es: 'Diseño de nivel enterprise centrado en el veredicto final, la legibilidad y decisiones más rápidas.',
                  ja: '最終判断の見やすさと素早い意思決定に集中したエンタープライズ級レイアウトです。',
                  zh: '面向最终结论、可读性和更快决策的企业级布局。',
                  id: 'Layout kelas enterprise yang fokus pada verdict akhir, keterbacaan, dan keputusan yang lebih cepat.',
                  ru: 'Enterprise-верстка с фокусом на финальном вердикте, читабельности и более быстрых решениях.',
                  pt: 'Layout de nível enterprise focado no veredito final, legibilidade e decisões mais rápidas.',
                })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="glass-chip border-white/10 bg-white/[0.04] text-slate-100">{tt(language,{en:'Vision',pl:'Vision',de:'Vision',es:'Visión',pt:'Visão',ja:'ビジョン',zh:'视觉',id:'Vision',ru:'Вижн'})}</span>
                <span className="glass-chip border-white/10 bg-white/[0.04] text-slate-100">PDF</span>
                <span className="glass-chip border-white/10 bg-white/[0.04] text-slate-100">{tt(language,{en:'Pricing',pl:'Ceny',de:'Preise',es:'Precios',pt:'Preços',ja:'価格',zh:'定价',id:'Harga',ru:'Цены'})}</span>
                <span className="glass-chip border-white/10 bg-white/[0.04] text-slate-100">{tt(language,{en:'Anti-loss',pl:'Anti-loss',de:'Anti-Loss',es:'Anti-loss',pt:'Anti-loss',ja:'損失防止',zh:'防亏损',id:'Anti-loss',ru:'Anti-loss'})}</span>
              </div>
            </div>

            <div className={`rounded-2xl border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${currentDecision ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-300'}`}>
              {currentDecision
                ? tt(language, { en: 'Live verdict loaded', pl: 'Werdykt aktywny', de: 'Live-Urteil geladen', es: 'Veredicto activo', pt: 'Veredito carregado', ja: 'ライブ判定を読み込み済み', zh: '实时结论已加载', id: 'Verdict live sudah dimuat', ru: 'Вердикт загружен' })
                : tt(language, { en: 'Awaiting analysis', pl: 'Oczekiwanie na analizę', de: 'Warte auf Analyse', es: 'Esperando análisis', pt: 'Aguardando análise', ja: '分析待機中', zh: '等待分析中', id: 'Menunggu analisis', ru: 'Ожидание анализа' })}
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(2,6,23,0.08))] p-1 sm:mt-5 sm:rounded-[28px] sm:p-2">
            {currentDecision ? (
              <DecisionResult result={currentDecision} currentLanguage={language} />
            ) : (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-slate-300">
                {tt(language, {
                  en: 'Run an analysis on the left and this area will turn your input into a clear recommendation you can review immediately.',
                  pl: 'Uruchom analizę po lewej stronie, a ten obszar zamieni Twoje dane w jasną rekomendację, którą od razu możesz przejrzeć.',
                  de: 'Starte links eine Analyse. Diese Ansicht zeigt das neueste Urteil in einem breiteren Executive-Layout.',
                  es: 'Ejecuta un análisis a la izquierda. Esta vista mostrará el último veredicto en un diseño ejecutivo más amplio.',
                  ja: '左側で分析を実行すると、このビューに最新の判定が広いエグゼクティブレイアウトで表示されます。',
                  zh: '在左侧运行分析后，此视图会以更宽的高管式布局显示最新结论。',
                  id: 'Jalankan analisis di sisi kiri. Tampilan ini akan menampilkan verdict terbaru dalam layout eksekutif yang lebih lebar.',
                  ru: 'Запусти анализ слева. Здесь появится свежий вердикт в более широком executive-формате.',
                })}
              </div>
            )}
          </div>
        </div>

        <TutorialStep
          step="03"
          title={tt(language, { en: 'Use rewards and referrals to extend usage', pl: 'Korzystaj z nagród i poleceń, aby zwiększyć użycie' })}
          description={tt(language, { en: 'These panels are here to help you get more AI tokens and grow your usage without friction.', pl: 'Te panele pomagają zdobyć więcej tokenów AI i rozwijać użycie bez zbędnego tarcia.' })}
        >
          <div className="grid gap-3 sm:gap-6 xl:grid-cols-2">
            <RewardAdsPanel currentLanguage={language} {...rewardAdsProps} />
            <ReferralPanel currentLanguage={language} {...referralProps} />
          </div>
        </TutorialStep>

        {currentDecision ? (
          <div className="mt-6">
            <Simulator result={currentDecision} currentLanguage={language} />
          </div>
        ) : null}
      </div>
      </section>

      {currentDecision ? (
        <>
          <div className="mt-5 md:hidden">
            <details open className="mobile-advanced-wrapper rounded-[24px] border border-white/10 bg-slate-950/45 p-2.5">
              <summary className="cursor-pointer list-none rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2.5 text-sm font-semibold text-cyan-100">
                {tt(language, { en: 'Show full reasoning and rollout plan', pl: 'Pokaż pełne uzasadnienie i plan wdrożenia' })}
              </summary>
              <div className="mt-3">
                <AdvancedDecisionReasoning result={currentDecision} currentLanguage={language} />
              </div>
            </details>
          </div>
          <div className="mt-7 hidden md:block">
            <AdvancedDecisionReasoning result={currentDecision} currentLanguage={language} />
          </div>
        </>
      ) : null}
      </TutorialStep>
    </TutorialMode>
  );
}