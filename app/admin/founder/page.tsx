import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRevenueAnalyticsSnapshot } from '@/lib/revenue-analytics';
import { getRetentionSettings, getPricingSettings, getNotificationSettings } from '@/lib/growth-config';
import { getMonetizationSettings } from '@/lib/app-config';
import MetricCard from '@/components/pro-ui/MetricCard';
import InsightPanel from '@/components/pro-ui/InsightPanel';
import TutorialMode, { TutorialStep } from '@/components/pro-ui/TutorialMode';
import DispatchNotificationsButton from '@/components/admin/DispatchNotificationsButton';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';

export default async function FounderCommandCenterPage() {
  const language = await getLanguage();
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) redirect('/dashboard');

  const [monetizationSettings, retentionSettings, pricingSettings, notificationSettings] = await Promise.all([
    getMonetizationSettings(),
    getRetentionSettings(),
    getPricingSettings(),
    getNotificationSettings(),
  ]);

  const analytics = await getRevenueAnalyticsSnapshot(monetizationSettings);

  const [{ count: highRisk }, { count: crmCount }, { count: queuedNotifications }, { count: pricingExperiments }] = await Promise.all([
    supabaseAdmin.from('retention_events').select('*', { count: 'exact', head: true }).eq('segment', 'high'),
    supabaseAdmin.from('crm_events').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('notification_events').select('*', { count: 'exact', head: true }).eq('status', 'queued'),
    supabaseAdmin.from('pricing_experiments').select('*', { count: 'exact', head: true }),
  ]);

  const tutorialSteps = [
    {
      step: '01',
      title: tr(language, { en: 'Read owner KPIs first', pl: 'Najpierw odczytaj KPI właściciela' }),
      description: tr(language, { en: 'Start from the top row to judge revenue quality, churn pressure, CRM load, and pricing motion in one scan.', pl: 'Zacznij od górnego rzędu, aby jednym skanem ocenić jakość przychodu, presję churnu, obciążenie CRM i ruch pricingowy.' }),
    },
    {
      step: '02',
      title: tr(language, { en: 'Translate metrics into operator action', pl: 'Zamień metryki na działania operatora' }),
      description: tr(language, { en: 'The checklist keeps this page useful for execution, not only for monitoring.', pl: 'Checklista sprawia, że ta strona jest użyteczna do działania, a nie tylko do monitoringu.' }),
    },
    {
      step: '03',
      title: tr(language, { en: 'Confirm readiness before scaling', pl: 'Potwierdź gotowość przed skalowaniem' }),
      description: tr(language, { en: 'Use the final section to confirm whether defense, alerts, and pricing are really ready for the next push.', pl: 'Użyj końcowej sekcji, aby potwierdzić czy obrona, alerty i pricing są naprawdę gotowe na kolejny etap wzrostu.' }),
    },
  ];
  const founderQuickLinks = [
    { href: '#founder-kpis', label: tr(language, { en: 'Founder KPIs', pl: 'KPI właściciela', es: 'KPI del fundador', ru: 'KPI владельца' }) },
    { href: '#founder-actions', label: tr(language, { en: 'Operator actions', pl: 'Działania operatora', es: 'Acciones del operador', ru: 'Действия оператора' }) },
    { href: '#founder-readiness', label: tr(language, { en: 'Readiness check', pl: 'Kontrola gotowości', es: 'Chequeo de preparación', ru: 'Проверка готовности' }) },
  ];

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-16 text-white">
      <section className="rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(167,139,250,0.14),transparent_24%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))] p-8 shadow-[0_30px_140px_rgba(2,6,23,0.65)]">
        <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Founder command center', pl: 'Centrum dowodzenia właściciela', es: 'Centro de mando del fundador', ru: 'Командный центр владельца' })}</div>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">{tr(language, { en: 'Ultimate growth, monetization, and defense panel', pl: 'Najmocniejszy panel wzrostu, monetyzacji i obrony', es: 'Panel definitivo de crecimiento, monetización y defensa', ru: 'Главная панель роста, монетизации и защиты' })}</h1>
        <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">{tr(language, { en: 'This is the strongest version in this build cycle: decision engine, anti-burn, monetization, retention, CRM, notifications, pricing experiments, and owner KPIs in one place.', pl: 'To najmocniejsza wersja w tym cyklu: silnik decyzji, anti-burn, monetyzacja, retencja, CRM, powiadomienia, eksperymenty cenowe i KPI właściciela w jednym miejscu.', es: 'Esta es la versión más potente de este ciclo: motor de decisiones, anti-burn, monetización, retención, CRM, notificaciones, experimentos de precios y KPI del propietario en un solo lugar.', ru: 'Это самая сильная версия в этом цикле: decision engine, anti-burn, monetization, retention, CRM, уведомления, ценовые эксперименты и KPI владельца в одном месте.' })}</p>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        {founderQuickLinks.map((item, index) => (
          <a key={item.href} href={item.href} className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${index === 0 ? 'border border-violet-300/30 bg-violet-300/10 text-violet-100 hover:bg-violet-300/15' : 'border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]'}`}>
            {item.label}
          </a>
        ))}
      </div>

      <TutorialMode
        language={language}
        title={tr(language, { en: 'Need a founder walkthrough?', pl: 'Potrzebujesz przewodnika po torze właściciela?' })}
        intro={tr(language, { en: 'Turn on guide mode to read this lane in order: top KPIs, operator actions, and readiness checks.', pl: 'Włącz tryb przewodnika, aby czytać ten tor po kolei: KPI, działania operatora i kontrolę gotowości.' })}
        steps={tutorialSteps}
        storageKey="ufrev-founder-tutorial"
        tone="violet"
      >
        <TutorialStep
          step="01"
          title={tr(language, { en: 'Start from the founder KPIs', pl: 'Zacznij od KPI właściciela' })}
          description={tr(language, { en: 'This row compresses growth, churn, lifecycle pressure, and pricing motion into one faster owner view.', pl: 'Ten rząd kompresuje wzrost, churn, presję lifecycle i ruch pricingowy w jeden szybszy widok właścicielski.' })}
          tone="violet"
        >
      <section id="founder-kpis" className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="MRR" value={`$${analytics.mrr}`} delta={tr(language, { en: 'Recurring revenue', pl: 'Przychód cykliczny', es: 'Ingresos recurrentes', ru: 'Регулярная выручка' })} tone="amber" />
          <MetricCard label="LTV/CAC" value={String(analytics.ltvToCac)} delta={tr(language, { en: `Target ${analytics.targetLtvToCacRatio}`, pl: `Cel ${analytics.targetLtvToCacRatio}`, es: `Objetivo ${analytics.targetLtvToCacRatio}`, ru: `Цель ${analytics.targetLtvToCacRatio}` })} tone="emerald" />
          <MetricCard label={tr(language, { en: 'High churn', pl: 'Wysoki churn', es: 'Churn alto', ru: 'Высокий churn' })} value={String(highRisk ?? 0)} delta={tr(language, { en: 'Defense queue', pl: 'Kolejka obrony', es: 'Cola de defensa', ru: 'Очередь защиты' })} tone="amber" />
          <MetricCard label={tr(language, { en: 'CRM events', pl: 'Zdarzenia CRM', es: 'Eventos CRM', ru: 'События CRM' })} value={String(crmCount ?? 0)} delta={tr(language, { en: 'Lifecycle actions', pl: 'Akcje lifecycle', es: 'Acciones del ciclo de vida', ru: 'Lifecycle-действия' })} tone="violet" />
          <MetricCard label={tr(language, { en: 'Queued notifications', pl: 'Powiadomienia w kolejce', es: 'Notificaciones en cola', ru: 'Уведомления в очереди' })} value={String(queuedNotifications ?? 0)} delta={tr(language, { en: 'Ready to send', pl: 'Gotowe do wysłania', es: 'Listas para enviar', ru: 'Готово к отправке' })} tone="cyan" />
        </div>
        <InsightPanel title={tr(language, { en: 'Owner context', pl: 'Kontekst właściciela', es: 'Contexto del fundador', ru: 'Контекст владельца' })} items={[
          tr(language, { en: `Pricing experiments in flight: ${pricingExperiments ?? 0}. Keep this small unless MRR and purchase quality are already improving.`, pl: `Aktywne eksperymenty cenowe: ${pricingExperiments ?? 0}. Trzymaj tę liczbę nisko, dopóki MRR i jakość zakupu nie rosną.`, es: `Experimentos de precios activos: ${pricingExperiments ?? 0}. Mantén este número bajo hasta que mejoren el MRR y la calidad de compra.`, ru: `Активные ценовые эксперименты: ${pricingExperiments ?? 0}. Держи это число низким, пока не растут MRR и качество покупки.` }),
          tr(language, { en: monetizationSettings.smartPaywallEnabled ? 'Smart paywall is active, so conversion routing can stay selective instead of fully open.' : 'Smart paywall is disabled, so premium pressure is currently weaker and should be monitored manually.', pl: monetizationSettings.smartPaywallEnabled ? 'Inteligentny paywall jest aktywny, więc routing konwersji może pozostać selektywny zamiast całkowicie otwarty.' : 'Inteligentny paywall jest wyłączony, więc presja premium jest obecnie słabsza i wymaga ręcznego monitoringu.', es: monetizationSettings.smartPaywallEnabled ? 'El paywall inteligente está activo, así que la ruta de conversión puede seguir siendo selectiva.' : 'El paywall inteligente está desactivado, así que la presión premium es más débil y debe vigilarse manualmente.', ru: monetizationSettings.smartPaywallEnabled ? 'Умный paywall активен, поэтому маршрутизация конверсии может оставаться избирательной.' : 'Умный paywall выключен, поэтому premium-давление сейчас слабее и требует ручного контроля.' }),
          tr(language, { en: pricingSettings.dynamicPricingEnabled ? 'Dynamic pricing is enabled, so pricing motion should be reviewed together with experiments, not in isolation.' : 'Dynamic pricing is disabled, so revenue testing depends more on explicit experiments and manual overrides.', pl: pricingSettings.dynamicPricingEnabled ? 'Dynamic pricing jest włączony, więc ruch cenowy trzeba oceniać razem z eksperymentami, a nie w izolacji.' : 'Dynamic pricing jest wyłączony, więc testowanie przychodu bardziej zależy od jawnych eksperymentów i ręcznych zmian.', es: pricingSettings.dynamicPricingEnabled ? 'Los precios dinámicos están activados, así que el movimiento de precios debe revisarse junto a los experimentos.' : 'Los precios dinámicos están desactivados, así que las pruebas de ingresos dependen más de experimentos explícitos y ajustes manuales.', ru: pricingSettings.dynamicPricingEnabled ? 'Динамическое ценообразование включено, поэтому ценовое движение нужно смотреть вместе с экспериментами.' : 'Динамическое ценообразование выключено, поэтому тестирование выручки больше зависит от явных экспериментов и ручных правок.' }),
        ]} />
      </section>

        </TutorialStep>

        <TutorialStep
          step="02"
          title={tr(language, { en: 'Use the operator checklist', pl: 'Użyj checklisty operatora' })}
          description={tr(language, { en: 'This part turns insight into action so the founder lane stays operational and not only descriptive.', pl: 'Ta część zamienia wgląd w działanie, aby tor właściciela pozostał operacyjny, a nie tylko opisowy.' })}
          tone="violet"
        >
      <section id="founder-actions" className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Operator checklist', pl: 'Lista operatora', es: 'Checklist del operador', ru: 'Чек-лист оператора' })}</div>
              <h2 className="mt-2 text-3xl font-black">{tr(language, { en: 'What to push next', pl: 'Co wdrażać dalej', es: 'Qué impulsar ahora', ru: 'Что продвигать дальше' })}</h2>
            </div>
            <DispatchNotificationsButton language={language} />
          </div>
          <div className="space-y-3 text-sm text-slate-200">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">{tr(language, { en: '1. Keep anti-burn and kill-switch controls enabled before scaling spend.', pl: '1. Utrzymuj aktywne zabezpieczenia anti-burn i kill-switch przed skalowaniem wydatków.', es: '1. Mantén activados los controles anti-burn y kill-switch antes de escalar el gasto.', ru: '1. Держи включёнными anti-burn и kill-switch перед масштабированием расходов.' })}</div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">{tr(language, { en: '2. Push premium gate only when score and confidence are both strong.', pl: '2. Wzmacniaj premium gate tylko wtedy, gdy score i confidence są wysokie.', es: '2. Refuerza la puerta premium solo cuando score y confidence sean altos.', ru: '2. Усиливай premium gate только когда score и confidence действительно высокие.' })}</div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">{tr(language, { en: '3. Run retention scans daily and dispatch queued CRM / notification actions.', pl: '3. Uruchamiaj skany retencji codziennie i wysyłaj akcje CRM / notification z kolejki.', es: '3. Ejecuta escaneos de retención cada día y lanza las acciones CRM / notification en cola.', ru: '3. Запускай проверки retention ежедневно и отправляй CRM / notification действия из очереди.' })}</div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">{tr(language, { en: '4. Use pricing experiments carefully and monitor MRR, LTV/CAC, and purchase rate.', pl: '4. Używaj eksperymentów cenowych ostrożnie i monitoruj MRR, LTV/CAC oraz purchase rate.', es: '4. Usa los experimentos de precios con cuidado y vigila MRR, LTV/CAC y la tasa de compra.', ru: '4. Используй ценовые эксперименты осторожно и следи за MRR, LTV/CAC и purchase rate.' })}</div>
          </div>
        </div>

        <InsightPanel title={tr(language, { en: 'System status', pl: 'Stan systemu', es: 'Estado del sistema', ru: 'Состояние системы' })} items={[
          tr(language, { en: `Churn defense: ${retentionSettings.churnDefenseEnabled ? 'enabled' : 'disabled'}`, pl: `Ochrona przed churnem: ${retentionSettings.churnDefenseEnabled ? 'włączona' : 'wyłączona'}`, es: `Defensa contra churn: ${retentionSettings.churnDefenseEnabled ? 'activada' : 'desactivada'}`, ru: `Защита от churn: ${retentionSettings.churnDefenseEnabled ? 'включена' : 'выключена'}` }),
          tr(language, { en: `Realtime alerts: ${notificationSettings.realtimeAlertsEnabled ? 'enabled' : 'disabled'}`, pl: `Alerty realtime: ${notificationSettings.realtimeAlertsEnabled ? 'włączone' : 'wyłączone'}`, es: `Alertas en tiempo real: ${notificationSettings.realtimeAlertsEnabled ? 'activadas' : 'desactivadas'}`, ru: `Realtime-оповещения: ${notificationSettings.realtimeAlertsEnabled ? 'включены' : 'выключены'}` }),
          tr(language, { en: `Annual discount: ${pricingSettings.premiumAnnualDiscountPercent}%`, pl: `Roczna zniżka: ${pricingSettings.premiumAnnualDiscountPercent}%`, es: `Descuento anual: ${pricingSettings.premiumAnnualDiscountPercent}%`, ru: `Годовая скидка: ${pricingSettings.premiumAnnualDiscountPercent}%` }),
          tr(language, { en: 'Delivery providers are adapter-ready: Resend, SendGrid, or SMTP envs can be added later.', pl: 'Dostawcy wysyłki są gotowi przez adaptery: Resend, SendGrid lub SMTP można dodać później.', es: 'Los proveedores de envío están listos por adaptador: Resend, SendGrid o SMTP pueden añadirse más tarde.', ru: 'Провайдеры доставки готовы через адаптеры: Resend, SendGrid или SMTP можно добавить позже.' }),
        ]} />
      </section>

        </TutorialStep>

        <TutorialStep
          step="03"
          title={tr(language, { en: 'Keep founder context visible', pl: 'Utrzymuj kontekst właścicielski na wierzchu' })}
          description={tr(language, { en: 'This reminder block clarifies why this page exists: fast owner judgment across revenue, risk, and execution pressure.', pl: 'Ten blok przypomina po co istnieje ta strona: szybki osąd właścicielski dla przychodu, ryzyka i presji wykonawczej.' })}
          tone="violet"
        >
          <section id="founder-readiness" className="mt-8 rounded-[32px] border border-violet-300/25 bg-[linear-gradient(135deg,rgba(88,28,135,0.32),rgba(15,23,42,0.9),rgba(59,130,246,0.12))] p-8 shadow-[0_24px_100px_rgba(88,28,135,0.18)]">
            <div className="text-[11px] uppercase tracking-[0.24em] text-violet-200">{tr(language, { en: 'Founder lane guide', pl: 'Przewodnik toru właściciela' })}</div>
            <h2 className="mt-2 text-3xl font-black text-white">{tr(language, { en: 'One owner view for revenue quality, defense, and execution pressure', pl: 'Jeden widok właścicielski dla jakości przychodu, obrony i presji wykonawczej' })}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">{tr(language, { en: 'Use this lane when you need one stronger operating view without jumping between monetization, retention, CRM, and notification panels separately.', pl: 'Używaj tego toru, gdy potrzebujesz jednego mocniejszego widoku operacyjnego bez skakania osobno między panelami monetyzacji, retencji, CRM i powiadomień.' })}</p>
          </section>
        </TutorialStep>
      </TutorialMode>
    </main>
  );
}
