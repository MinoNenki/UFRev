import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import MetricCard from '@/components/pro-ui/MetricCard';
import { CategoryBadge, CategoryBadgeLegend, type BadgeCategory } from '@/components/pro-ui/CategoryBadge';
import { getLanguage } from '@/lib/i18n-server';
import { tr } from '@/lib/i18n';
import { getUserIntegrationSettings } from '@/lib/user-integrations';

export default async function AccountConnectionsPage({ searchParams }: { searchParams?: { saved?: string; error?: string; tested?: string } }) {
  const language = await getLanguage();
  const params = searchParams || {};
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const settings = await getUserIntegrationSettings(user.id);
  const connectedStores = [settings.connectionChecks.shopify, settings.connectionChecks.woocommerce].filter((item) => item.state === 'validated').length;
  const enabledMarketplaces = [settings.amazonEnabled, settings.ebayEnabled, settings.allegroEnabled].filter(Boolean).length;
  const enabledSyncs = [settings.syncInventory, settings.syncOrders, settings.syncPricing].filter(Boolean).length;
  const userMarketplaceOptions = [
    {
      name: 'amazonEnabled',
      label: 'Amazon',
      badgeCategory: 'channel' as BadgeCategory,
      description: tr(language, { en: 'Simple marketplace lane for wider reach without paid API validation.', pl: 'Prosta ścieżka marketplace dla szerszego zasięgu bez płatnej walidacji API.' }),
      checked: settings.amazonEnabled,
    },
    {
      name: 'ebayEnabled',
      label: 'eBay',
      badgeCategory: 'channel' as BadgeCategory,
      description: tr(language, { en: 'Useful when you want one extra marketplace path with low setup friction.', pl: 'Przydatne, gdy chcesz mieć jedną dodatkową ścieżkę marketplace z małym tarciem konfiguracji.' }),
      checked: settings.ebayEnabled,
    },
    {
      name: 'allegroEnabled',
      label: 'Allegro',
      badgeCategory: 'region' as BadgeCategory,
      description: tr(language, { en: 'Best choice for Poland or nearby regional expansion in this lightweight flow.', pl: 'Najlepszy wybór dla Polski lub pobliskiej ekspansji regionalnej w tym lekkim flow.' }),
      checked: settings.allegroEnabled,
    },
  ];

  const userSyncOptions = [
    {
      name: 'syncInventory',
      label: tr(language, { en: 'Sync inventory', pl: 'Synchronizuj inventory' }),
      badgeCategory: 'data' as BadgeCategory,
      description: tr(language, { en: 'Keeps your visible stock more consistent across enabled channels.', pl: 'Utrzymuje większą spójność widocznych stanów między włączonymi kanałami.' }),
      checked: settings.syncInventory,
    },
    {
      name: 'syncOrders',
      label: tr(language, { en: 'Sync orders', pl: 'Synchronizuj zamówienia' }),
      badgeCategory: 'data' as BadgeCategory,
      description: tr(language, { en: 'Lets your store and connected flow share order state more cleanly.', pl: 'Pozwala sklepowi i podłączonemu flow czyściej współdzielić stan zamówień.' }),
      checked: settings.syncOrders,
    },
    {
      name: 'syncPricing',
      label: tr(language, { en: 'Sync pricing', pl: 'Synchronizuj pricing' }),
      badgeCategory: 'safety' as BadgeCategory,
      description: tr(language, { en: 'Useful when you want price changes to stay aligned in the simplest possible way.', pl: 'Przydatne, gdy chcesz utrzymać zgodność zmian cen w możliwie najprostszym układzie.' }),
      checked: settings.syncPricing,
    },
  ];

  return (
    <main className="mx-auto max-w-[1450px] px-4 py-14 text-white sm:px-6">
      <section className="mesh-panel relative rounded-[40px] p-8 shadow-[0_30px_140px_rgba(2,6,23,0.65)]">
        <div className="spotlight-sweep" />
        <div className="noise-overlay" />
        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'My connections', pl: 'Moje połączenia' })}</div>
          <h1 className="mt-4 max-w-4xl text-[clamp(2.4rem,4.2vw,4.5rem)] font-black leading-[0.96] tracking-[-0.04em] text-white">{tr(language, { en: 'Connect your store accounts with a free, minimum-viable setup', pl: 'Połącz swoje konta sklepu w darmowym, minimum viable setupie' })}</h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">{tr(language, { en: 'This panel is built for normal users. Real free validation is available for Shopify and WooCommerce. Amazon, eBay, and Allegro stay as simple growth lanes you can turn on without paid API tokens.', pl: 'Ten panel jest zbudowany dla zwykłego usera. Realna darmowa walidacja działa dla Shopify i WooCommerce. Amazon, eBay i Allegro zostają jako proste ścieżki wzrostu, które możesz włączyć bez płatnych tokenów API.' })}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/integrations" className="rounded-2xl border border-white/10 px-5 py-3 font-semibold hover:bg-white/5">{tr(language, { en: 'Open growth map', pl: 'Otwórz mapę wzrostu' })}</Link>
            <Link href="/account" className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">{tr(language, { en: 'Back to account', pl: 'Wróć do konta' })}</Link>
          </div>
        </div>
      </section>

      {(params.saved || params.error || params.tested) && <div className={`mt-6 rounded-2xl border p-4 ${params.error ? 'border-rose-300/30 bg-rose-300/10 text-rose-200' : 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200'}`}>{params.error ? tr(language, { en: 'Could not save your connection settings.', pl: 'Nie udało się zapisać ustawień połączeń.' }) : params.tested ? tr(language, { en: `Validation refreshed for ${params.tested}.`, pl: `Odświeżono walidację dla ${params.tested}.` }) : tr(language, { en: 'Connection settings saved.', pl: 'Ustawienia połączeń zapisane.' })}</div>}

      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard language={language} label={tr(language, { en: 'Validated stores', pl: 'Zweryfikowane sklepy' })} value={`${connectedStores}/2`} delta="Shopify • WooCommerce" tone="cyan" />
        <MetricCard language={language} label={tr(language, { en: 'Marketplace lanes', pl: 'Ścieżki marketplace' })} value={`${enabledMarketplaces}/3`} delta="Amazon • eBay • Allegro" tone="emerald" />
        <MetricCard language={language} label={tr(language, { en: 'Free sync scope', pl: 'Zakres darmowej synchronizacji' })} value={`${enabledSyncs}/3`} delta={tr(language, { en: 'Inventory • Orders • Pricing', pl: 'Inventory • Zamówienia • Pricing' })} tone="violet" />
        <MetricCard language={language} label={tr(language, { en: 'Paid tokens needed', pl: 'Płatne tokeny potrzebne' })} value="0" delta={tr(language, { en: 'This panel avoids paid social API validation.', pl: 'Ten panel omija płatną walidację social API.' })} tone="amber" />
      </section>

      <CategoryBadgeLegend
        language={language}
        categories={['store', 'validation', 'channel', 'region', 'data', 'safety']}
        title={tr(language, { en: 'Badge legend', pl: 'Legenda oznaczeń' })}
        description={tr(language, { en: 'The same icon-and-color system now explains what is a store, validation, channel, region, data flow, or safety rule before you edit anything.', pl: 'Ten sam system ikon i kolorów od razu pokazuje co jest sklepem, walidacją, kanałem, regionem, przepływem danych albo zabezpieczeniem.' })}
        className="mt-6"
      />

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form action="/api/account/integrations/settings" method="post" className="rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Free real account connections', pl: 'Darmowe realne połączenia kont' })}</div>
          <h2 className="mt-2 text-3xl font-black text-white">{tr(language, { en: 'Connect Shopify and WooCommerce', pl: 'Podłącz Shopify i WooCommerce' })}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{tr(language, { en: 'These are the two storefront connections we can validate for free through public endpoints. No paid ad tokens are required.', pl: 'To są dwa połączenia storefrontów, które możemy walidować za darmo przez publiczne endpointy. Nie potrzeba płatnych tokenów reklamowych.' })}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">Shopify</div>
                    <CategoryBadge category="store" language={language} />
                    <CategoryBadge category="validation" language={language} />
                  </div>
                  <div className="mt-2 text-lg font-bold text-white">{tr(language, { en: 'Store domain', pl: 'Domena sklepu' })}</div>
                </div>
                <input type="checkbox" name="shopifyEnabled" defaultChecked={settings.shopifyEnabled} className="h-4 w-4" />
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-400">{tr(language, { en: 'Paste your Shopify domain so UFREV can check the public storefront endpoint for free.', pl: 'Wklej domenę Shopify, aby UFREV mógł za darmo sprawdzić publiczny endpoint storefrontu.' })}</p>
              <input name="shopifyStoreDomain" defaultValue={settings.shopifyStoreDomain} placeholder="your-store.myshopify.com" className="input mt-4" />
              <div className="mt-3 text-sm leading-6 text-slate-300">{settings.connectionChecks.shopify.message}</div>
              <button type="submit" name="intent" value="test-shopify" className="mt-4 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-100">{tr(language, { en: 'Test Shopify', pl: 'Test Shopify' })}</button>
            </label>

            <label className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-emerald-200">WooCommerce</div>
                    <CategoryBadge category="store" language={language} />
                    <CategoryBadge category="validation" language={language} />
                  </div>
                  <div className="mt-2 text-lg font-bold text-white">{tr(language, { en: 'Store URL', pl: 'URL sklepu' })}</div>
                </div>
                <input type="checkbox" name="woocommerceEnabled" defaultChecked={settings.woocommerceEnabled} className="h-4 w-4" />
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-400">{tr(language, { en: 'Paste the store URL so UFREV can inspect WooCommerce REST endpoints without paid tokens.', pl: 'Wklej URL sklepu, aby UFREV mógł sprawdzić endpointy REST WooCommerce bez płatnych tokenów.' })}</p>
              <input name="woocommerceStoreUrl" defaultValue={settings.woocommerceStoreUrl} placeholder="https://store.example.com" className="input mt-4" />
              <div className="mt-3 text-sm leading-6 text-slate-300">{settings.connectionChecks.woocommerce.message}</div>
              <button type="submit" name="intent" value="test-woocommerce" className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100">{tr(language, { en: 'Test WooCommerce', pl: 'Test WooCommerce' })}</button>
            </label>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-violet-200">{tr(language, { en: 'Free marketplace lanes', pl: 'Darmowe ścieżki marketplace' })}</div>
              <div className="mt-4 space-y-3">
                {userMarketplaceOptions.map((option) => (
                  <label key={option.name} className="block rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" name={option.name} defaultChecked={Boolean(option.checked)} className="mt-1" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <CategoryBadge category={option.badgeCategory} language={language} />
                          <div className="font-medium text-white">{option.label}</div>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-400">{option.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-4 text-sm leading-6 text-slate-300">{tr(language, { en: 'These stay as simple growth lanes in your workspace. They do not require paid API tokens in this MVP flow.', pl: 'Te pozycje zostają prostymi ścieżkami wzrostu w Twoim workspace. W tym MVP nie wymagają płatnych tokenów API.' })}</div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-amber-200">{tr(language, { en: 'Minimum viable syncs', pl: 'Synchronizacje minimum viable' })}</div>
              <div className="mt-4 space-y-3">
                {userSyncOptions.map((option) => (
                  <label key={option.name} className="block rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" name={option.name} defaultChecked={Boolean(option.checked)} className="mt-1" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <CategoryBadge category={option.badgeCategory} language={language} />
                          <div className="font-medium text-white">{option.label}</div>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-400">{option.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-4 text-sm leading-6 text-slate-300">{tr(language, { en: 'We intentionally leave out paid social sync and heavy routing. This is the leanest useful setup for a normal user.', pl: 'Celowo pomijamy płatny social sync i ciężki routing. To najlżejszy sensowny setup dla zwykłego usera.' })}</div>
            </div>
          </div>

          <button type="submit" name="intent" value="save" className="mt-6 rounded-2xl bg-cyan-300 px-6 py-3 font-semibold text-slate-950">{tr(language, { en: 'Save free connections', pl: 'Zapisz darmowe połączenia' })}</button>
        </form>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
            <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'What we keep in MVP', pl: 'Co zostawiamy w MVP' })}</div>
            <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
              {[tr(language, { en: 'Shopify and WooCommerce stay because they can be validated for free and are the real base of most stores.', pl: 'Shopify i WooCommerce zostają, bo da się je zwalidować za darmo i są realną bazą większości sklepów.' }), tr(language, { en: 'Amazon, eBay, and Allegro stay as the most reasonable marketplace lanes for a lean ecommerce setup.', pl: 'Amazon, eBay i Allegro zostają jako najrozsądniejsze ścieżki marketplace dla lean ecommerce.' }), tr(language, { en: 'TikTok, Meta, and other paid-social checks are intentionally out of this user panel because they need extra server tokens.', pl: 'TikTok, Meta i inne paid-social checki są celowo poza tym panelem usera, bo wymagają dodatkowych tokenów serwerowych.' })].map((item) => <div key={item} className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">{item}</div>)}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
            <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-200">{tr(language, { en: 'Where to use it', pl: 'Gdzie tego używać' })}</div>
            <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
              {[tr(language, { en: 'Use this page when you want to connect your real storefront.', pl: 'Używaj tej strony, gdy chcesz podłączyć swój realny storefront.' }), tr(language, { en: 'Use the integrations map when you want to understand where to expand next.', pl: 'Używaj mapy integracji, gdy chcesz zrozumieć gdzie rozwijać się dalej.' }), tr(language, { en: 'Use admin integration settings only when you manage the whole workspace globally.', pl: 'Używaj ustawień integracji admina tylko wtedy, gdy zarządzasz całym workspace globalnie.' })].map((item) => <div key={item} className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">{item}</div>)}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}