import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';
import MetricCard from '@/components/pro-ui/MetricCard';
import TrendChart from '@/components/pro-ui/TrendChart';
import InsightPanel from '@/components/pro-ui/InsightPanel';
import TutorialMode, { TutorialStep } from '@/components/pro-ui/TutorialMode';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';

export default async function AdminPage() {
  const language = await getLanguage();
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) redirect('/dashboard');

  const [profilesCount, reviewsPending, supportNew, analysesCount, payingCount] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('support_messages').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabaseAdmin.from('analyses').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).neq('plan_key', 'free'),
  ]);

  const quickRoutes = [
    {
      href: '/admin/founder',
      label: tr(language, { en: 'Founder lane', pl: 'Tor właściciela', es: 'Ruta del fundador', ru: 'Линия владельца' }),
      value: tr(language, { en: 'KPI + retention', pl: 'KPI + retencja', es: 'KPI + retención', ru: 'KPI + retention' }),
      className: 'border-violet-300/30 bg-violet-300/10 hover:border-violet-200/40 hover:bg-violet-300/15',
      valueClassName: 'text-violet-200',
    },
    {
      href: '/admin/monetization',
      label: tr(language, { en: 'Revenue stack', pl: 'Stos przychodu', es: 'Stack de ingresos', ru: 'Стек выручки' }),
      value: tr(language, { en: 'Pricing + paywall', pl: 'Ceny + paywall', es: 'Precios + paywall', ru: 'Цены + paywall' }),
      className: 'border-amber-300/30 bg-amber-300/10 hover:border-amber-200/40 hover:bg-amber-300/15',
      valueClassName: 'text-amber-200',
    },
    {
      href: '/admin/automations',
      label: tr(language, { en: 'Autopilot', pl: 'Autopilot', es: 'Autopiloto', ru: 'Автопилот' }),
      value: tr(language, { en: 'Alerts + safeguards', pl: 'Alerty + zabezpieczenia', es: 'Alertas + protecciones', ru: 'Оповещения + защита' }),
      className: 'border-cyan-300/30 bg-cyan-300/10 hover:border-cyan-200/40 hover:bg-cyan-300/15',
      valueClassName: 'text-cyan-200',
    },
    {
      href: '/admin/integrations',
      label: tr(language, { en: 'Global sync', pl: 'Globalna synchronizacja', es: 'Sync global', ru: 'Глобальная синхронизация' }),
      value: tr(language, { en: 'Channels + signals', pl: 'Kanały + sygnały', es: 'Canales + señales', ru: 'Каналы + сигналы' }),
      className: 'border-emerald-300/30 bg-emerald-300/10 hover:border-emerald-200/40 hover:bg-emerald-300/15',
      valueClassName: 'text-emerald-200',
    },
  ];

  const modules = [
    {
      href: '/admin/founder',
      title: tr(language, { en: 'Founder command center', pl: 'Centrum dowodzenia właściciela', es: 'Centro del fundador', ru: 'Командный центр владельца' }),
      text: tr(language, { en: 'See monetization, retention, lifecycle, and owner KPIs in one board-ready view.', pl: 'Zobacz monetyzację, retencję, lifecycle i KPI właściciela w jednym widoku zarządczym.', es: 'Visualiza monetización, retención, ciclo de vida y KPI del propietario en una sola vista.', ru: 'Смотри monetization, retention, lifecycle и KPI владельца в одном executive-виде.' }),
      tone: 'violet' as const,
    },
    {
      href: '/admin/users',
      title: tr(language, { en: 'Users and billing', pl: 'Użytkownicy i rozliczenia', es: 'Usuarios y facturación', ru: 'Пользователи и биллинг' }),
      text: tr(language, { en: 'Control plans, AI token balances, and admin roles.', pl: 'Kontroluj plany, salda tokenów AI i role administratorów.', es: 'Controla planes, saldos de tokens AI y roles de administrador.', ru: 'Управляй тарифами, балансами AI токенов и ролями администратора.' }),
      tone: 'cyan' as const,
    },
    {
      href: '/admin/monetization',
      title: tr(language, { en: 'Monetization', pl: 'Monetyzacja', es: 'Monetización', ru: 'Монетизация' }),
      text: tr(language, { en: 'Manage pricing logic, reward ads, and AI-token pack economics.', pl: 'Zarządzaj logiką cen, reklamami nagradzanymi i ekonomią pakietów tokenów AI.', es: 'Gestiona la lógica de precios, los anuncios con recompensa y la economía de los paquetes de tokens AI.', ru: 'Управляй ценовой логикой, вознаграждаемой рекламой и экономикой пакетов AI токенов.' }),
      tone: 'emerald' as const,
    },
    {
      href: '/admin/automations',
      title: tr(language, { en: 'Automations', pl: 'Automatyzacje', es: 'Automatizaciones', ru: 'Автоматизации' }),
      text: tr(language, { en: 'Run recurring profit protection and operational workflows.', pl: 'Uruchamiaj cykliczną ochronę zysku i operacyjne workflow.', es: 'Ejecuta la protección recurrente de beneficios y los flujos operativos.', ru: 'Запускай регулярную защиту прибыли и операционные сценарии.' }),
      tone: 'cyan' as const,
    },
    {
      href: '/admin/integrations',
      title: tr(language, { en: 'Integrations', pl: 'Integracje', es: 'Integraciones', ru: 'Интеграции' }),
      text: tr(language, { en: 'Control the global sync stack across marketplaces, D2C, and social-demand channels.', pl: 'Steruj globalnym stosem synchronizacji dla marketplace, D2C i kanałów social-demand.', es: 'Controla el stack global de sincronización para marketplaces, D2C y canales sociales.', ru: 'Управляй глобальным sync-стеком для marketplace, D2C и social-demand каналов.' }),
      tone: 'emerald' as const,
    },
    {
      href: '/admin/support',
      title: tr(language, { en: 'Support inbox', pl: 'Skrzynka supportu', es: 'Bandeja de soporte', ru: 'Входящие поддержки' }),
      text: tr(language, { en: 'Handle user issues and operational risk quickly.', pl: 'Szybko obsługuj problemy użytkowników i ryzyko operacyjne.', es: 'Gestiona rápido los problemas de usuarios y el riesgo operativo.', ru: 'Быстро обрабатывай проблемы пользователей и операционные риски.' }),
      tone: 'amber' as const,
    },
    {
      href: '/admin/reviews',
      title: tr(language, { en: 'Review moderation', pl: 'Moderacja opinii', es: 'Moderación de reseñas', ru: 'Модерация отзывов' }),
      text: tr(language, { en: 'Approve, reject, and curate social proof.', pl: 'Akceptuj, odrzucaj i porządkuj social proof.', es: 'Aprueba, rechaza y organiza la prueba social.', ru: 'Одобряй, отклоняй и курируй социальное доказательство.' }),
      tone: 'violet' as const,
    },
  ];

  const tutorialSteps = [
    {
      step: '01',
      title: tr(language, { en: 'Read the executive snapshot first', pl: 'Najpierw odczytaj executive snapshot' }),
      description: tr(language, { en: 'The hero and metric cards tell you the current scale of users, revenue exposure, support load, and moderation pressure.', pl: 'Hero i karty metryk pokazują aktualną skalę użytkowników, ekspozycję przychodową, obciążenie supportu i presję moderacji.' }),
    },
    {
      step: '02',
      title: tr(language, { en: 'Choose the right operating lane', pl: 'Wybierz właściwy tor operacyjny' }),
      description: tr(language, { en: 'Quick routes and lane cards split founder, revenue, support, automations, and sync work into clear operating paths.', pl: 'Szybkie ścieżki i karty torów dzielą pracę founder, revenue, support, automations i sync na czytelne obszary operacyjne.' }),
    },
    {
      step: '03',
      title: tr(language, { en: 'Open the correct admin module', pl: 'Otwórz właściwy moduł admina' }),
      description: tr(language, { en: 'Use the module grid as your command map so you move into the right page instead of scanning the whole admin area manually.', pl: 'Używaj siatki modułów jak mapy dowodzenia, żeby wejść od razu na właściwą stronę zamiast ręcznie skanować cały panel admina.' }),
    },
  ];

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-16 text-white">
      <section className="mesh-panel relative overflow-hidden p-8 shadow-[0_30px_140px_rgba(2,6,23,0.65)]">
        <div className="spotlight-sweep" />
        <div className="noise-overlay" />
        <div className="relative grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">{tr(language, { en: 'Executive admin dashboard', pl: 'Panel administracyjny executive', es: 'Panel ejecutivo de administración', ru: 'Исполнительная админ-панель' })}</div>
            <h1 className="max-w-4xl text-5xl font-black tracking-tight sm:text-6xl">{tr(language, { en: 'Global control center for product, revenue, and risk.', pl: 'Globalne centrum kontroli produktu, przychodu i ryzyka.', es: 'Centro global de control para producto, ingresos y riesgo.', ru: 'Глобальный центр контроля продукта, выручки и риска.' })}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{tr(language, { en: 'Cleaner executive layout, stronger hierarchy, and faster access to the same protected billing, AI-token, Stripe, and anti-loss logic underneath.', pl: 'Czytelniejszy układ, mocniejsza hierarchia i szybszy dostęp do tej samej chronionej logiki płatności, tokenów AI, Stripe i anti-loss pod spodem.', es: 'Un diseño ejecutivo más limpio, una jerarquía más fuerte y un acceso más rápido a la misma lógica protegida de pagos, tokens AI, Stripe y anti-loss.', ru: 'Более чистый executive-слой, сильнее иерархия и более быстрый доступ к той же защищённой логике billing, AI токенов, Stripe и anti-loss.' })}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {quickRoutes.map((item) => (
                <Link key={item.href} href={item.href} className={`rounded-2xl border px-4 py-3 transition ${item.className}`}>
                  <div className="text-sm font-semibold text-white">{item.label}</div>
                  <div className={`mt-1 text-xs ${item.valueClassName}`}>{item.value} →</div>
                </Link>
              ))}
            </div>
          </div>
          <InsightPanel title={tr(language, { en: 'Board-level summary', pl: 'Podsumowanie zarządcze', es: 'Resumen para dirección', ru: 'Сводка для руководства' })} items={[
            tr(language, { en: 'Revenue, automations, and support stay visible without clutter.', pl: 'Przychód, automatyzacje i support pozostają czytelne bez bałaganu.', es: 'Los ingresos, las automatizaciones y el soporte siguen visibles sin desorden.', ru: 'Выручка, автоматизации и support остаются видимыми без перегруза.' }),
            tr(language, { en: 'Subscriptions, AI tokens, and anti-loss safeguards remain protected.', pl: 'Subskrypcje, tokeny AI i zabezpieczenia anti-loss pozostają chronione.', es: 'Las suscripciones, los tokens AI y las protecciones anti-loss siguen protegidos.', ru: 'Подписки, AI токены и anti-loss safeguards остаются защищёнными.' }),
            tr(language, { en: 'The admin layer now feels like a global SaaS control room, not a local back office.', pl: 'Warstwa admin przypomina teraz globalne centrum dowodzenia SaaS, a nie lokalne zaplecze.', es: 'La capa de administración ahora se siente como una sala de control SaaS global, no como una oficina local.', ru: 'Админ-слой теперь ощущается как глобальный SaaS control room, а не локальный бэк-офис.' }),
          ]} />
        </div>
      </section>

      <TutorialMode
        language={language}
        title={tr(language, { en: 'Need a guided admin overview?', pl: 'Potrzebujesz prowadzonego przeglądu admina?' })}
        intro={tr(language, { en: 'Turn on guide mode to see which section to read first, which lane to choose, and where each admin module fits.', pl: 'Włącz tryb przewodnika, aby zobaczyć od której sekcji zacząć, który tor wybrać i gdzie pasuje każdy moduł admina.' })}
        steps={tutorialSteps}
        storageKey="ufrev-admin-home-tutorial"
      >
        <TutorialStep
          step="01"
          title={tr(language, { en: 'Start from the executive metrics', pl: 'Zacznij od metryk executive' })}
          description={tr(language, { en: 'These cards give you the fastest read on customer scale, monetization base, usage, support load, and review backlog.', pl: 'Te karty dają najszybszy odczyt skali klientów, bazy monetyzacji, użycia, obciążenia supportu i backlogu opinii.' })}
        >
      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label={tr(language, { en: 'Users', pl: 'Użytkownicy', es: 'Usuarios', ru: 'Пользователи' })} value={String(profilesCount.count ?? 0)} delta={tr(language, { en: 'Customer base', pl: 'Baza klientów', es: 'Base de clientes', ru: 'База клиентов' })} tone="cyan" />
        <MetricCard label={tr(language, { en: 'Paid accounts', pl: 'Płatne konta', es: 'Cuentas de pago', ru: 'Платные аккаунты' })} value={String(payingCount.count ?? 0)} delta={tr(language, { en: 'Revenue accounts', pl: 'Konta przychodowe', es: 'Cuentas de ingresos', ru: 'Доходные аккаунты' })} tone="emerald" />
        <MetricCard label={tr(language, { en: 'Analyses', pl: 'Analizy', es: 'Análisis', ru: 'Анализы' })} value={String(analysesCount.count ?? 0)} delta={tr(language, { en: 'System usage', pl: 'Użycie systemu', es: 'Uso del sistema', ru: 'Использование системы' })} tone="violet" />
        <MetricCard label={tr(language, { en: 'New tickets', pl: 'Nowe zgłoszenia', es: 'Nuevos tickets', ru: 'Новые тикеты' })} value={String(supportNew.count ?? 0)} delta={tr(language, { en: 'Ops workload', pl: 'Obciążenie operacyjne', es: 'Carga operativa', ru: 'Операционная нагрузка' })} tone="amber" />
        <MetricCard label={tr(language, { en: 'Pending reviews', pl: 'Opinie do akceptacji', es: 'Reseñas pendientes', ru: 'Отзывы в очереди' })} value={String(reviewsPending.count ?? 0)} delta={tr(language, { en: 'Social proof backlog', pl: 'Backlog opinii', es: 'Backlog de prueba social', ru: 'Бэклог social proof' })} tone="cyan" />
      </section>

        </TutorialStep>

        <TutorialStep
          step="02"
          title={tr(language, { en: 'Use routes and operating lanes', pl: 'Użyj ścieżek i torów operacyjnych' })}
          description={tr(language, { en: 'This layer explains where founder, monetization, support, automation, and sync work begins.', pl: 'Ta warstwa pokazuje gdzie zaczyna się praca founder, monetyzacji, supportu, automatyzacji i synchronizacji.' })}
        >

      <section className="mt-8 grid gap-4 lg:grid-cols-4">
        {[
          {
            title: tr(language, { en: 'Founder lens', pl: 'Soczewka właściciela', es: 'Lente del fundador', ru: 'Взгляд владельца' }),
            text: tr(language, { en: 'One board-ready route for KPIs, churn defense, CRM, and pricing experiments.', pl: 'Jedna ścieżka zarządcza dla KPI, ochrony churn, CRM i eksperymentów cenowych.', es: 'Una ruta ejecutiva para KPI, defensa de churn, CRM y experimentos de precios.', ru: 'Один executive-маршрут для KPI, churn-защиты, CRM и ценовых экспериментов.' }),
          },
          {
            title: tr(language, { en: 'Revenue stack', pl: 'Stos przychodu', es: 'Stack de ingresos', ru: 'Стек выручки' }),
            text: tr(language, { en: 'Pricing, token packs, and paywall discipline stay visible as one monetization lane.', pl: 'Ceny, pakiety tokenów i dyscyplina paywalla są widoczne jako jeden tor monetyzacji.', es: 'Precios, packs de tokens y disciplina de paywall quedan visibles como un solo carril.', ru: 'Цены, пакеты токенов и дисциплина paywall видны как единая monetization-линия.' }),
          },
          {
            title: tr(language, { en: 'Ops response', pl: 'Reakcja operacyjna', es: 'Respuesta operativa', ru: 'Операционный отклик' }),
            text: tr(language, { en: 'Support and moderation are promoted to conversion and trust levers, not only chores.', pl: 'Support i moderacja stają się dźwigniami konwersji i zaufania, a nie tylko zadaniami.', es: 'Soporte y moderación pasan a ser palancas de conversión y confianza, no solo tareas.', ru: 'Support и moderation становятся рычагами доверия и конверсии, а не только рутиной.' }),
          },
          {
            title: tr(language, { en: 'Global sync', pl: 'Globalny sync', es: 'Sync global', ru: 'Глобальный sync' }),
            text: tr(language, { en: 'Marketplace, D2C, and social signal routing now sit inside one premium control layer.', pl: 'Routing marketplace, D2C i sygnałów social działa teraz w jednej premium warstwie sterowania.', es: 'El enrutamiento de marketplaces, D2C y señales sociales vive ahora en una sola capa premium.', ru: 'Маршрутизация marketplace, D2C и social-сигналов теперь находится в одном premium-слое.' }),
          },
        ].map((item) => (
          <div key={item.title} className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-[0_18px_70px_rgba(2,6,23,0.35)]">
            <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Operating lane', pl: 'Tor operacyjny', es: 'Carril operativo', ru: 'Операционная линия' })}</div>
            <h2 className="mt-2 text-xl font-black text-white">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <TrendChart title={tr(language, { en: 'Business momentum', pl: 'Momentum biznesu', es: 'Impulso del negocio', ru: 'Импульс бизнеса' })} subtitle={tr(language, { en: 'A more advanced, board-friendly layer for product usage and monetization visibility.', pl: 'Bardziej zaawansowana, przyjazna zarządowi warstwa do wglądu w użycie produktu i monetyzację.', es: 'Una capa más avanzada y apta para dirección para la visibilidad del uso del producto y la monetización.', ru: 'Более продвинутый, board-friendly слой для видимости использования продукта и монетизации.' })} values={[12, 18, 24, 22, 31, 44]} accent="#22d3ee" language={language} />
        <InsightPanel title={tr(language, { en: 'Admin priorities', pl: 'Priorytety admina', es: 'Prioridades del panel', ru: 'Приоритеты admin' })} items={[
          tr(language, { en: 'Protect margins first: keep pricing discipline stronger than acquisition pressure.', pl: 'Najpierw chroń marżę: trzymaj dyscyplinę cenową mocniej niż presję pozyskania.', es: 'Protege primero los márgenes: mantén la disciplina de precios por encima de la presión de adquisición.', ru: 'Сначала защищай маржу: держи ценовую дисциплину сильнее, чем давление acquisition.' }),
          tr(language, { en: 'Use the monetization module to tune reward ads without replacing subscription value.', pl: 'Używaj modułu monetyzacji do strojenia reklam nagradzanych bez zastępowania wartości subskrypcji.', es: 'Usa el módulo de monetización para ajustar los anuncios con recompensa sin sustituir el valor de la suscripción.', ru: 'Используй модуль monetization для настройки reward ads без подмены ценности подписки.' }),
          tr(language, { en: 'Use reviews and support as conversion levers, not just operational tasks.', pl: 'Traktuj opinie i support jako dźwignie konwersji, a nie tylko operacyjne zadania.', es: 'Usa las reseñas y el soporte como palancas de conversión, no solo como tareas operativas.', ru: 'Используй отзывы и support как рычаги конверсии, а не только операционные задачи.' }),
          tr(language, { en: 'Treat integrations and automations as enterprise-value signals for global scaling.', pl: 'Traktuj integracje i automatyzacje jako sygnały wartości enterprise przy globalnym skalowaniu.', es: 'Trata las integraciones y automatizaciones como señales de valor enterprise para escalar globalmente.', ru: 'Считай интеграции и автоматизации сигналами enterprise-value для глобального масштабирования.' }),
        ]} />
      </section>

        </TutorialStep>

        <TutorialStep
          step="03"
          title={tr(language, { en: 'Open the right module directly', pl: 'Wejdź od razu do właściwego modułu' })}
          description={tr(language, { en: 'These module cards are the fastest route into the admin area once you know what kind of work you need to do.', pl: 'Te karty modułów są najszybszą drogą do właściwej części panelu admina, gdy już wiesz jaki typ pracy chcesz wykonać.' })}
        >

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        {modules.map((item) => (
          <Link key={item.href} href={item.href} className="group hover-lift rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)] transition hover:-translate-y-1 hover:border-cyan-300/30">
            <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Module', pl: 'Moduł', es: 'Módulo', ru: 'Модуль' })}</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white">{item.title}</h2>
            <p className="mt-4 text-slate-300">{item.text}</p>
            <div className="mt-6 text-sm font-semibold text-cyan-200 transition group-hover:translate-x-1">{tr(language, { en: 'Open module →', pl: 'Otwórz moduł →', es: 'Abrir módulo →', ru: 'Открыть модуль →' })}</div>
          </Link>
        ))}
      </section>
        </TutorialStep>
      </TutorialMode>
    </main>
  );
}
