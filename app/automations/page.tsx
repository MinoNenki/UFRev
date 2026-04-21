import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getAutomationSettings } from '@/lib/profit-config';
import MetricCard from '@/components/pro-ui/MetricCard';
import InsightPanel from '@/components/pro-ui/InsightPanel';
import TutorialMode, { TutorialStep } from '@/components/pro-ui/TutorialMode';
import MarketWatchPanel from '@/components/MarketWatchPanel';
import PremiumFeatureGate from '@/components/pro-ui/PremiumFeatureGate';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';
import { getAutomationAccess } from '@/lib/plan-access';

export default async function AutomationsPage() {
  const language = await getLanguage();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase.from('profiles').select('role, plan_key').eq('id', user.id).single();
  const settings = await getAutomationSettings();
  const access = getAutomationAccess(profile?.plan_key);

  const tutorialSteps = [
    {
      step: '01',
      title: tr(language, { en: 'See what is working for you', pl: 'Zobacz co już działa za Ciebie' }),
      description: tr(language, { en: 'Start with the top metrics to understand which automations are already helping your business.', pl: 'Zacznij od górnych wskaźników, aby zobaczyć które automatyzacje już pomagają Twojemu biznesowi.' }),
    },
    {
      step: '02',
      title: tr(language, { en: 'Use automations to save time', pl: 'Używaj automatyzacji, aby oszczędzać czas' }),
      description: tr(language, { en: 'This page is meant to reduce repetitive checking, manual analysis, and reactive decision-making.', pl: 'Ta strona ma ograniczać powtarzalne sprawdzanie, ręczne analizy i reaktywne decyzje.' }),
    },
    {
      step: '03',
      title: tr(language, { en: 'Track competitors and market changes', pl: 'Śledź konkurencję i zmiany na rynku' }),
      description: tr(language, { en: 'The live market section helps you quickly notice opportunities, risks, and price pressure.', pl: 'Sekcja live market pomaga szybko zauważyć okazje, ryzyka i presję cenową.' }),
    },
    {
      step: '04',
      title: tr(language, { en: 'Scale with more confidence', pl: 'Skaluj z większą pewnością' }),
      description: tr(language, { en: 'Keep the anti-loss layer visible so automation supports growth instead of creating chaos.', pl: 'Trzymaj warstwę anti-loss na widoku, aby automatyzacja wspierała wzrost zamiast tworzyć chaos.' }),
    },
  ];

  const automationBenefits = [
    tr(language, { en: 'You spend less time checking everything manually and more time acting on what matters.', pl: 'Spędzasz mniej czasu na ręcznym sprawdzaniu wszystkiego, a więcej na działaniu tam, gdzie to ma znaczenie.' }),
    tr(language, { en: 'Important signals show up faster, so you can react before costs grow or demand drops.', pl: 'Ważne sygnały pojawiają się szybciej, więc możesz reagować zanim koszty wzrosną albo popyt spadnie.' }),
    tr(language, { en: 'The page is designed to feel like a business assistant, not a technical control room.', pl: 'Ta strona ma działać jak biznesowy asystent, a nie techniczny panel sterowania.' }),
    tr(language, { en: 'You keep better discipline around margin, reviews, and ads without adding more daily workload.', pl: 'Utrzymujesz lepszą dyscyplinę wokół marży, opinii i reklam bez dokładania sobie codziennej pracy.' }),
  ];

  const faqItems = [
    tr(language, { en: 'Start from the automations marked as active — these already support your daily workflow.', pl: 'Zacznij od automatyzacji oznaczonych jako aktywne — one już wspierają Twój codzienny workflow.' }),
    tr(language, { en: 'Use competitor scans when you want to compare prices, watch pressure, or prepare a safer next move.', pl: 'Używaj skanów konkurencji, gdy chcesz porównać ceny, obserwować presję albo przygotować bezpieczniejszy kolejny ruch.' }),
    tr(language, { en: 'Treat margin and ad safeguards as your protection layer, especially before scaling budget.', pl: 'Traktuj zabezpieczenia marży i reklam jako warstwę ochronną, szczególnie przed zwiększaniem budżetu.' }),
    tr(language, { en: 'If you are unsure, use tutorial mode to follow the page step by step.', pl: 'Jeśli nie masz pewności, włącz tryb samouczka i przejdź przez stronę krok po kroku.' }),
  ];

  const upgradePlanName = 'Scale';

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-14 text-white sm:px-6">
      <section className="mesh-panel animate-aurora relative rounded-[40px] p-8 shadow-[0_30px_140px_rgba(2,6,23,0.65)]">
        <div className="spotlight-sweep" />
        <div className="noise-overlay" />
        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Automation growth layer', pl: 'Warstwa wzrostu przez automatyzacje' })}</div>
          <h1 className="mt-4 text-5xl font-black tracking-tight">{tr(language, { en: 'Save time, react faster, and protect margin with smart automations', pl: 'Oszczędzaj czas, reaguj szybciej i chroń marżę dzięki smart automatyzacjom' })}</h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">{tr(language, { en: 'This page shows the automations that can quietly support your sales, reviews, competitor tracking, and spend discipline — without forcing you into a complicated technical setup.', pl: 'Ta strona pokazuje automatyzacje, które mogą po cichu wspierać Twoją sprzedaż, opinie, monitoring konkurencji i dyscyplinę wydatków — bez wciskania Cię w skomplikowaną techniczną konfigurację.' })}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-2xl border border-white/10 px-5 py-3 font-semibold hover:bg-white/5">{tr(language, { en: 'Back to dashboard', pl: 'Wróć do dashboardu' })}</Link>
            {profile?.role === 'admin' && <Link href="/admin/automations" className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">{tr(language, { en: 'Admin automation settings', pl: 'Ustawienia automatyzacji admina' })}</Link>}
          </div>
        </div>
      </section>

      <TutorialMode
        language={language}
        title={tr(language, { en: 'Want a guided version of this page?', pl: 'Chcesz prowadzonej wersji tej strony?' })}
        intro={tr(language, { en: 'Enable tutorial mode to highlight the most important sections and explain what to do next.', pl: 'Włącz tryb samouczka, aby podświetlić najważniejsze sekcje i zobaczyć co zrobić dalej.' })}
        steps={tutorialSteps}
        storageKey="ufrev-automations-tutorial"
      >
        <TutorialStep
          step="01"
          title={tr(language, { en: 'Start with your status cards', pl: 'Zacznij od kart statusu' })}
          description={tr(language, { en: 'These cards tell you what is already active and where you already have support in place.', pl: 'Te karty pokazują co jest już aktywne i gdzie masz już gotowe wsparcie.' })}
        >
          <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard language={language} label={tr(language, { en: 'Competitor scans', pl: 'Skany konkurencji' })} value={settings.autoCompetitorScans ? tr(language, { en: 'Active', pl: 'Aktywne' }) : tr(language, { en: 'Inactive', pl: 'Nieaktywne' })} delta={tr(language, { en: 'Market intelligence', pl: 'Inteligencja rynku' })} tone="cyan" />
            <MetricCard language={language} label={tr(language, { en: 'Margin alerts', pl: 'Alerty marży' })} value={settings.autoMarginAlerts ? tr(language, { en: 'Active', pl: 'Aktywne' }) : tr(language, { en: 'Inactive', pl: 'Nieaktywne' })} delta={tr(language, { en: 'Profit discipline', pl: 'Dyscyplina zysku' })} tone="emerald" />
            <MetricCard language={language} label={tr(language, { en: 'Review requests', pl: 'Prośby o opinie' })} value={settings.autoReviewRequests ? tr(language, { en: 'Active', pl: 'Aktywne' }) : tr(language, { en: 'Inactive', pl: 'Nieaktywne' })} delta={tr(language, { en: 'Trust automation', pl: 'Automatyzacja zaufania' })} tone="violet" />
            <MetricCard language={language} label={tr(language, { en: 'Ad safeguards', pl: 'Zabezpieczenia reklam' })} value={settings.autoPauseLowMarginAds ? tr(language, { en: 'Active', pl: 'Aktywne' }) : tr(language, { en: 'Inactive', pl: 'Nieaktywne' })} delta={tr(language, { en: 'Spend protection', pl: 'Ochrona budżetu' })} tone="amber" />
          </section>
        </TutorialStep>

        <TutorialStep
          step="02"
          title={tr(language, { en: 'Understand the business value', pl: 'Zrozum korzyść biznesową' })}
          description={tr(language, { en: 'These explanations translate automation into concrete customer benefits instead of technical language.', pl: 'Te wyjaśnienia tłumaczą automatyzację na konkretne korzyści dla klienta zamiast technicznego języka.' })}
        >
          <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <InsightPanel language={language} title={tr(language, { en: 'Why clients like this section', pl: 'Dlaczego klienci lubią tę sekcję' })} items={automationBenefits} />
            <InsightPanel language={language} title={tr(language, { en: 'How to use it well', pl: 'Jak dobrze z tego korzystać' })} items={faqItems} />
          </section>
        </TutorialStep>

        <TutorialStep
          step="03"
          title={tr(language, { en: 'Use live market watch', pl: 'Korzystaj z live market watch' })}
          description={tr(language, { en: 'This is the fastest place to compare your offer against competitors and see pressure before it hurts margin.', pl: 'To najszybsze miejsce, by porównać ofertę z konkurencją i zobaczyć presję zanim uderzy w marżę.' })}
        >
          <section className="mt-8">
            {access.hasMarketWatch ? (
              <MarketWatchPanel currentLanguage={language} />
            ) : (
              <PremiumFeatureGate copy={{
                eyebrow: tr(language, { en: 'Protected premium feature', pl: 'Chroniona funkcja premium' }),
                title: tr(language, { en: 'Live market watch unlocks from Scale', pl: 'Live market watch odblokowuje się od planu Scale' }),
                description: tr(language, { en: 'Competitor pressure, safer pricing reactions, and recurring market watch belong in a paid protection layer. Keeping this behind a higher tier improves margin quality and reduces costly low-intent usage.', pl: 'Presja konkurencji, bezpieczniejsze reakcje cenowe i cykliczny market watch powinny należeć do płatnej warstwy ochronnej. Trzymanie tego za wyższym planem poprawia jakość marży i ogranicza kosztowne użycie przez użytkowników o niskiej intencji.' }),
                cta: tr(language, { en: `Upgrade to ${upgradePlanName}`, pl: `Przejdź na ${upgradePlanName}` }),
                hint: tr(language, { en: 'Pro keeps the automation workspace visible. Scale unlocks live competitor watch and premium alert routing for the heaviest operators.', pl: 'Pro utrzymuje widoczność workspace automatyzacji. Scale odblokowuje live competitor watch i premium routing alertów dla najcięższych operatorów.' }),
              }} />
            )}
          </section>
        </TutorialStep>

        <TutorialStep
          step="04"
          title={tr(language, { en: 'Keep growth safe', pl: 'Utrzymuj bezpieczny wzrost' })}
          description={tr(language, { en: 'Automation here is meant to support confidence and consistency, not take risky decisions for you blindly.', pl: 'Automatyzacja tutaj ma wspierać pewność i regularność działania, a nie podejmować ryzykowne decyzje za Ciebie w ciemno.' })}
        >
          <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <InsightPanel language={language} title={tr(language, { en: 'How this helps revenue', pl: 'Jak to wspiera przychód' })} items={[
              tr(language, { en: 'Less manual work means more time for actions that actually move sales.', pl: 'Mniej ręcznej pracy oznacza więcej czasu na działania, które realnie ruszają sprzedaż.' }),
              tr(language, { en: 'Margin alerts help you avoid hidden losses before they compound.', pl: 'Alerty marży pomagają uniknąć ukrytych strat, zanim się nawarstwią.' }),
              tr(language, { en: access.hasAlertRouting ? 'Premium alert routing is unlocked, so important signals can move faster across your operator stack.' : 'Automations make the product feel more premium and more valuable to end clients, which is why advanced routing is held for higher plans.', pl: access.hasAlertRouting ? 'Premium routing alertów jest odblokowany, więc ważne sygnały mogą szybciej płynąć przez Twój stack operacyjny.' : 'Automatyzacje sprawiają, że produkt jest bardziej premium i bardziej wartościowy dla końcowych klientów, dlatego zaawansowany routing jest trzymany dla wyższych planów.' }),
            ]} />
            <InsightPanel language={language} title={tr(language, { en: 'Protection still stays in place', pl: 'Warstwa ochrony nadal pozostaje aktywna' })} items={[
              tr(language, { en: 'The anti-loss logic still protects usage, budget awareness, and safer next moves.', pl: 'Logika anti-loss nadal chroni użycie, świadomość budżetu i bezpieczniejsze kolejne ruchy.' }),
              tr(language, { en: 'This redesign improves clarity and marketing value without removing safeguards.', pl: 'Ten redesign poprawia czytelność i wartość marketingową bez usuwania zabezpieczeń.' }),
            ]} />
          </section>
        </TutorialStep>
      </TutorialMode>
    </main>
  );
}
