import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { CREDIT_PACK_ORDER, PLAN_ORDER } from '@/lib/plans';
import { getRewardSettings, getReferralSettings, getMonetizationSettings } from '@/lib/app-config';
import MetricCard from '@/components/pro-ui/MetricCard';
import TrendChart from '@/components/pro-ui/TrendChart';
import InsightPanel from '@/components/pro-ui/InsightPanel';
import TutorialMode, { TutorialStep } from '@/components/pro-ui/TutorialMode';
import AdsAdminPanel from '@/components/admin/AdsAdminPanel';
import AdminAdsProvidersPanel from '@/components/admin/AdminAdsProvidersPanel';
import DisplayAdMock from '@/components/ads/DisplayAdMock';
import { getRevenueAnalyticsSnapshot } from '@/lib/revenue-analytics';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';

export default async function AdminMonetizationPage({ searchParams }: { searchParams?: { updated?: string; error?: string } }) {
  const language = await getLanguage();
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) redirect('/dashboard');

  const params = searchParams || {};
  const rewardSettings = await getRewardSettings();
  const referralSettings = await getReferralSettings();
  const monetizationSettings = await getMonetizationSettings();
  const revenueAnalytics = await getRevenueAnalyticsSnapshot(monetizationSettings);
  const [{ count: rewardEventsCount }, { count: payingUsersCount }, { data: recentRewards }] = await Promise.all([
    supabaseAdmin.from('credit_reward_events').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).neq('plan_key', 'free'),
    supabaseAdmin.from('credit_reward_events').select('id, user_id, reward_date, ads_watched, credits_granted, reward_unlocked').order('reward_date', { ascending: false }).limit(20),
  ]);

  const tutorialSteps = [
    {
      step: '01',
      title: tr(language, { en: 'Read revenue health first', pl: 'Najpierw odczytaj kondycję przychodu' }),
      description: tr(language, { en: 'Top metrics and the revenue chart tell you if subscriptions, checkout intent, and monetization quality are moving in the right direction.', pl: 'Górne metryki i wykres przychodu pokazują czy subskrypcje, intencja checkoutu i jakość monetyzacji idą we właściwym kierunku.' }),
    },
    {
      step: '02',
      title: tr(language, { en: 'Review owner and cohort signals', pl: 'Sprawdź sygnały owner i kohort' }),
      description: tr(language, { en: 'This layer helps you separate top-line revenue from paid-user quality and retention shape.', pl: 'Ta warstwa pomaga oddzielić przychód top-line od jakości płatnych użytkowników i kształtu retencji.' }),
    },
    {
      step: '03',
      title: tr(language, { en: 'Tune ads, packs, and reward settings', pl: 'Dostrój reklamy, pakiety i nagrody' }),
      description: tr(language, { en: 'Use these blocks to keep free activation useful without weakening subscription value.', pl: 'Używaj tych bloków tak, aby darmowa aktywacja była użyteczna, ale nie osłabiała wartości subskrypcji.' }),
    },
    {
      step: '04',
      title: tr(language, { en: 'Inspect the monetization funnel last', pl: 'Na końcu sprawdź lejek monetyzacji' }),
      description: tr(language, { en: 'Execution logs and funnel metrics show where pricing, paywall, or pitch quality still breaks.', pl: 'Logi wykonania i metryki lejka pokazują gdzie nadal pęka cena, paywall albo jakość komunikatu.' }),
    },
  ];

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-16 text-white">
      <section className="mesh-panel relative p-8 shadow-[0_30px_140px_rgba(2,6,23,0.65)]">
        <div className="spotlight-sweep" />
        <div className="noise-overlay" />
        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Admin / monetization', pl: 'Admin / monetyzacja', es: 'Admin / monetización', ru: 'Admin / монетизация' })}</div>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">{tr(language, { en: 'Global revenue operating system', pl: 'Globalny system operacyjny przychodu', es: 'Sistema operativo global de ingresos', ru: 'Глобальная операционная система выручки' })}</h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">{tr(language, { en: 'Cleaner pricing controls, faster monetization presets, and the same protected anti-loss economics underneath.', pl: 'Czytelniejsze sterowanie cenami, szybsze presety monetyzacji i ta sama chroniona ekonomia anti-loss pod spodem.', es: 'Controles de precios más limpios, presets de monetización más rápidos y la misma economía anti-loss protegida debajo.', ru: 'Более чистое управление ценами, быстрые monetization-пресеты и та же защищённая anti-loss экономика внутри.' })}</p>
        </div>
      </section>

      {(params.updated || params.error) && (
        <div className={`mt-6 rounded-2xl border p-4 ${params.updated ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200' : 'border-rose-300/30 bg-rose-300/10 text-rose-200'}`}>
          {params.updated
            ? tr(language, { en: 'Settings saved successfully.', pl: 'Ustawienia zapisano pomyślnie.', es: 'La configuración se guardó correctamente.', ru: 'Настройки успешно сохранены.' })
            : tr(language, { en: 'Could not save changes.', pl: 'Nie udało się zapisać zmian.', es: 'No se pudieron guardar los cambios.', ru: 'Не удалось сохранить изменения.' })}
        </div>
      )}

      <TutorialMode
        language={language}
        title={tr(language, { en: 'Need a monetization guide?', pl: 'Potrzebujesz przewodnika po monetyzacji?' })}
        intro={tr(language, { en: 'Turn on guide mode to read this page in revenue order: top health, owner signals, monetization controls, and funnel diagnostics.', pl: 'Włącz tryb przewodnika, aby czytać tę stronę w kolejności przychodowej: zdrowie biznesu, sygnały ownera, kontrolki monetyzacji i diagnostyka lejka.' })}
        steps={tutorialSteps}
        storageKey="ufrev-admin-monetization-tutorial"
        tone="amber"
      >
        <TutorialStep
          step="01"
          title={tr(language, { en: 'Start from revenue health', pl: 'Zacznij od kondycji przychodu' })}
          description={tr(language, { en: 'These metrics and the pricing trend chart tell you whether paid demand and monetization efficiency are healthy.', pl: 'Te metryki i wykres trendu cenowego pokazują czy płatny popyt i efektywność monetyzacji są zdrowe.' })}
          tone="amber"
        >
      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label={tr(language, { en: 'Paid users', pl: 'Płatni użytkownicy', es: 'Usuarios de pago', ru: 'Платные пользователи' })} value={String(payingUsersCount ?? 0)} delta={tr(language, { en: 'Subscription base', pl: 'Baza subskrypcji', es: 'Base de suscripción', ru: 'База подписок' })} tone="emerald" />
        <MetricCard label={tr(language, { en: 'Checkout intents', pl: 'Intencje checkoutu', es: 'Intenciones de checkout', ru: 'Намерения checkout' })} value={String(revenueAnalytics.checkoutIntentCount)} delta={tr(language, { en: 'Buyer intent', pl: 'Intencja zakupu', es: 'Intención de compra', ru: 'Покупательское намерение' })} tone="cyan" />
        <MetricCard label={tr(language, { en: 'Purchases', pl: 'Zakupy', es: 'Compras', ru: 'Покупки' })} value={String(revenueAnalytics.purchaseCount)} delta={tr(language, { en: 'Completed payments', pl: 'Sfinalizowane płatności', es: 'Pagos completados', ru: 'Завершённые платежи' })} tone="violet" />
        <MetricCard label="MRR" value={`$${revenueAnalytics.mrr}`} delta={tr(language, { en: 'Recurring revenue', pl: 'Przychód cykliczny', es: 'Ingresos recurrentes', ru: 'Регулярная выручка' })} tone="amber" />
        <MetricCard label="LTV/CAC" value={String(revenueAnalytics.ltvToCac)} delta={tr(language, { en: `Target ${revenueAnalytics.targetLtvToCacRatio}`, pl: `Cel ${revenueAnalytics.targetLtvToCacRatio}`, es: `Objetivo ${revenueAnalytics.targetLtvToCacRatio}`, ru: `Цель ${revenueAnalytics.targetLtvToCacRatio}` })} tone="emerald" />
        <MetricCard label={tr(language, { en: 'Reward events', pl: 'Zdarzenia nagród', es: 'Eventos de recompensa', ru: 'События наград' })} value={String(rewardEventsCount ?? 0)} delta={tr(language, { en: 'Free-user engagement', pl: 'Aktywność darmowych użytkowników', es: 'Interacción de usuarios gratis', ru: 'Активность бесплатных пользователей' })} tone="amber" />
        <MetricCard label={tr(language, { en: 'Subscription plans', pl: 'Plany subskrypcji', es: 'Planes de suscripción', ru: 'Тарифные планы' })} value={String(PLAN_ORDER.length)} delta={tr(language, { en: 'Core pricing ladder', pl: 'Główna drabina cenowa', es: 'Escalera principal de precios', ru: 'Основная ценовая лестница' })} tone="cyan" />
        <MetricCard label={tr(language, { en: 'AI token packs', pl: 'Pakiety tokenów AI', es: 'Paquetes de tokens AI', ru: 'Пакеты AI токенов' })} value={String(CREDIT_PACK_ORDER.length)} delta={tr(language, { en: 'Top-up offers', pl: 'Oferty doładowań', es: 'Ofertas de recarga', ru: 'Предложения пополнения' })} tone="violet" />
        <MetricCard label={tr(language, { en: 'Premium gate', pl: 'Bramka premium', es: 'Puerta premium', ru: 'Premium gate' })} value={`${monetizationSettings.premiumGateScore}`} delta={tr(language, { en: 'Score threshold', pl: 'Próg scoringu', es: 'Umbral de puntuación', ru: 'Порог score' })} tone="amber" />
        <MetricCard label={tr(language, { en: 'Paywall mode', pl: 'Tryb paywalla', es: 'Modo del paywall', ru: 'Режим paywall' })} value={monetizationSettings.smartPaywallEnabled ? tr(language, { en: 'Smart', pl: 'Smart', es: 'Inteligente', ru: 'Умный' }) : tr(language, { en: 'Basic', pl: 'Podstawowy', es: 'Básico', ru: 'Базовый' })} delta={tr(language, { en: 'Revenue routing', pl: 'Routing przychodu', es: 'Ruta de ingresos', ru: 'Маршрутизация выручки' })} tone="emerald" />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <TrendChart title={tr(language, { en: 'Revenue architecture', pl: 'Architektura przychodu', es: 'Arquitectura de ingresos', ru: 'Архитектура выручки' })} subtitle={tr(language, { en: 'Visualized pricing momentum makes the admin layer feel like a global analytics product.', pl: 'Zwizualizowana dynamika cen sprawia, że warstwa admin przypomina globalny produkt analityczny.', es: 'El impulso de precios visualizado hace que la capa admin se sienta como un producto global de analítica.', ru: 'Визуализированная ценовая динамика делает admin-слой похожим на глобальный аналитический продукт.' })} values={[9, 19, 39, 59, 99, 149]} accent="#fbbf24" language={language} />
        <InsightPanel title={tr(language, { en: 'Pricing discipline', pl: 'Dyscyplina cenowa', es: 'Disciplina de precios', ru: 'Ценовая дисциплина' })} items={[
          tr(language, { en: 'Pro should remain the main monetization driver and default upsell path after a strong result.', pl: 'Pro powinien pozostać głównym silnikiem monetyzacji i domyślnym upsellem po mocnym wyniku.', es: 'Pro debe seguir siendo el principal motor de monetización y la ruta de upsell por defecto tras un resultado fuerte.', ru: 'Pro должен оставаться главным драйвером монетизации и основным upsell-путём после сильного результата.' }),
          tr(language, { en: 'Reward ads support activation, but must not replace the economic logic of paid plans.', pl: 'Reklamy nagradzane wspierają aktywację, ale nie mogą zastępować ekonomiki płatnych planów.', es: 'Los anuncios con recompensa ayudan a la activación, pero no deben sustituir la lógica económica de los planes de pago.', ru: 'Reward ads помогают активации, но не должны заменять экономику платных планов.' }),
          tr(language, { en: 'Scale should be reserved for heavier workflows, team visibility, and higher-margin operating depth.', pl: 'Scale powinien być zarezerwowany dla cięższych workflow, widoczności zespołowej i wyższej marży operacyjnej.', es: 'Scale debe reservarse para flujos más pesados, visibilidad de equipo y mayor profundidad operativa con margen.', ru: 'Scale нужно оставлять для более тяжёлых workflow, командной видимости и более маржинальной глубины.' }),
          tr(language, { en: 'AI token packs should feel premium and urgent, not cheap enough to cannibalize subscriptions.', pl: 'Pakiety tokenów AI powinny wyglądać premium i pilnie, a nie być tak tanie, by kanibalizować subskrypcje.', es: 'Los paquetes de tokens AI deben sentirse premium y urgentes, no tan baratos como para canibalizar las suscripciones.', ru: 'Пакеты AI токенов должны ощущаться премиально и срочно, а не быть слишком дешёвыми и съедать подписки.' }),
          tr(language, { en: `Referral reward stays at +${referralSettings.rewardCredits} AI tokens to motivate sharing without creating a loss-heavy viral loop.`, pl: `Nagroda poleceń pozostaje na poziomie +${referralSettings.rewardCredits} tokenów AI, aby motywować do udostępniania bez tworzenia kosztownej pętli viralowej.`, es: `La recompensa por referidos se mantiene en +${referralSettings.rewardCredits} tokens AI para motivar el compartir sin crear un bucle viral costoso.`, ru: `Награда за рефералов остаётся на уровне +${referralSettings.rewardCredits} AI токенов, чтобы мотивировать делиться без убыточной вирусной петли.` }),
        ]} />
      </section>

        </TutorialStep>

        <TutorialStep
          step="02"
          title={tr(language, { en: 'Check owner and cohort quality', pl: 'Sprawdź jakość owner i kohort' })}
          description={tr(language, { en: 'These cards help you judge not only revenue amount, but also paid-user quality and sustainability.', pl: 'Te karty pomagają ocenić nie tylko wysokość przychodu, ale też jakość i trwałość płatnych użytkowników.' })}
          tone="amber"
        >

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Owner KPI view', pl: 'Widok KPI właściciela', es: 'Vista KPI del propietario', ru: 'Просмотр KPI владельца' })}</div>
              <h2 className="mt-2 text-3xl font-black">{tr(language, { en: 'MRR, ARR, ARPPU, and LTV/CAC proxy', pl: 'MRR, ARR, ARPPU i przybliżone LTV/CAC', es: 'MRR, ARR, ARPPU y proxy de LTV/CAC', ru: 'MRR, ARR, ARPPU и proxy LTV/CAC' })}</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">MRR</div><div className="mt-2 text-3xl font-black text-white">{`$${revenueAnalytics.mrr}`}</div></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">ARR</div><div className="mt-2 text-3xl font-black text-white">{`$${revenueAnalytics.arr}`}</div></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">ARPPU</div><div className="mt-2 text-3xl font-black text-white">{`$${revenueAnalytics.arppu}`}</div></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">LTV proxy</div><div className="mt-2 text-3xl font-black text-white">{`$${revenueAnalytics.ltvProxy}`}</div></div>
          </div>
          <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-50">
            {tr(language, { en: `Estimated CAC is currently set to $${revenueAnalytics.estimatedCACUsd}. LTV/CAC proxy is ${revenueAnalytics.ltvToCac}. Use this as an owner metric, not audited finance.`, pl: `Szacowany CAC jest obecnie ustawiony na $${revenueAnalytics.estimatedCACUsd}. Proxy LTV/CAC wynosi ${revenueAnalytics.ltvToCac}. Traktuj to jako metrykę właściciela, a nie audyt finansowy.`, es: `El CAC estimado está configurado actualmente en $${revenueAnalytics.estimatedCACUsd}. El proxy de LTV/CAC es ${revenueAnalytics.ltvToCac}. Úsalo como métrica del propietario, no como finanzas auditadas.`, ru: `Оценочный CAC сейчас установлен на уровне $${revenueAnalytics.estimatedCACUsd}. Proxy LTV/CAC равен ${revenueAnalytics.ltvToCac}. Используй это как метрику владельца, а не как аудированную финансовую отчётность.` })}
          </div>
          <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-50">
            {tr(language, { en: 'Admin oversight stays simple: watch Pro conversion, protect Scale margin, and treat packs plus ads as support layers instead of the main revenue engine.', pl: 'Nadzór admina pozostaje prosty: pilnuj konwersji do Pro, chroń marżę na Scale, a pakiety i reklamy traktuj jako warstwy wspierające zamiast głównego silnika przychodu.', es: 'La supervisión admin sigue siendo simple: vigila la conversión a Pro, protege el margen de Scale y trata packs y anuncios como capas de apoyo.', ru: 'Admin-контроль остаётся простым: следи за конверсией в Pro, защищай маржу Scale, а пакеты и рекламу используй как поддерживающие слои.' })}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Cohorts', pl: 'Kohorty', es: 'Cohortes', ru: 'Когорты' })}</div>
          <h2 className="mt-2 text-3xl font-black">{tr(language, { en: 'Paid-user cohort view', pl: 'Widok kohort płatnych użytkowników', es: 'Vista de cohortes de usuarios de pago', ru: 'Просмотр когорт платных пользователей' })}</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-slate-400">
                <tr>
                  <th className="px-4 py-3">{tr(language, { en: 'Month', pl: 'Miesiąc', es: 'Mes', ru: 'Месяц' })}</th>
                  <th className="px-4 py-3">{tr(language, { en: 'Paid users', pl: 'Płatni użytkownicy', es: 'Usuarios de pago', ru: 'Платные пользователи' })}</th>
                </tr>
              </thead>
              <tbody>
                {revenueAnalytics.cohorts.length ? revenueAnalytics.cohorts.map((row) => (
                  <tr key={row.month} className="border-t border-white/10">
                    <td className="px-4 py-3 text-white">{row.month}</td>
                    <td className="px-4 py-3 text-cyan-200">{row.paidUsers}</td>
                  </tr>
                )) : (
                  <tr><td className="px-4 py-3 text-slate-400" colSpan={2}>{tr(language, { en: 'No cohort data yet.', pl: 'Brak danych kohortowych.', es: 'Todavía no hay datos de cohortes.', ru: 'Данных по когортам пока нет.' })}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

        </TutorialStep>

        <TutorialStep
          step="03"
          title={tr(language, { en: 'Adjust monetization controls', pl: 'Dostosuj kontrolki monetyzacji' })}
          description={tr(language, { en: 'Reward ads, ad providers, token packs, and settings should support activation without becoming the main business model.', pl: 'Reklamy nagradzane, providerzy reklam, pakiety tokenów i ustawienia mają wspierać aktywację bez zamieniania się w główny model biznesowy.' })}
          tone="amber"
        >

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <AdsAdminPanel dailyLimit={rewardSettings.dailyAdLimit} rewardCredits={rewardSettings.dailyRewardCredits} monetizationSettings={monetizationSettings} currentLanguage={language} />
        <DisplayAdMock language={language} title={tr(language, { en: 'Admin-visible display ad slot', pl: 'Widoczny slot reklamowy admina', es: 'Slot de anuncio visible para admin', ru: 'Видимый рекламный слот для admin' })} subtitle={tr(language, { en: 'A clearly visible ad inventory card for the monetization area, so ad monetization is no longer hidden in the redesign.', pl: 'Wyraźnie widoczna karta inventory reklamowego w sekcji monetyzacji, aby reklamy nie były już ukryte po redesignie.', es: 'Una tarjeta visible de inventario publicitario para el área de monetización, para que los anuncios ya no queden ocultos en el rediseño.', ru: 'Хорошо видимая карточка рекламного inventory в разделе monetization, чтобы реклама больше не была скрыта после redesign.' })} provider="AdSense-ready" slotId="admin-display-01" />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form action="/api/admin/monetization/settings" method="post" className="rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
          <h2 className="text-2xl font-bold">{tr(language, { en: 'Reward ads settings', pl: 'Ustawienia reklam nagradzanych', es: 'Ajustes de anuncios con recompensa', ru: 'Настройки вознаграждаемой рекламы' })}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div><label className="mb-2 block text-sm text-slate-300">{tr(language, { en: 'Daily ad limit', pl: 'Dzienny limit reklam', es: 'Límite diario de anuncios', ru: 'Дневной лимит рекламы' })}</label><input name="dailyAdLimit" type="number" min="1" max="50" defaultValue={rewardSettings.dailyAdLimit} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">{tr(language, { en: 'Bonus AI tokens', pl: 'Bonusowe tokeny AI', es: 'Tokens AI de bonificación', ru: 'Бонусные AI токены' })}</label><input name="dailyRewardCredits" type="number" min="1" max="20" defaultValue={rewardSettings.dailyRewardCredits} className="input" /></div>
          </div>
          <button className="mt-6 rounded-2xl bg-cyan-300 px-6 py-3 font-semibold text-slate-950">{tr(language, { en: 'Save settings', pl: 'Zapisz ustawienia', es: 'Guardar ajustes', ru: 'Сохранить настройки' })}</button>
        </form>
        <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
          <h2 className="text-2xl font-bold">{tr(language, { en: 'Current monetization stack', pl: 'Obecny stos monetyzacji', es: 'Stack actual de monetización', ru: 'Текущий стек монетизации' })}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-3 text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Subscriptions', pl: 'Subskrypcje', es: 'Suscripciones', ru: 'Подписки' })}</div>
              <div className="space-y-3">{PLAN_ORDER.map((plan) => <div key={plan.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="font-semibold text-white">{plan.name}</div><div className="text-sm text-slate-400">{plan.priceLabel} • {plan.monthlyCredits} {tr(language, { en: 'AI tokens', pl: 'tokenów AI', es: 'tokens AI', ru: 'AI токенов' })}</div></div>)}</div>
            </div>
            <div>
              <div className="mb-3 text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'One-time packs', pl: 'Pakiety jednorazowe', es: 'Paquetes de una sola vez', ru: 'Разовые пакеты' })}</div>
              <div className="space-y-3">{CREDIT_PACK_ORDER.map((pack) => <div key={pack.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="font-semibold text-white">{pack.name}</div><div className="text-sm text-slate-400">{pack.priceLabel} • {pack.credits} {tr(language, { en: 'AI tokens', pl: 'tokenów AI', es: 'tokens AI', ru: 'AI токенов' })}</div></div>)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <AdminAdsProvidersPanel currentLanguage={language} />
      </section>

      <section className="mt-8 rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
        <h2 className="text-2xl font-bold">{tr(language, { en: 'Recent reward events', pl: 'Ostatnie zdarzenia nagród', es: 'Eventos recientes de recompensa', ru: 'Недавние события наград' })}</h2>
        <div className="mt-5 space-y-3">{recentRewards?.length ? recentRewards.map((item: any) => <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">{item.user_id} • {item.reward_date} • {tr(language, { en: 'ads watched', pl: 'obejrzane reklamy', es: 'anuncios vistos', ru: 'просмотрено рекламы' })}: {item.ads_watched} • {tr(language, { en: 'AI tokens granted', pl: 'przyznane tokeny AI', es: 'tokens AI otorgados', ru: 'выдано AI токенов' })}: {item.credits_granted}</div>) : <div className="text-slate-400">{tr(language, { en: 'No reward events yet.', pl: 'Brak zdarzeń nagród.', es: 'Todavía no hay eventos de recompensa.', ru: 'Событий наград пока нет.' })}</div>}</div>
      </section>

        </TutorialStep>

        <TutorialStep
          step="04"
          title={tr(language, { en: 'Read the funnel diagnostics', pl: 'Odczytaj diagnostykę lejka' })}
          description={tr(language, { en: 'This is where you confirm whether premium gate, checkout rate, and execution logs support the pricing story you want.', pl: 'Tutaj potwierdzasz czy premium gate, checkout rate i logi wykonania wspierają historię cenową, którą chcesz budować.' })}
          tone="amber"
        >

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Revenue analytics', pl: 'Analityka przychodu', es: 'Analítica de ingresos', ru: 'Аналитика выручки' })}</div>
              <h2 className="mt-2 text-3xl font-black">{tr(language, { en: 'Monetization funnel snapshot', pl: 'Migawka lejka monetyzacji', es: 'Resumen del embudo de monetización', ru: 'Снимок воронки монетизации' })}</h2>
            </div>
            <div className="text-sm text-slate-400">{tr(language, { en: 'Live from execution logs', pl: 'Na żywo z logów wykonania', es: 'En vivo desde los logs de ejecución', ru: 'В реальном времени из execution logs' })}</div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">{tr(language, { en: 'Premium gate rate', pl: 'Wskaźnik premium gate', es: 'Tasa de premium gate', ru: 'Доля premium gate' })}</div><div className="mt-2 text-3xl font-black text-white">{revenueAnalytics.premiumGateRate}%</div></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">{tr(language, { en: 'Checkout rate', pl: 'Wskaźnik checkoutu', es: 'Tasa de checkout', ru: 'Checkout rate' })}</div><div className="mt-2 text-3xl font-black text-white">{revenueAnalytics.checkoutRate}%</div></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">{tr(language, { en: 'Purchase rate', pl: 'Wskaźnik zakupu', es: 'Tasa de compra', ru: 'Purchase rate' })}</div><div className="mt-2 text-3xl font-black text-white">{revenueAnalytics.purchaseRate}%</div></div>
          </div>
          <div className="mt-6 space-y-3">
            {revenueAnalytics.recentExecutionLogs.length ? revenueAnalytics.recentExecutionLogs.map((item: any) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-white">{item.product_name || tr(language, { en: 'Untitled analysis', pl: 'Analiza bez tytułu', es: 'Análisis sin título', ru: 'Анализ без названия' })}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{item.revenue_mode || tr(language, { en: 'unknown', pl: 'nieznany', es: 'desconocido', ru: 'неизвестно' })} · {item.recommended_plan || tr(language, { en: 'n/a', pl: 'brak', es: 'n/d', ru: 'н/д' })}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">{item.verdict}</div>
                    <div className="mt-1 text-lg font-bold text-cyan-200">{item.score}/{item.confidence}</div>
                  </div>
                </div>
              </div>
            )) : <div className="text-slate-400">{tr(language, { en: 'No execution logs yet.', pl: 'Brak logów wykonania.', es: 'Todavía no hay logs de ejecución.', ru: 'Логов выполнения пока нет.' })}</div>}
          </div>
        </div>
        <InsightPanel title={tr(language, { en: 'What to optimize next', pl: 'Co optymalizować dalej', es: 'Qué optimizar después', ru: 'Что оптимизировать дальше' })} items={[
          tr(language, { en: 'Increase premium-gate exposure only where score and confidence are both high.', pl: 'Zwiększaj ekspozycję premium gate tylko tam, gdzie score i confidence są wysokie.', es: 'Aumenta la exposición al premium gate solo donde score y confidence sean altos.', ru: 'Усиливай premium gate только там, где score и confidence действительно высокие.' }),
          tr(language, { en: 'Use AI token packs for medium-intent users who want more attempts before subscribing.', pl: 'Używaj pakietów tokenów AI dla użytkowników medium-intent, którzy chcą więcej prób przed subskrypcją.', es: 'Usa paquetes de tokens AI para usuarios de intención media que quieren más intentos antes de suscribirse.', ru: 'Используй пакеты AI токенов для пользователей со средним намерением, которым нужно больше попыток до подписки.' }),
          tr(language, { en: 'Track checkout-intent to purchase conversion to see where pricing or pitch breaks.', pl: 'Śledź konwersję od intencji checkoutu do zakupu, aby zobaczyć gdzie pęka cena lub komunikat.', es: 'Sigue la conversión desde la intención de checkout hasta la compra para ver dónde falla el precio o el mensaje.', ru: 'Следи за конверсией от checkout-intent до покупки, чтобы видеть, где ломается цена или подача.' }),
          tr(language, { en: 'Treat weak analyses as retention moments via ads, referrals, and new discovery loops.', pl: 'Traktuj słabsze analizy jako momenty retencji przez reklamy, polecenia i nowe pętle odkrywania.', es: 'Trata los análisis débiles como momentos de retención mediante anuncios, referidos y nuevos bucles de descubrimiento.', ru: 'Используй слабые анализы как моменты удержания через рекламу, рефералов и новые discovery-петли.' }),
        ]} />
      </section>
        </TutorialStep>
      </TutorialMode>
    </main>
  );
}
