'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { tr, type Language } from '@/lib/i18n';

type TutorialStepItem = {
  step: string;
  title: string;
  description: string;
};

type TutorialModeProps = {
  language?: string;
  title: string;
  intro: string;
  steps: TutorialStepItem[];
  storageKey?: string;
  tone?: 'cyan' | 'violet' | 'amber' | 'emerald';
  children: ReactNode;
};

type TutorialStepProps = {
  step: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  tone?: 'cyan' | 'violet' | 'amber' | 'emerald';
};

type TutorialHintProps = {
  title: string;
  description: string;
  items?: string[];
  className?: string;
  tone?: 'cyan' | 'violet' | 'amber' | 'emerald';
};

const TutorialContext = createContext(false);
const TutorialActiveStepContext = createContext<string | null>(null);

function copy(language: string | undefined, value: { en: string; pl: string; de?: string; es?: string; pt?: string; ja?: string; zh?: string; id?: string; ru?: string }) {
  return tr((language as Language) || 'en', value);
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function normalizeStep(step?: string | null) {
  return String(step || '').trim().toLowerCase();
}

function getToneClasses(tone: 'cyan' | 'violet' | 'amber' | 'emerald' = 'cyan') {
  if (tone === 'violet') {
    return {
      badge: 'border-violet-300/20 bg-violet-300/10 text-violet-100',
      dot: 'bg-violet-200',
      buttonOn: 'tutorial-toggle-button tutorial-toggle-button-on bg-violet-300 text-slate-950 shadow-[0_18px_50px_rgba(167,139,250,0.20)]',
      heroWrap: 'border-violet-300/20 bg-violet-300/[0.08]',
      label: 'text-violet-200',
      helperWrap: 'border-violet-300/15 bg-violet-400/[0.06]',
      helperChip: 'border-violet-300/20 bg-violet-300/10 text-violet-100',
      selectedCard: 'border-violet-300/30 bg-violet-400/10 shadow-[0_18px_50px_rgba(76,29,149,0.22)]',
      selectedNumber: 'border-violet-300/30 bg-violet-300/15 text-violet-50',
      floatingWrap: 'border-violet-300/20',
      floatingButton: 'bg-violet-300 text-slate-950 hover:bg-violet-200',
      activeStepShell: 'tutorial-spotlight border-violet-300/30 bg-violet-400/[0.03] shadow-[0_0_0_1px_rgba(167,139,250,0.10),0_24px_90px_rgba(167,139,250,0.10)]',
      activeStepHeader: 'border-violet-300/20 bg-slate-950/80 text-slate-200',
      activeStepChip: 'border-violet-300/30 bg-violet-300/10 text-violet-100',
      hintWrap: 'border-violet-300/20 bg-violet-400/[0.07]',
    };
  }

  if (tone === 'amber') {
    return {
      badge: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
      dot: 'bg-amber-200',
      buttonOn: 'tutorial-toggle-button tutorial-toggle-button-on bg-amber-300 text-slate-950 shadow-[0_18px_50px_rgba(251,191,36,0.20)]',
      heroWrap: 'border-amber-300/20 bg-amber-300/[0.08]',
      label: 'text-amber-200',
      helperWrap: 'border-amber-300/15 bg-amber-400/[0.06]',
      helperChip: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
      selectedCard: 'border-amber-300/30 bg-amber-400/10 shadow-[0_18px_50px_rgba(120,53,15,0.22)]',
      selectedNumber: 'border-amber-300/30 bg-amber-300/15 text-amber-50',
      floatingWrap: 'border-amber-300/20',
      floatingButton: 'bg-amber-300 text-slate-950 hover:bg-amber-200',
      activeStepShell: 'tutorial-spotlight border-amber-300/30 bg-amber-400/[0.03] shadow-[0_0_0_1px_rgba(251,191,36,0.10),0_24px_90px_rgba(251,191,36,0.10)]',
      activeStepHeader: 'border-amber-300/20 bg-slate-950/80 text-slate-200',
      activeStepChip: 'border-amber-300/30 bg-amber-300/10 text-amber-100',
      hintWrap: 'border-amber-300/20 bg-amber-400/[0.07]',
    };
  }

  if (tone === 'emerald') {
    return {
      badge: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100',
      dot: 'bg-emerald-200',
      buttonOn: 'tutorial-toggle-button tutorial-toggle-button-on bg-emerald-300 text-slate-950 shadow-[0_18px_50px_rgba(52,211,153,0.20)]',
      heroWrap: 'border-emerald-300/20 bg-emerald-300/[0.08]',
      label: 'text-emerald-200',
      helperWrap: 'border-emerald-300/15 bg-emerald-400/[0.06]',
      helperChip: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100',
      selectedCard: 'border-emerald-300/30 bg-emerald-400/10 shadow-[0_18px_50px_rgba(6,95,70,0.22)]',
      selectedNumber: 'border-emerald-300/30 bg-emerald-300/15 text-emerald-50',
      floatingWrap: 'border-emerald-300/20',
      floatingButton: 'bg-emerald-300 text-slate-950 hover:bg-emerald-200',
      activeStepShell: 'tutorial-spotlight border-emerald-300/30 bg-emerald-400/[0.03] shadow-[0_0_0_1px_rgba(52,211,153,0.10),0_24px_90px_rgba(52,211,153,0.10)]',
      activeStepHeader: 'border-emerald-300/20 bg-slate-950/80 text-slate-200',
      activeStepChip: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
      hintWrap: 'border-emerald-300/20 bg-emerald-400/[0.07]',
    };
  }

  return {
    badge: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100',
    dot: 'bg-cyan-200',
    buttonOn: 'tutorial-toggle-button tutorial-toggle-button-on bg-cyan-300 text-slate-950 shadow-[0_18px_50px_rgba(34,211,238,0.20)]',
    heroWrap: 'border-cyan-300/20 bg-cyan-300/[0.08]',
    label: 'text-cyan-200',
    helperWrap: 'border-emerald-300/15 bg-emerald-400/[0.06]',
    helperChip: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100',
    selectedCard: 'border-cyan-300/30 bg-cyan-400/10 shadow-[0_18px_50px_rgba(8,47,73,0.22)]',
    selectedNumber: 'border-cyan-300/30 bg-cyan-300/15 text-cyan-50',
    floatingWrap: 'border-cyan-300/20',
    floatingButton: 'bg-cyan-300 text-slate-950 hover:bg-cyan-200',
    activeStepShell: 'tutorial-spotlight border-cyan-300/30 bg-cyan-400/[0.03] shadow-[0_0_0_1px_rgba(34,211,238,0.10),0_24px_90px_rgba(34,211,238,0.10)]',
    activeStepHeader: 'border-cyan-300/20 bg-slate-950/80 text-slate-200',
    activeStepChip: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
    hintWrap: 'border-cyan-300/20 bg-cyan-400/[0.07]',
  };
}

export default function TutorialMode({ language = 'en', title, intro, steps, storageKey, tone = 'cyan', children }: TutorialModeProps) {
  const [enabled, setEnabled] = useState(false);
  const [activeStep, setActiveStep] = useState(steps[0]?.step ?? '');
  const [cursorOffset, setCursorOffset] = useState({ x: 0, y: 0 });
  const toneClasses = getToneClasses(tone);

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored === '1') setEnabled(true);
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, enabled ? '1' : '0');
  }, [enabled, storageKey]);

  useEffect(() => {
    if (!steps.length) return;
    const stillExists = steps.some((item) => normalizeStep(item.step) === normalizeStep(activeStep));
    if (!stillExists) setActiveStep(steps[0].step);
  }, [activeStep, steps]);

  useEffect(() => {
    if (enabled && steps[0]) {
      setActiveStep((current) => current || steps[0].step);
    }
  }, [enabled, steps]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    function handlePointer(event: MouseEvent) {
      const x = ((event.clientX / window.innerWidth) - 0.5) * 20;
      const y = ((event.clientY / window.innerHeight) - 0.5) * 16;
      setCursorOffset({ x, y });
    }

    window.addEventListener('mousemove', handlePointer);
    return () => window.removeEventListener('mousemove', handlePointer);
  }, [enabled]);

  const activeIndex = Math.max(
    steps.findIndex((item) => normalizeStep(item.step) === normalizeStep(activeStep)),
    0
  );
  const currentStep = steps[activeIndex] ?? steps[0];

  const helperPoints = [
    copy(language, { en: 'Step 1 opens automatically as soon as guided mode turns on.', pl: 'Krok 1 uruchamia się automatycznie od razu po włączeniu przewodnika.' }),
    copy(language, { en: 'Use Next / Back or click a step chip to move the focus.', pl: 'Użyj Dalej / Wstecz albo kliknij krok, aby przenieść fokus.' }),
    copy(language, { en: 'Only the current section gets the strong spotlight so the page feels clearer.', pl: 'Mocne podświetlenie dostaje tylko bieżąca sekcja, więc strona jest czytelniejsza.' }),
  ];

  function moveStep(direction: -1 | 1) {
    if (!steps.length) return;
    const nextIndex = Math.max(0, Math.min(activeIndex + direction, steps.length - 1));
    setActiveStep(steps[nextIndex].step);
  }

  return (
    <TutorialContext.Provider value={enabled}>
      <TutorialActiveStepContext.Provider value={enabled ? activeStep : null}>
        <section className={cx('tutorial-shell tutorial-shell-active mt-8 premium-panel p-5 sm:p-6', enabled && 'tutorial-shell-on')}>
          <div className="tutorial-hero-strip" />
          <div className="tutorial-toggle-aura" />
          <div className="tutorial-orb tutorial-orb-cyan" />
          <div className="tutorial-orb tutorial-orb-violet" />
          <div className="tutorial-orb tutorial-orb-emerald" />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className={cx('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]', toneClasses.badge)}>
                  <span className={cx('h-2 w-2 rounded-full', toneClasses.dot)} />
                  {copy(language, { en: 'Guided walkthrough', pl: 'Przewodnik krok po kroku' })}
                </div>
                <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">{title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{intro}</p>
              </div>

              <div className="tutorial-toggle-shell flex w-full max-w-xs flex-col gap-2 sm:w-auto">
                <button
                  type="button"
                  aria-pressed={enabled}
                  onClick={() => setEnabled((value) => !value)}
                  className={cx(
                    'tutorial-toggle-button rounded-2xl px-4 py-3 text-sm font-semibold transition',
                    enabled ? toneClasses.buttonOn : 'tutorial-toggle-button-off border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]'
                  )}
                >
                  {enabled
                    ? copy(language, { en: 'Hide guided mode', pl: 'Ukryj tryb przewodnika' })
                    : copy(language, { en: 'Enable guided mode', pl: 'Włącz tryb przewodnika' })}
                </button>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-5 text-slate-300">
                  {enabled
                    ? copy(language, { en: 'Guide mode is on — step 1 is now active and the page will focus one section at a time.', pl: 'Tryb przewodnika jest włączony — krok 1 jest już aktywny, a strona prowadzi po jednej sekcji naraz.' })
                    : copy(language, { en: 'Guide steps stay hidden until you turn the walkthrough on.', pl: 'Kroki przewodnika pozostają ukryte, dopóki nie włączysz samouczka.' })}
                </div>
              </div>
            </div>

            {enabled ? (
              <>
                <div className="mt-5 grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className={cx('tutorial-live-card tutorial-live-card-hero rounded-[24px] border p-4', toneClasses.heroWrap)}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="max-w-2xl">
                        <div className={cx('text-[11px] uppercase tracking-[0.22em]', toneClasses.label)}>{copy(language, { en: 'Active tutorial step', pl: 'Aktywny krok tutorialu' })}</div>
                        <div className={cx('mt-2 inline-flex items-center gap-2 rounded-full border bg-slate-950/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]', toneClasses.helperChip)}>
                          <span>{copy(language, { en: 'Step', pl: 'Krok' })} {currentStep?.step ?? '01'}</span>
                          <span className="text-slate-400">{activeIndex + 1} / {steps.length}</span>
                        </div>
                        <div className="mt-3 text-xl font-black text-white">{currentStep?.title}</div>
                        <p className="mt-2 text-sm leading-6 text-slate-200">{currentStep?.description}</p>
                      </div>

                      <div className="rounded-[20px] border border-white/10 bg-slate-950/70 px-3 py-2 text-xs leading-5 text-slate-300">
                        {copy(language, {
                          en: 'This walkthrough now moves in order instead of only lighting up content already visible on the page.',
                          pl: 'Ten przewodnik prowadzi teraz po kolei, zamiast tylko podświetlać to, co już widzisz na stronie.',
                        })}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => moveStep(-1)}
                        disabled={activeIndex === 0}
                        className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900/80 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {copy(language, { en: 'Back', pl: 'Wstecz' })}
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(1)}
                        disabled={activeIndex >= steps.length - 1}
                        className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {copy(language, { en: 'Next step', pl: 'Dalej' })}
                      </button>
                    </div>
                  </div>

                  <div className={cx('tutorial-live-card rounded-[24px] border p-4', toneClasses.helperWrap)}>
                    <div className={cx('text-[11px] uppercase tracking-[0.22em]', toneClasses.label)}>{copy(language, { en: 'How to use this guide now', pl: 'Jak teraz używać przewodnika' })}</div>
                    <div className="mt-3 space-y-2">
                      {helperPoints.map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/55 px-3 py-3 text-sm text-slate-200 shadow-[0_16px_34px_rgba(2,6,23,0.18)]">
                          <span className={cx('mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold', toneClasses.helperChip)}>{index + 1}</span>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  {steps.map((item, index) => {
                    const selected = normalizeStep(item.step) === normalizeStep(currentStep?.step);

                    return (
                      <button
                        key={`${item.step}-${item.title}`}
                        type="button"
                        onClick={() => setActiveStep(item.step)}
                        className={cx(
                          'tutorial-guide-card rounded-[22px] border p-4 text-left',
                          selected ? toneClasses.selectedCard : 'border-white/10 bg-white/[0.04] hover:border-white/20'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-xs font-black', selected ? toneClasses.selectedNumber : 'border-white/10 bg-slate-900/80 text-slate-100')}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{copy(language, { en: 'Step', pl: 'Krok' })} {item.step}</div>
                            <div className="mt-1 text-base font-bold text-white">{item.title}</div>
                            <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">
                {copy(language, {
                  en: 'Guide cards stay hidden when the walkthrough is off. Turn it on and the tour starts from step 1 automatically with a stronger focus system.',
                  pl: 'Karty przewodnika są ukryte, gdy samouczek jest wyłączony. Po włączeniu startuje automatycznie od kroku 1 i działa w bardziej skupionym trybie.',
                })}
              </div>
            )}
          </div>
        </section>

        <div className="space-y-6">{children}</div>

        {enabled && currentStep ? (
          <div
            className="pointer-events-none fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-5 sm:w-[320px]"
            style={{ transform: `translate3d(${cursorOffset.x}px, ${cursorOffset.y}px, 0)` }}
          >
            <div className="tutorial-floating-shell pointer-events-auto sm:w-[320px]">
              <div className="tutorial-floating-aura" />
              <div className={cx('tutorial-floating-guide rounded-[28px] border bg-slate-950/92 p-4 shadow-[0_24px_80px_rgba(2,6,23,0.65)] backdrop-blur sm:w-[320px]', toneClasses.floatingWrap)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={cx('text-[11px] uppercase tracking-[0.22em]', toneClasses.label)}>{copy(language, { en: 'Floating guide', pl: 'Pływający przewodnik' })}</div>
                  <div className="mt-2 text-lg font-black text-white">{copy(language, { en: 'Step', pl: 'Krok' })} {currentStep.step}</div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  {activeIndex + 1} / {steps.length}
                </div>
              </div>

              <div className="mt-3 text-sm font-semibold text-white">{currentStep.title}</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{currentStep.description}</p>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => moveStep(-1)}
                  disabled={activeIndex === 0}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {copy(language, { en: 'Back', pl: 'Wstecz' })}
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(1)}
                  disabled={activeIndex >= steps.length - 1}
                  className={cx('rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40', toneClasses.floatingButton)}
                >
                  {copy(language, { en: 'Next step', pl: 'Dalej' })}
                </button>
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-xs leading-5 text-slate-300">
                {copy(language, {
                  en: 'You no longer need to return to the top of the page. This controller stays visible while the walkthrough is active.',
                  pl: 'Nie musisz już wracać na górę strony. Ten kontroler zostaje widoczny przez cały aktywny samouczek.',
                })}
              </div>
            </div>
            </div>
          </div>
        ) : null}
      </TutorialActiveStepContext.Provider>
    </TutorialContext.Provider>
  );
}

export function TutorialStep({ step, title, description, children, className, tone = 'cyan' }: TutorialStepProps) {
  const enabled = useContext(TutorialContext);
  const activeStep = useContext(TutorialActiveStepContext);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isActive = enabled && normalizeStep(activeStep) === normalizeStep(step);
  const toneClasses = getToneClasses(tone);

  useEffect(() => {
    if (!isActive || typeof window === 'undefined') return;
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      className={cx(
        className,
        'tutorial-step-shell',
        enabled && 'rounded-[30px] border p-2 transition duration-300',
        enabled && (isActive
          ? toneClasses.activeStepShell
          : 'border-white/5 bg-white/[0.02]')
      )}
    >
      {enabled ? (
        <div className={cx('mb-3 rounded-[20px] border px-4 py-3 text-sm', isActive ? toneClasses.activeStepHeader : 'border-white/10 bg-white/[0.03] text-slate-300')}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-3xl">
              <div className={cx('text-[11px] uppercase tracking-[0.22em]', toneClasses.label)}>Step {step}</div>
              <div className="mt-1 font-bold text-white">{title}</div>
              <p className="mt-1 leading-6 text-slate-300">{description}</p>
            </div>
            <span className={cx('rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]', isActive ? toneClasses.activeStepChip : 'border-white/10 bg-white/[0.04] text-slate-300')}>
              {isActive ? 'Guide focus' : 'Next section'}
            </span>
          </div>
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function TutorialHint({ title, description, items = [], className, tone = 'cyan' }: TutorialHintProps) {
  const enabled = useContext(TutorialContext);
  const toneClasses = getToneClasses(tone);

  if (!enabled) return null;

  return (
    <div className={cx(className, 'tutorial-live-card tutorial-live-hint rounded-[22px] border p-4', toneClasses.hintWrap)}>
      <div className={cx('text-[11px] uppercase tracking-[0.22em]', toneClasses.label)}>Live tutorial hint</div>
      <div className="mt-2 text-base font-bold text-white">{title}</div>
      <p className="mt-1 text-sm leading-6 text-slate-200">{description}</p>
      {items.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {items.map((item, index) => (
            <div key={`${item}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 text-sm text-slate-200">
              <span className={cx('mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold', toneClasses.helperChip)}>{index + 1}</span>
              {item}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
