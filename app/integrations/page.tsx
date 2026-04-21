import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import MetricCard from '@/components/pro-ui/MetricCard';
import InsightPanel from '@/components/pro-ui/InsightPanel';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';
import { getUserIntegrationSettings } from '@/lib/user-integrations';

export default async function IntegrationsPage() {
  const language = await getLanguage();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const settings = await getUserIntegrationSettings(user.id);

  const storefronts = [
    {
      name: 'Shopify',
      enabled: settings.shopifyEnabled,
      check: settings.connectionChecks.shopify,
      detail: settings.shopifyStoreDomain || tr(language, { en: 'Your main D2C store base with a free endpoint check.', pl: 'Twoja główna baza D2C z darmowym sprawdzeniem endpointu.' }),
    },
    {
      name: 'WooCommerce',
      enabled: settings.woocommerceEnabled,
      check: settings.connectionChecks.woocommerce,
      detail: settings.woocommerceStoreUrl || tr(language, { en: 'Flexible store setup with free endpoint validation.', pl: 'Elastyczny setup sklepu z darmową walidacją endpointu.' }),
    },
  ];

  const marketplaceLanes = [
    {
      name: 'Amazon',
      enabled: settings.amazonEnabled,
      detail: tr(language, { en: 'Keep for broader reach when you are ready to test a bigger marketplace.', pl: 'Zostaw dla większego zasięgu, gdy będziesz gotowy testować większy marketplace.' }),
    },
    {
      name: 'eBay',
      enabled: settings.ebayEnabled,
      detail: tr(language, { en: 'Good for quick demand tests and lighter catalog experiments.', pl: 'Dobre do szybkich testów popytu i lżejszych eksperymentów katalogowych.' }),
    },
    {
      name: 'Allegro',
      enabled: settings.allegroEnabled,
      detail: tr(language, { en: 'The most reasonable regional lane if you want to test Poland first.', pl: 'Najrozsądniejsza ścieżka regionalna, jeśli chcesz najpierw testować Polskę.' }),
    },
  ];

  const syncItems = [
    {
      name: tr(language, { en: 'Inventory sync', pl: 'Synchronizacja inventory' }),
      enabled: settings.syncInventory,
      detail: tr(language, { en: 'Keep stock visibility simple and current.', pl: 'Utrzymuj prostą i aktualną widoczność stanu.' }),
    },
    {
      name: tr(language, { en: 'Orders sync', pl: 'Synchronizacja zamówień' }),
      enabled: settings.syncOrders,
      detail: tr(language, { en: 'See order flow without adding heavy operator logic.', pl: 'Widzisz flow zamówień bez dokładania ciężkiej logiki operatorskiej.' }),
    },
    {
      name: tr(language, { en: 'Pricing sync', pl: 'Synchronizacja pricingu' }),
      enabled: settings.syncPricing,
      detail: tr(language, { en: 'Keep price checks visible in the leanest possible setup.', pl: 'Utrzymuj checki cenowe w najlżejszym możliwym setupie.' }),
    },
  ];

  const connectedStores = storefronts.filter((item) => item.check.state === 'validated').length;
  const enabledMarketplaces = marketplaceLanes.filter((item) => item.enabled).length;
  const enabledSyncs = syncItems.filter((item) => item.enabled).length;

  const getStoreStatus = (state: string) => {
    if (state === 'validated') return { label: tr(language, { en: 'Connected', pl: 'Połączone' }), badgeClass: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' };
    if (state === 'invalid') return { label: tr(language, { en: 'Needs fix', pl: 'Wymaga poprawy' }), badgeClass: 'border-amber-300/30 bg-amber-300/10 text-amber-100' };
    if (state === 'unavailable') return { label: tr(language, { en: 'Verification needed', pl: 'Wymaga weryfikacji' }), badgeClass: 'border-sky-300/30 bg-sky-300/10 text-sky-100' };
    return { label: tr(language, { en: 'Not connected', pl: 'Niepodłączone' }), badgeClass: 'border-white/10 bg-white/5 text-slate-300' };
  };

  return (
    <main className="mx-auto max-w-[1450px] px-4 py-14 text-white sm:px-6">
      <section className="mesh-panel animate-aurora relative rounded-[40px] p-8 shadow-[0_30px_140px_rgba(2,6,23,0.65)]">
        <div className="spotlight-sweep" />
        <div className="noise-overlay" />
        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Free growth and connection map', pl: 'Darmowa mapa wzrostu i połączeń' })}</div>
          <h1 className="mt-4 max-w-4xl text-[clamp(2.4rem,4.5vw,4.8rem)] font-black leading-[0.96] tracking-[-0.04em] text-white">{tr(language, { en: 'Connect the essentials first: your store, one marketplace lane, and only the free syncs you really need', pl: 'Najpierw połącz podstawy: swój sklep, jedną ścieżkę marketplace i tylko te darmowe synchronizacje, których naprawdę potrzebujesz' })}</h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">{tr(language, { en: 'This page is now simplified for a normal user. Real free account connection is available for Shopify and WooCommerce. Amazon, eBay, and Allegro stay as the most reasonable marketplace lanes. Paid social validation is intentionally out of this flow.', pl: 'Ta strona jest teraz uproszczona pod zwykłego usera. Realne darmowe połączenie kont działa dla Shopify i WooCommerce. Amazon, eBay i Allegro zostają jako najbardziej rozsądne ścieżki marketplace. Płatna walidacja social jest celowo poza tym flow.' })}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/account/connections" className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">{tr(language, { en: 'Connect your accounts', pl: 'Połącz swoje konta' })}</Link>
            <Link href="/dashboard" className="rounded-2xl border border-white/10 px-5 py-3 font-semibold hover:bg-white/5">{tr(language, { en: 'Back to dashboard', pl: 'Wróć do dashboardu' })}</Link>
            {profile?.role === 'admin' && <Link href="/admin/integrations" className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 font-semibold text-cyan-50">{tr(language, { en: 'Admin integration settings', pl: 'Ustawienia integracji admina' })}</Link>}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard language={language} label={tr(language, { en: 'Validated store accounts', pl: 'Zweryfikowane konta sklepu' })} value={`${connectedStores}/2`} delta="Shopify • WooCommerce" tone="cyan" />
        <MetricCard language={language} label={tr(language, { en: 'Enabled marketplace lanes', pl: 'Włączone ścieżki marketplace' })} value={`${enabledMarketplaces}/3`} delta="Amazon • eBay • Allegro" tone="emerald" />
        <MetricCard language={language} label={tr(language, { en: 'Lean sync setup', pl: 'Lean setup synchronizacji' })} value={`${enabledSyncs}/3`} delta={tr(language, { en: 'Inventory • Orders • Pricing', pl: 'Inventory • Zamówienia • Pricing' })} tone="violet" />
        <MetricCard language={language} label={tr(language, { en: 'Extra token cost', pl: 'Dodatkowy koszt tokenów' })} value="0" delta={tr(language, { en: 'This user flow avoids paid API token dependencies.', pl: 'Ten user flow omija zależności od płatnych tokenów API.' })} tone="amber" />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-cyan-300/20 bg-cyan-300/10 p-5 text-sm leading-6 text-cyan-50">
            {tr(language, { en: 'As a normal user, you now have a dedicated self-service panel under Account -> Connect your accounts. That is where real store connections are configured and tested.', pl: 'Jako zwykły user masz teraz dedykowany panel self-service w Konto -> Połącz swoje konta. To tam konfiguruje się i testuje realne połączenia sklepu.' })}
          </div>

          <div className="premium-panel p-6">
            <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Step by step for a normal user', pl: 'Krok po kroku dla zwykłego usera' })}</div>
            <h2 className="mt-2 text-3xl font-black text-white">{tr(language, { en: 'Keep the order simple', pl: 'Zachowaj prostą kolejność' })}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { step: '01', title: tr(language, { en: 'Connect Shopify or WooCommerce', pl: 'Podłącz Shopify albo WooCommerce' }), text: tr(language, { en: 'Start from the store you already control.', pl: 'Zacznij od sklepu, który już kontrolujesz.' }) },
                { step: '02', title: tr(language, { en: 'Run the free validation', pl: 'Uruchom darmową walidację' }), text: tr(language, { en: 'UFREV checks the public store endpoint before showing Connected.', pl: 'UFREV sprawdza publiczny endpoint sklepu zanim pokaże status Połączone.' }) },
                { step: '03', title: tr(language, { en: 'Turn on one marketplace lane', pl: 'Włącz jedną ścieżkę marketplace' }), text: tr(language, { en: 'Pick Amazon, eBay, or Allegro instead of trying everything at once.', pl: 'Wybierz Amazon, eBay albo Allegro zamiast próbować wszystkiego naraz.' }) },
                { step: '04', title: tr(language, { en: 'Keep only lean syncs', pl: 'Zostaw tylko lean synchronizacje' }), text: tr(language, { en: 'Inventory, orders, and pricing are enough for an MVP setup.', pl: 'Inventory, zamówienia i pricing wystarczą w setupie MVP.' }) },
              ].map((item) => (
                <div key={item.step} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">{tr(language, { en: 'Step', pl: 'Krok' })} {item.step}</div>
                  <div className="mt-2 text-base font-bold text-white">{item.title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">{item.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-panel p-6">
            <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-200">{tr(language, { en: 'Your free storefronts', pl: 'Twoje darmowe storefronty' })}</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {storefronts.map((item) => {
                const status = getStoreStatus(item.check.state);
                return (
                  <div key={item.name} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xl font-bold text-white">{item.name}</div>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${status.badgeClass}`}>{status.label}</span>
                    </div>
                    <div className="mt-3 text-sm leading-6 text-slate-300">{item.detail}</div>
                    <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-slate-200">{item.check.message}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <InsightPanel language={language} title={tr(language, { en: 'What is worth keeping', pl: 'Co warto zostawić' })} items={[
            tr(language, { en: 'Shopify and WooCommerce are the strongest free real connections because public endpoint validation is enough to verify them.', pl: 'Shopify i WooCommerce to najmocniejsze darmowe realne połączenia, bo do weryfikacji wystarcza publiczny endpoint.' }),
            tr(language, { en: 'Amazon and eBay are the broadest marketplace lanes for lean cross-market testing.', pl: 'Amazon i eBay to najszersze ścieżki marketplace do lean testów między rynkami.' }),
            tr(language, { en: 'Allegro is the most practical regional lane if you want one sensible CEE option.', pl: 'Allegro to najbardziej praktyczna ścieżka regionalna, jeśli chcesz jedną sensowną opcję CEE.' }),
          ]} />

          <div className="premium-panel p-6">
            <div className="text-[11px] uppercase tracking-[0.24em] text-violet-200">{tr(language, { en: 'Lean marketplace lanes', pl: 'Lean ścieżki marketplace' })}</div>
            <div className="mt-4 space-y-3">
              {marketplaceLanes.map((item) => (
                <div key={item.name} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-base font-bold text-white">{item.name}</div>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${item.enabled ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-300'}`}>{item.enabled ? tr(language, { en: 'Enabled', pl: 'Włączone' }) : tr(language, { en: 'Available', pl: 'Dostępne' })}</span>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-panel p-6">
            <div className="text-[11px] uppercase tracking-[0.24em] text-amber-200">{tr(language, { en: 'Lean sync scope', pl: 'Lean zakres synchronizacji' })}</div>
            <div className="mt-4 space-y-3">
              {syncItems.map((item) => (
                <div key={item.name} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-base font-bold text-white">{item.name}</div>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${item.enabled ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : 'border-white/10 bg-white/5 text-slate-300'}`}>{item.enabled ? tr(language, { en: 'On', pl: 'Wł.' }) : tr(language, { en: 'Off', pl: 'Wył.' })}</span>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
