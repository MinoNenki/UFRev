import { isSupabaseConfigured } from '@/lib/env';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import DashboardShell from '@/components/DashboardShell';
import MetricCard from '@/components/pro-ui/MetricCard';
import { getRewardSettings, getReferralSettings } from '@/lib/app-config';
import { getAutomationSettings, getIntegrationSettings } from '@/lib/profit-config';
import { getNotificationSettings } from '@/lib/growth-config';
import { createRewardToken } from '@/lib/security';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';
import { getPlanDisplayName } from '@/lib/plans';

export default async function DashboardPage() {
  const language = await getLanguage();
  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16 text-white">
        <div className="premium-panel p-8">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language,{en:'Setup required',pl:'Wymagana konfiguracja',de:'Setup erforderlich',es:'Se requiere configuración',pt:'Configuração necessária',ru:'Требуется настройка'})}</div>
          <h1 className="mt-3 text-4xl font-black">{tr(language,{en:'Configure Supabase before opening the dashboard',pl:'Skonfiguruj Supabase przed wejściem do panelu',de:'Konfiguriere Supabase vor dem Öffnen des Dashboards',es:'Configura Supabase antes de abrir el panel',pt:'Configure o Supabase antes de abrir o dashboard',ru:'Настрой Supabase перед открытием панели'})}</h1>
          <p className="mt-4 text-slate-300">Open /setup, fill .env.local, and run supabase/schema.sql first.</p>
        </div>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const today = new Date().toISOString().slice(0, 10);

  const [rewardSettings, referralSettings, automationSettings, integrationSettings, notificationSettings, { data: profile }, { data: analyses }, { data: rewardEvent }] = await Promise.all([
    getRewardSettings(),
    getReferralSettings(),
    getAutomationSettings(),
    getIntegrationSettings(),
    getNotificationSettings(),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('credit_reward_events').select('ads_watched').eq('user_id', user.id).eq('reward_date', today).maybeSingle(),
  ]);

  const latestDecision = analyses?.[0]?.decision_json || null;
  const rewardToken = createRewardToken(user.id);
  const enabledNotificationChannels = [
    notificationSettings.inAppEnabled,
    notificationSettings.emailEnabled,
    notificationSettings.telegramEnabled,
    notificationSettings.discordEnabled,
  ].filter(Boolean).length;
  const activeCommerceChannels = [
    integrationSettings.shopifyEnabled,
    integrationSettings.amazonEnabled,
    integrationSettings.ebayEnabled,
    integrationSettings.alibabaEnabled,
    integrationSettings.aliexpressEnabled,
    integrationSettings.walmartEnabled,
    integrationSettings.allegroEnabled,
    integrationSettings.cdiscountEnabled,
    integrationSettings.emagEnabled,
    integrationSettings.ottoEnabled,
    integrationSettings.zalandoEnabled,
    integrationSettings.woocommerceEnabled,
  ].filter(Boolean).length;

  const premiumVisibilityCards = [
    {
      eyebrow: tr(language, { en: 'Realtime market watch', pl: 'Realtime market watch' }),
      title: tr(language, { en: 'Competitor Watchtower', pl: 'Wieża konkurencji' }),
      copy: tr(language, { en: 'See competitor moves, pricing shifts, and new opportunities before you react too late.', pl: 'Zobacz ruchy konkurencji, zmiany cen i nowe okazje zanim zareagujesz za późno.' }),
      href: '/automations',
      cta: tr(language, { en: 'Open automation center', pl: 'Otwórz centrum automatyzacji' }),
      status: automationSettings.autoCompetitorScans ? tr(language, { en: 'Active', pl: 'Aktywny' }) : tr(language, { en: 'Standby', pl: 'Czuwanie' }),
      chipClass: automationSettings.autoCompetitorScans ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-300',
    },
    {
      eyebrow: tr(language, { en: 'Weekly intelligence', pl: 'Tygodniowa inteligencja' }),
      title: tr(language, { en: 'Digest and summary loop', pl: 'Pętla digestów i podsumowań' }),
      copy: tr(language, { en: 'Turn scattered watchlists into clear weekly summaries you can actually act on.', pl: 'Zamieniaj rozproszone watchlisty w czytelne tygodniowe podsumowania, na których da się realnie działać.' }),
      href: '/automations',
      cta: tr(language, { en: 'Review weekly layer', pl: 'Sprawdź warstwę weekly' }),
      status: automationSettings.weeklyMarketDigest ? tr(language, { en: 'On', pl: 'Wł.' }) : tr(language, { en: 'Off', pl: 'Wył.' }),
      chipClass: automationSettings.weeklyMarketDigest ? 'border-violet-300/30 bg-violet-300/10 text-violet-100' : 'border-white/10 bg-white/5 text-slate-300',
    },
    {
      eyebrow: tr(language, { en: 'Global sync fabric', pl: 'Globalna warstwa sync' }),
      title: tr(language, { en: 'Marketplace expansion mesh', pl: 'Siatka ekspansji marketplace' }),
      copy: tr(language, { en: 'Quickly see which channels can bring your next buyers without guessing where to expand first.', pl: 'Szybko zobacz, które kanały mogą przyprowadzić kolejnych klientów bez zgadywania, gdzie rozszerzać sprzedaż najpierw.' }),
      href: '/integrations',
      cta: tr(language, { en: 'Open integrations', pl: 'Otwórz integracje' }),
      status: `${activeCommerceChannels} ${tr(language, { en: 'workspace lanes', pl: 'ścieżek workspace' })}`,
      chipClass: 'border-sky-300/30 bg-sky-300/10 text-sky-100',
    },
    {
      eyebrow: tr(language, { en: 'Premium routing', pl: 'Routing premium' }),
      title: tr(language, { en: 'Alert delivery layer', pl: 'Warstwa dostarczania alertów' }),
      copy: tr(language, { en: 'Get important updates where you already work so you can react faster and with less stress.', pl: 'Otrzymuj ważne aktualizacje tam, gdzie już pracujesz, aby reagować szybciej i z mniejszym stresem.' }),
      href: profile?.role === 'admin' ? '/admin/automations' : '/automations',
      cta: tr(language, { en: 'Configure delivery', pl: 'Skonfiguruj wysyłkę' }),
      status: `${enabledNotificationChannels} ${tr(language, { en: 'channels', pl: 'kanały' })}`,
      chipClass: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
    },
    {
      eyebrow: tr(language, { en: 'Budget protection', pl: 'Ochrona budżetu' }),
      title: tr(language, { en: 'Decision safeguards', pl: 'Zabezpieczenia decyzji' }),
      copy: tr(language, { en: 'This layer blocks risky scaling when margin, refund rate, CAC, or other safety thresholds look too weak.', pl: 'Ta warstwa blokuje ryzykowne skalowanie, gdy marża, refund rate, CAC albo inne progi bezpieczeństwa wyglądają zbyt słabo.' }),
      href: '/automations',
      cta: tr(language, { en: 'Review safeguards', pl: 'Sprawdź zabezpieczenia' }),
      status: automationSettings.killSwitchEnabled ? tr(language, { en: 'Enabled', pl: 'Włączone' }) : tr(language, { en: 'Relaxed', pl: 'Poluzowane' }),
      chipClass: automationSettings.killSwitchEnabled ? 'border-amber-300/30 bg-amber-300/10 text-amber-100' : 'border-white/10 bg-white/5 text-slate-300',
    },
  ];

  return (
    <main className="mx-auto max-w-[1500px] px-2 py-10 text-white sm:px-0 sm:py-12">
      <section className="mesh-panel dashboard-hero-shell animate-aurora relative rounded-[40px] p-8 shadow-[0_30px_140px_rgba(2,6,23,0.65)] sm:p-9">
        <div className="spotlight-sweep" />
        <div className="noise-overlay" />
        <div className="dashboard-hero-flare dashboard-hero-flare-a" />
        <div className="dashboard-hero-flare dashboard-hero-flare-b" />
        <div className="relative grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="glass-chip border-cyan-300/30 bg-cyan-300/10 text-cyan-100">{tr(language,{en:'One simple decision flow',pl:'Jeden prosty flow decyzyjny',de:'Globales Entscheidungs-Cockpit für Produkte, Kosten und Startup-Validierung',es:'Cockpit global de decisiones para productos, costes y validación startup',ja:'商品・コスト・スタートアップ検証のためのグローバル意思決定コックピット',zh:'面向产品、成本与创业验证的全球决策驾驶舱',id:'Kokpit keputusan global untuk produk, biaya, dan validasi startup',ru:'Глобальный центр решений для продуктов, затрат и проверки стартапов'})}</div>
            <h1 className="mt-4 max-w-4xl text-balance text-[clamp(3rem,5vw,5.2rem)] font-black leading-[0.92] tracking-[-0.05em] text-white">{tr(language,{en:'Check if this product will burn your budget before you spend on ads.',pl:'Sprawdź czy ten produkt spali Ci budżet zanim wydasz na reklamy.',de:'Füge URL, PDF, Screenshot oder Idee ein und sieh sofort den sichersten nächsten Schritt.',es:'Sube una URL, PDF, captura o idea y ve al instante el siguiente paso más seguro.',ja:'URL、PDF、スクリーンショット、アイデアを入れるだけで、次の安全な一手がすぐ見えます。',zh:'放入 URL、PDF、截图或想法，即可立刻看到最安全的下一步。',id:'Masukkan URL, PDF, screenshot, atau ide dan langsung lihat langkah aman berikutnya.',ru:'Вставь URL, PDF, скриншот или идею и сразу увидишь самый безопасный следующий шаг.'})}</h1>
            <p className="mt-5 max-w-3xl text-[1.05rem] leading-8 text-slate-300 sm:text-[1.12rem] sm:leading-9">{tr(language,{en:'Use one path: add a product link, description or file, then review the verdict, margin, risk and next step. Everything else stays secondary until you need it.',pl:'Używaj jednej ścieżki: dodaj link do produktu, opis albo plik, a potem sprawdź werdykt, marżę, ryzyko i kolejny krok. Reszta pozostaje drugorzędna, dopóki jej nie potrzebujesz.',de:'Nutze diesen Workspace, um Ideen zu validieren, Produkte zu vergleichen und schnellere Wachstumsentscheidungen zu treffen, ohne Budget zu verschwenden.',es:'Usa este workspace para validar ideas, comparar productos y tomar decisiones de crecimiento más rápidas sin desperdiciar presupuesto.',ja:'このワークスペースでは、アイデアの検証・商品の比較・より速い成長判断を、予算を無駄にせずに行えます。',zh:'这个工作区可帮助你验证创意、比较产品，并在不浪费预算的情况下更快做出增长决策。',id:'Gunakan workspace ini untuk memvalidasi ide, membandingkan produk, dan mengambil keputusan pertumbuhan lebih cepat tanpa membuang budget.',ru:'Используй это пространство, чтобы проверять идеи, сравнивать продукты и быстрее принимать решения о росте без лишних трат бюджета.'})}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/pricing" className="rounded-2xl border border-white/10 px-5 py-3 font-semibold hover:bg-white/5">{tr(language,{en:'Pricing',pl:'Cennik',de:'Preise',es:'Precios',ja:'料金',zh:'定价',id:'Harga',ru:'Тарифы'})}</Link>
              <Link href="/account" className="rounded-2xl border border-white/10 px-5 py-3 font-semibold hover:bg-white/5">{tr(language,{en:'Account',pl:'Konto',de:'Konto',es:'Cuenta',ja:'アカウント',zh:'账户',id:'Akun',ru:'Аккаунт'})}</Link>
              <Link href="/support" className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">{tr(language,{en:'Support',pl:'Wsparcie',de:'Support',es:'Soporte',ja:'サポート',zh:'支持',id:'Dukungan',ru:'Поддержка'})}</Link>
              {profile?.role === 'admin' && <Link href="/admin" className="rounded-2xl bg-amber-300 px-5 py-3 font-semibold text-slate-950">{tr(language,{en:'Administrator',pl:'Administrator',de:'Administrator',es:'Administrador',ja:'管理者',zh:'管理员',id:'Administrator',ru:'Администратор'})}</Link>}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                tr(language,{en:'Visual AI',pl:'Visual AI',de:'Visual AI',es:'Visual AI',pt:'IA visual',ru:'Visual AI'}),
                tr(language,{en:'PDF intelligence',pl:'Inteligencja PDF',de:'PDF-Intelligenz',es:'Inteligencia PDF',pt:'Inteligência PDF',ru:'PDF интеллект'}),
                tr(language,{en:'Anti-loss mode',pl:'Tryb anti-loss',de:'Anti-Loss-Modus',es:'Modo anti-loss',pt:'Modo anti-loss',ru:'Anti-loss режим'}),
              ].map((item) => (
                <span key={item} className="glass-chip border-white/10 bg-white/[0.04] text-slate-100">{item}</span>
              ))}
            </div>
          </div>

          <div className="premium-panel dashboard-quick-overview p-6 sm:p-7">
            <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language,{en:'Quick overview',pl:'Szybki podgląd',de:'Schnellübersicht',es:'Vista rápida',pt:'Visão rápida',ru:'Быстрый обзор'})}</div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <MetricCard language={language} label={tr(language,{en:'Plan',pl:'Plan',de:'Plan',es:'Plan',ja:'プラン',zh:'套餐',id:'Paket',ru:'План'})} value={getPlanDisplayName(profile?.plan_key)} delta={tr(language,{en:'Active package',pl:'Aktywny pakiet',de:'Aktives Paket',es:'Paquete activo',ja:'有効なパッケージ',zh:'当前套餐',id:'Paket aktif',ru:'Активный пакет'})} tone="cyan" />
              <MetricCard language={language} label={tr(language,{en:'AI Tokens',pl:'Tokeny AI',de:'AI-Tokens',es:'Tokens AI',ja:'AIトークン',zh:'AI 代币',id:'Token AI',ru:'AI токены'})} value={String(profile?.credits_balance ?? 0)} delta={tr(language,{en:'Protected usage balance',pl:'Saldo chronionego użycia',de:'Geschütztes Nutzungsguthaben',es:'Saldo de uso protegido',ja:'保護された利用残高',zh:'受保护使用余额',id:'Saldo penggunaan terlindungi',ru:'Защищённый баланс использования'})} tone="emerald" />
              <MetricCard language={language} label={tr(language,{en:'Analyses',pl:'Analizy',de:'Analysen',es:'Análisis',ja:'分析',zh:'分析次数',id:'Analisis',ru:'Анализы'})} value={String(profile?.analyses_used_this_month ?? 0)} delta={tr(language,{en:'This month',pl:'W tym miesiącu',de:'Diesen Monat',es:'Este mes',ja:'今月',zh:'本月',id:'Bulan ini',ru:'В этом месяце'})} tone="violet" />
              <MetricCard language={language} label={tr(language,{en:'Ads today',pl:'Reklamy dziś',de:'Anzeigen heute',es:'Anuncios hoy',ja:'本日の広告',zh:'今日广告',id:'Iklan hari ini',ru:'Реклама сегодня'})} value={`${rewardEvent?.ads_watched ?? 0}/${rewardSettings.dailyAdLimit}`} delta={tr(language,{en:'Rewards for watching',pl:'Nagrody za oglądanie',de:'Belohnungen fürs Ansehen',es:'Recompensas por ver',ja:'視聴報酬',zh:'观看奖励',id:'Hadiah menonton',ru:'Награды за просмотр'})} tone="amber" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 xl:grid-cols-3">
        <div className="dashboard-step-card hover-lift rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
          <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">{tr(language,{en:'Step 01',pl:'Krok 01',de:'Workflow 01',es:'Workflow 01',pt:'Fluxo 01',ru:'Сценарий 01'})}</div>
          <div className="mt-2 text-[1.35rem] font-black leading-[1.02] tracking-[-0.03em] text-white">{tr(language,{en:'Drop in the product',pl:'Wrzuć produkt',de:'Visuelle Prüfung',es:'Chequeo visual',pt:'Verificação visual',ru:'Визуальная проверка'})}</div>
          <p className="mt-2 text-sm leading-7 text-slate-300">{tr(language,{en:'Paste a URL, write a short description, or add a file. The product picks the right analysis automatically.',pl:'Wklej URL, wpisz krótki opis albo dodaj plik. Produkt sam dobierze właściwą analizę.',de:'Schneller Pfad für Screenshots, UI-Ansichten und Produktbild-Review.',es:'Ruta rápida para capturas, vistas UI y revisión de imágenes del producto.',pt:'Fluxo rápido para capturas, telas UI e revisão de imagens de produto.',ru:'Быстрый режим для скриншотов, UI и проверки изображений товара.'})}</p>
        </div>
        <div className="dashboard-step-card hover-lift rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
          <div className="text-[11px] uppercase tracking-[0.22em] text-emerald-200">{tr(language,{en:'Step 02',pl:'Krok 02',de:'Workflow 02',es:'Workflow 02',pt:'Fluxo 02',ru:'Сценарий 02'})}</div>
          <div className="mt-2 text-[1.35rem] font-black leading-[1.02] tracking-[-0.03em] text-white">{tr(language,{en:'Read the verdict fast',pl:'Przeczytaj werdykt szybko',de:'PDF / Dokumentprüfung',es:'Revisión PDF / documento',pt:'Revisão de PDF / documento',ru:'Проверка PDF / документа'})}</div>
          <p className="mt-2 text-sm leading-7 text-slate-300">{tr(language,{en:'The main output is simple: BUY, TEST or SKIP, plus margin, risk and why the system says that.',pl:'Główny wynik jest prosty: BUY, TEST albo SKIP, plus marża, ryzyko i powód, dlaczego system tak mówi.',de:'Hole Bedeutung aus Dokumenten, ohne die Anti-Loss-Perspektive zu verlieren.',es:'Extrae significado de documentos sin perder la perspectiva anti-loss.',pt:'Extraia sentido dos documentos sem perder a perspetiva anti-loss.',ru:'Извлекай смысл из документов, не теряя anti-loss подход.'})}</p>
        </div>
        <div className="dashboard-step-card hover-lift rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
          <div className="text-[11px] uppercase tracking-[0.22em] text-violet-200">{tr(language,{en:'Step 03',pl:'Krok 03',de:'Workflow 03',es:'Workflow 03',pt:'Fluxo 03',ru:'Сценарий 03'})}</div>
          <div className="mt-2 text-[1.35rem] font-black leading-[1.02] tracking-[-0.03em] text-white">{tr(language,{en:'Take the next safe step',pl:'Wykonaj bezpieczny kolejny krok',de:'Preis & Marge',es:'Precio y margen',pt:'Preço e margem',ru:'Цена и маржа'})}</div>
          <p className="mt-2 text-sm leading-7 text-slate-300">{tr(language,{en:'Use the recommendation to test, skip, fix margin or improve the offer before spending more.',pl:'Użyj rekomendacji, aby testować, odpuścić, poprawić marżę albo ulepszyć ofertę zanim wydasz więcej.',de:'Gehe von der Idee zum kontrollierten Test mit klareren Zahlen und Schutzregeln.',es:'Pasa de la idea al test controlado con números más claros y reglas de protección.',pt:'Passe da ideia ao teste controlado com números mais claros e regras de proteção.',ru:'Переходи от идеи к контролируемому тесту с более ясными цифрами и правилами защиты.'})}</p>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="mesh-panel dashboard-operator-shell animate-aurora relative p-6 sm:p-7">
          <div className="spotlight-sweep" />
          <div className="noise-overlay" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Advanced operator layer', pl: 'Zaawansowana warstwa operatora' })}</div>
                <h2 className="text-balance mt-2 max-w-3xl text-[clamp(2rem,3.4vw,3.2rem)] font-black leading-[1.02] text-white">{tr(language, { en: 'Keep advanced tools ready, visible and one click away when the workflow needs more depth', pl: 'Miej zaawansowane narzędzia gotowe, widoczne i o jedno kliknięcie dalej, gdy workflow potrzebuje większej głębi' })}</h2>
              </div>
              <div className="glass-chip border-cyan-300/30 bg-cyan-300/10 text-cyan-100">{tr(language, { en: 'Operator console ready', pl: 'Konsola operatora gotowa' })}</div>
            </div>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">{tr(language, { en: 'Automations, integrations and alert routing still exist, but they should support the decision flow instead of competing with it on first view.', pl: 'Automatyzacje, integracje i routing alertów nadal istnieją, ale mają wspierać flow decyzji zamiast konkurować z nim w pierwszym widoku.' })}</p>

            <details className="operator-launch-panel mt-6 rounded-[32px] border border-rose-300/22 p-3 shadow-[0_28px_90px_rgba(127,29,29,0.22)]">
              <div className="operator-launch-orb operator-launch-orb-a" />
              <div className="operator-launch-orb operator-launch-orb-b" />
              <div className="operator-launch-scan" />
              <summary className="list-none cursor-pointer rounded-[26px] border border-rose-300/20 bg-slate-950/72 p-5 transition duration-300 hover:border-rose-200/40 hover:bg-slate-950/88">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-rose-200">{tr(language, { en: 'Expand operator workspace', pl: 'Rozwiń workspace operatora' })}</div>
                    <div className="mt-2 text-xl font-black leading-6 text-white sm:text-2xl">{tr(language, { en: 'Open advanced operator tools', pl: 'Otwórz zaawansowane narzędzia operatora' })}</div>
                    <div className="mt-2 text-sm leading-6 text-slate-300">{tr(language, { en: 'Automations, integrations, alert routing and operating controls in one stronger command surface.', pl: 'Automatyzacje, integracje, routing alertów i kontrolki operacyjne w jednej, mocniejszej powierzchni sterowania.' })}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[tr(language, { en: 'Automations', pl: 'Automatyzacje' }), tr(language, { en: 'Integrations', pl: 'Integracje' }), tr(language, { en: 'Alerts', pl: 'Alerty' })].map((item) => (
                      <span key={item} className="rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-100">{item}</span>
                    ))}
                  </div>
                </div>
              </summary>
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                {premiumVisibilityCards.map((card) => (
                  <Link key={card.title} href={card.href} className="dashboard-operator-card group relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/55 p-5 transition duration-300 hover:-translate-y-1 hover:border-rose-300/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-rose-400/8 opacity-90" />
                    <div className="relative">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{card.eyebrow}</div>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${card.chipClass}`}>{card.status}</span>
                      </div>
                      <div className="mt-3 text-[1.35rem] font-black leading-[1.02] tracking-[-0.03em] text-white">{card.title}</div>
                      <p className="mt-2 text-sm leading-7 text-slate-300">{card.copy}</p>
                      <div className="mt-4 text-sm font-semibold text-rose-100 transition group-hover:text-white">{card.cta} →</div>
                    </div>
                  </Link>
                ))}
              </div>
            </details>
          </div>
        </div>

        <div className="premium-panel dashboard-pulse-shell p-6 sm:p-7">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Global operator pulse', pl: 'Globalny puls operatora' })}</div>
          <h2 className="mt-2 text-3xl font-black text-white">{tr(language, { en: 'What now feels more premium for users', pl: 'Co teraz jest bardziej premium dla usera' })}</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-200">
            {[
              `${tr(language, { en: 'Market watch status', pl: 'Status market watch' })}: ${automationSettings.autoCompetitorScans ? tr(language, { en: 'live and ready', pl: 'live i gotowy' }) : tr(language, { en: 'currently paused', pl: 'obecnie wstrzymany' })}`,
              `${tr(language, { en: 'Digest layer', pl: 'Warstwa digestów' })}: ${automationSettings.weeklyMarketDigest ? tr(language, { en: 'weekly summaries enabled', pl: 'tygodniowe podsumowania włączone' }) : tr(language, { en: 'available when enabled', pl: 'dostępna po włączeniu' })}`,
              `${tr(language, { en: 'Notification routing', pl: 'Routing powiadomień' })}: ${enabledNotificationChannels} ${tr(language, { en: 'channels active', pl: 'kanały aktywne' })}`,
              `${tr(language, { en: 'Workspace lanes', pl: 'Ścieżki workspace' })}: ${activeCommerceChannels} ${tr(language, { en: 'commerce lanes active', pl: 'aktywnych ścieżek commerce' })}`,
              `${tr(language, { en: 'Budget safeguards', pl: 'Zabezpieczenia budżetu' })}: ${automationSettings.killSwitchEnabled ? tr(language, { en: 'unsafe scale is blocked automatically', pl: 'niebezpieczne skalowanie jest blokowane automatycznie' }) : tr(language, { en: 'protection is lighter and less strict', pl: 'ochrona działa lżej i mniej restrykcyjnie' })}`,
            ].map((item) => (
              <div key={item} className="dashboard-pulse-item rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4 leading-6">{item}</div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/automations" className="rounded-2xl bg-cyan-300 px-4 py-3 text-center text-sm font-semibold text-slate-950">{tr(language, { en: 'Open automations', pl: 'Otwórz automatyzacje' })}</Link>
            <Link href="/account" className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/5">{tr(language, { en: 'Refine account', pl: 'Dopracuj konto' })}</Link>
          </div>
        </div>
      </section>

      <DashboardShell
        language={language}
        initialLatestDecision={latestDecision}
        rewardAdsProps={{
          initialCredits: profile?.credits_balance ?? 0,
          watchedToday: rewardEvent?.ads_watched ?? 0,
          dailyLimit: rewardSettings.dailyAdLimit,
          rewardCredits: rewardSettings.dailyRewardCredits,
          rewardToken,
        }}
        referralProps={{
          referralCode: profile?.referral_code || '',
          rewardCredits: referralSettings.rewardCredits,
        }}
      />
    </main>
  );
}
