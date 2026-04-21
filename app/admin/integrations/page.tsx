import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { getIntegrationSettings } from '@/lib/profit-config';
import type { IntegrationConnectionCheck } from '@/lib/integration-health';
import MetricCard from '@/components/pro-ui/MetricCard';
import InsightPanel from '@/components/pro-ui/InsightPanel';
import { CategoryBadge, CategoryBadgeLegend, type BadgeCategory } from '@/components/pro-ui/CategoryBadge';
import TutorialMode, { TutorialHint, TutorialStep } from '@/components/pro-ui/TutorialMode';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';

export default async function AdminIntegrationsPage({ searchParams }: { searchParams?: { updated?: string; error?: string; tested?: string } }) {
  const language = await getLanguage();
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) redirect('/dashboard');
  const params = searchParams || {};
  const settings = await getIntegrationSettings();
  const tested = params.tested || '';
  const testedLabel = tested === 'shopify' ? 'Shopify' : tested === 'woocommerce' ? 'WooCommerce' : tested === 'social' ? tr(language, { en: 'social channels', pl: 'kanałów social' }) : tr(language, { en: 'all connections', pl: 'wszystkich połączeń' });

  const checkStateLabel = (state: IntegrationConnectionCheck['state']) =>
    tr(language, {
      en: state.replace('_', ' '),
      pl:
        state === 'validated'
          ? 'zweryfikowane'
          : state === 'invalid'
            ? 'błędne'
            : state === 'unavailable'
              ? 'niedostępne'
              : 'nieustawione',
    });

  const globalCount = [settings.amazonEnabled, settings.ebayEnabled, settings.alibabaEnabled, settings.aliexpressEnabled, settings.walmartEnabled, settings.etsyEnabled, settings.rakutenEnabled].filter(Boolean).length;
  const euCount = [settings.allegroEnabled, settings.cdiscountEnabled, settings.emagEnabled, settings.ottoEnabled, settings.zalandoEnabled].filter(Boolean).length;
  const storefrontCount = [settings.shopifyEnabled, settings.woocommerceEnabled].filter(Boolean).length;
  const dataSurfaces = [settings.syncInventory, settings.syncOrders, settings.syncPricing, settings.syncListings, settings.syncReturns, settings.syncTraffic].filter(Boolean).length;
  const validatedConnections = ['shopify', 'woocommerce'].filter((key) => settings.connectionChecks[key as 'shopify' | 'woocommerce'].state === 'validated').length;
  const channelGroups = [
    {
      eyebrow: tr(language, { en: 'Layer 01', pl: 'Warstwa 01' }),
      title: tr(language, { en: 'Global marketplaces', pl: 'Globalne marketplace' }),
      copy: tr(language, { en: 'Amazon, eBay, Alibaba, AliExpress, Walmart, Etsy, and Rakuten should sit in one clean expansion block.', pl: 'Amazon, eBay, Alibaba, AliExpress, Walmart, Etsy i Rakuten powinny siedzieć w jednym czytelnym bloku ekspansji.' }),
      chips: ['Amazon', 'Alibaba', 'AliExpress', 'Walmart', 'eBay'],
      status: `${globalCount}/7 ${tr(language, { en: 'enabled', pl: 'włączone' })}`,
      accent: 'text-cyan-200',
    },
    {
      eyebrow: tr(language, { en: 'Layer 02', pl: 'Warstwa 02' }),
      title: tr(language, { en: 'Europe / regional expansion', pl: 'Europa / ekspansja regionalna' }),
      copy: tr(language, { en: 'Allegro, Cdiscount, eMAG, OTTO, and Zalando make the regional strategy readable across Europe.', pl: 'Allegro, Cdiscount, eMAG, OTTO i Zalando porządkują strategię regionalną dla Europy.' }),
      chips: ['Allegro', 'Cdiscount', 'eMAG', 'OTTO', 'Zalando'],
      status: `${euCount}/5 ${tr(language, { en: 'enabled', pl: 'włączone' })}`,
      accent: 'text-emerald-200',
    },
    {
      eyebrow: tr(language, { en: 'Layer 03', pl: 'Warstwa 03' }),
      title: tr(language, { en: 'Core storefronts', pl: 'Główne storefronty' }),
      copy: tr(language, { en: 'Shopify and WooCommerce stay as the clearest admin-facing storefront layer for the free MVP flow.', pl: 'Shopify i WooCommerce zostają jako najczytelniejsza warstwa sklepów po stronie admina dla darmowego MVP.' }),
      chips: ['Shopify', 'WooCommerce'],
      status: `${storefrontCount}/2 ${tr(language, { en: 'enabled', pl: 'włączone' })}`,
      accent: 'text-violet-200',
    },
  ];

  const metricCards = [
    {
      label: tr(language, { en: 'Global marketplaces', pl: 'Globalne marketplace' }),
      value: `${globalCount}/7`,
      delta: 'Amazon • Alibaba • Walmart',
      tone: 'cyan' as const,
    },
    {
      label: tr(language, { en: 'Europe / regional syncs', pl: 'Synchronizacje Europa / region' }),
      value: `${euCount}/5`,
      delta: 'Allegro • Cdiscount • Zalando',
      tone: 'emerald' as const,
    },
    {
      label: tr(language, { en: 'Storefronts', pl: 'Storefronty' }),
      value: `${storefrontCount}/2`,
      delta: 'Shopify • WooCommerce',
      tone: 'violet' as const,
    },
    {
      label: tr(language, { en: 'Data surfaces', pl: 'Warstwy danych' }),
      value: `${dataSurfaces}/6`,
      delta: tr(language, { en: 'Orders • inventory • traffic', pl: 'Zamówienia • stany • ruch' }),
      tone: 'amber' as const,
    },
    {
      label: tr(language, { en: 'Validated connections', pl: 'Zweryfikowane połączenia' }),
      value: `${validatedConnections}/2`,
      delta: 'Shopify • WooCommerce',
      tone: 'cyan' as const,
    },
    {
      label: tr(language, { en: 'Mode', pl: 'Tryb' }),
      value: settings.dryRunMode ? tr(language, { en: 'Dry run', pl: 'Tryb testowy' }) : tr(language, { en: 'Live', pl: 'Na żywo' }),
      delta: tr(language, { en: 'Protected publishing', pl: 'Chronione publikowanie' }),
      tone: 'amber' as const,
    },
    {
      label: tr(language, { en: 'Listings / hour', pl: 'Oferty / godz.' }),
      value: `${settings.maxListingsPerHour}`,
      delta: tr(language, { en: 'Rate limit', pl: 'Limit tempa' }),
      tone: 'violet' as const,
    },
  ];

  const adminTutorialSteps = [
    {
      step: '01',
      title: tr(language, { en: 'Read the sync overview first', pl: 'Najpierw odczytaj przegląd synchronizacji' }),
      description: tr(language, { en: 'These cards show how many channels, connections, and limits are active before you go into detailed settings.', pl: 'Te karty pokazują ile kanałów, połączeń i limitów jest aktywnych zanim wejdziesz w szczegóły.' }),
    },
    {
      step: '02',
      title: tr(language, { en: 'Validate storefront connections', pl: 'Zweryfikuj połączenia sklepów' }),
      description: tr(language, { en: 'First fill in the store domain or URL, then run a test. Only then does the connection status become operationally meaningful.', pl: 'Najpierw uzupełnij domenę sklepu lub URL, potem uruchom test. Dopiero wtedy status ma sens operacyjny.' }),
    },
    {
      step: '03',
      title: tr(language, { en: 'Choose rollout scope and presets', pl: 'Wybierz zakres rolloutu i presety' }),
      description: tr(language, { en: 'Warstwy kanałów i gotowe presety pomagają szybko włączyć właściwe platformy bez ręcznego ustawiania wszystkiego od zera.', pl: 'Warstwy kanałów i gotowe presety pomagają szybko włączyć właściwe platformy bez ręcznego ustawiania wszystkiego od zera.' }),
    },
    {
      step: '04',
      title: tr(language, { en: 'Open advanced settings and set safety rules', pl: 'Otwórz ustawienia zaawansowane i ustaw zabezpieczenia' }),
      description: tr(language, { en: 'This is where you decide what data to sync, how aggressively to publish, and which safety rules protect margin.', pl: 'Tutaj decydujesz jakie dane synchronizować, jak agresywnie publikować i które zabezpieczenia mają chronić marżę.' }),
    },
  ];

  const adminGuideCards = [
    {
      eyebrow: tr(language, { en: 'Step 1', pl: 'Krok 1' }),
      title: tr(language, { en: 'Add store access data', pl: 'Dodaj dane dostępu sklepu' }),
      copy: tr(language, { en: 'Fill in Shopify domain or WooCommerce URL before testing. Without this, the validation box only says that configuration is missing.', pl: 'Najpierw wpisz domenę Shopify albo URL WooCommerce. Bez tego walidacja pokaże tylko brak konfiguracji.' }),
    },
    {
      eyebrow: tr(language, { en: 'Step 2', pl: 'Krok 2' }),
      title: tr(language, { en: 'Enable the right channels', pl: 'Włącz właściwe kanały' }),
      copy: tr(language, { en: 'Use storefront, marketplace, and region switches to decide where listings and sync should be active. This defines the rollout map.', pl: 'Użyj przełączników sklepów, marketplace i regionów, aby zdecydować gdzie listingi i synchronizacja mają być aktywne. To buduje mapę rolloutu.' }),
    },
    {
      eyebrow: tr(language, { en: 'Step 3', pl: 'Krok 3' }),
      title: tr(language, { en: 'Choose synced data', pl: 'Wybierz synchronizowane dane' }),
      copy: tr(language, { en: 'Inventory, orders, pricing, listings, returns, and traffic decide what data the system reads and updates. Turn on only what you actually operate.', pl: 'Stany, zamówienia, ceny, oferty, zwroty i ruch decydują jakie dane system czyta i aktualizuje. Włączaj tylko to, czym realnie operujesz.' }),
    },
    {
      eyebrow: tr(language, { en: 'Step 4', pl: 'Krok 4' }),
      title: tr(language, { en: 'Protect margin and publishing', pl: 'Chroń marżę i publikację' }),
      copy: tr(language, { en: 'Dry run, manual approval, auto-publish off, price change cap, stock buffer, and hourly rate limit reduce risk before scaling wider.', pl: 'Tryb testowy, ręczna akceptacja, wyłączona auto-publikacja, limit zmiany ceny, bufor stanów i limit godzinowy zmniejszają ryzyko przed szerszym skalowaniem.' }),
    },
  ];

  const coreStorefrontOptions = [
    {
      name: 'shopifyEnabled',
      badgeCategory: 'store' as BadgeCategory,
      label: tr(language, { en: 'Enable Shopify storefront sync', pl: 'Włącz synchronizację storefrontu Shopify' }),
      description: tr(language, { en: 'Allows Shopify to join the active sync map for listings, stock, pricing, and storefront checks.', pl: 'Dodaje Shopify do aktywnej mapy synchronizacji dla ofert, stanów, cen i kontroli storefrontu.' }),
      checked: settings.shopifyEnabled,
    },
    {
      name: 'woocommerceEnabled',
      badgeCategory: 'store' as BadgeCategory,
      label: tr(language, { en: 'Enable WooCommerce sync', pl: 'Włącz synchronizację WooCommerce' }),
      description: tr(language, { en: 'Activates WooCommerce as a live storefront source for products, stock, and order-related sync.', pl: 'Aktywuje WooCommerce jako źródło storefrontu dla produktów, stanów i synchronizacji związanej z zamówieniami.' }),
      checked: settings.woocommerceEnabled,
    },
    {
      name: 'amazonEnabled',
      badgeCategory: 'channel' as BadgeCategory,
      label: tr(language, { en: 'Enable Amazon sync', pl: 'Włącz synchronizację Amazon' }),
      description: tr(language, { en: 'Lets admin include Amazon in rollout and marketplace data handling.', pl: 'Pozwala adminowi włączyć Amazon do rolloutu i obsługi danych marketplace.' }),
      checked: settings.amazonEnabled,
    },
    {
      name: 'ebayEnabled',
      badgeCategory: 'channel' as BadgeCategory,
      label: tr(language, { en: 'Enable eBay sync', pl: 'Włącz synchronizację eBay' }),
      description: tr(language, { en: 'Adds eBay to marketplace rollout when listings and catalog sync should reach that channel.', pl: 'Dodaje eBay do rolloutu marketplace, gdy oferty i synchronizacja katalogu mają objąć ten kanał.' }),
      checked: settings.ebayEnabled,
    },
  ];

  const regionalMarketplaceOptions = [
    {
      name: 'alibabaEnabled',
      badgeCategory: 'marketplace' as BadgeCategory,
      label: tr(language, { en: 'Enable Alibaba sync', pl: 'Włącz synchronizację Alibaba' }),
      description: tr(language, { en: 'Useful when admin wants supplier or wholesale channel visibility in the sync map.', pl: 'Przydatne, gdy admin chce uwzględnić kanał dostawcy lub hurtowy na mapie synchronizacji.' }),
      checked: settings.alibabaEnabled,
    },
    {
      name: 'aliexpressEnabled',
      badgeCategory: 'marketplace' as BadgeCategory,
      label: tr(language, { en: 'Enable AliExpress sync', pl: 'Włącz synchronizację AliExpress' }),
      description: tr(language, { en: 'Adds AliExpress as a marketplace reference for low-friction expansion or sourcing visibility.', pl: 'Dodaje AliExpress jako referencję marketplace dla lekkiej ekspansji lub widoczności sourcingu.' }),
      checked: settings.aliexpressEnabled,
    },
    {
      name: 'walmartEnabled',
      badgeCategory: 'marketplace' as BadgeCategory,
      label: tr(language, { en: 'Enable Walmart sync', pl: 'Włącz synchronizację Walmart' }),
      description: tr(language, { en: 'Turns on Walmart inside the global rollout block.', pl: 'Włącza Walmart w globalnym bloku rolloutu.' }),
      checked: settings.walmartEnabled,
    },
    {
      name: 'etsyEnabled',
      badgeCategory: 'marketplace' as BadgeCategory,
      label: tr(language, { en: 'Enable Etsy sync', pl: 'Włącz synchronizację Etsy' }),
      description: tr(language, { en: 'Useful for product categories where handmade or niche demand matters.', pl: 'Przydatne dla kategorii, w których liczy się handmade albo popyt niszowy.' }),
      checked: settings.etsyEnabled,
    },
    {
      name: 'rakutenEnabled',
      badgeCategory: 'marketplace' as BadgeCategory,
      label: tr(language, { en: 'Enable Rakuten sync', pl: 'Włącz synchronizację Rakuten' }),
      description: tr(language, { en: 'Adds Rakuten to the active regional/global commerce footprint.', pl: 'Dodaje Rakuten do aktywnego zasięgu regionalnego lub globalnego handlu.' }),
      checked: settings.rakutenEnabled,
    },
    {
      name: 'allegroEnabled',
      badgeCategory: 'region' as BadgeCategory,
      label: tr(language, { en: 'Enable Allegro sync', pl: 'Włącz synchronizację Allegro' }),
      description: tr(language, { en: 'Key switch for Polish and CEE marketplace rollout.', pl: 'Kluczowy przełącznik dla rolloutu marketplace w Polsce i regionie CEE.' }),
      checked: settings.allegroEnabled,
    },
    {
      name: 'cdiscountEnabled',
      badgeCategory: 'region' as BadgeCategory,
      label: tr(language, { en: 'Enable Cdiscount sync', pl: 'Włącz synchronizację Cdiscount' }),
      description: tr(language, { en: 'Expands the sync map into the French marketplace lane.', pl: 'Rozszerza mapę synchronizacji na kanał marketplace we Francji.' }),
      checked: settings.cdiscountEnabled,
    },
    {
      name: 'emagEnabled',
      badgeCategory: 'region' as BadgeCategory,
      label: tr(language, { en: 'Enable eMAG sync', pl: 'Włącz synchronizację eMAG' }),
      description: tr(language, { en: 'Useful for regional expansion in Romania and nearby markets.', pl: 'Przydatne przy ekspansji regionalnej w Rumunii i pobliskich rynkach.' }),
      checked: settings.emagEnabled,
    },
    {
      name: 'ottoEnabled',
      badgeCategory: 'region' as BadgeCategory,
      label: tr(language, { en: 'Enable OTTO sync', pl: 'Włącz synchronizację OTTO' }),
      description: tr(language, { en: 'Activates OTTO as part of the DACH or Germany-focused rollout.', pl: 'Aktywuje OTTO jako część rolloutu skierowanego na DACH lub Niemcy.' }),
      checked: settings.ottoEnabled,
    },
    {
      name: 'zalandoEnabled',
      badgeCategory: 'region' as BadgeCategory,
      label: tr(language, { en: 'Enable Zalando sync', pl: 'Włącz synchronizację Zalando' }),
      description: tr(language, { en: 'Important when fashion or apparel rollout should include Zalando.', pl: 'Ważne, gdy rollout fashion lub apparel ma obejmować Zalando.' }),
      checked: settings.zalandoEnabled,
    },
  ];

  const dataOptions = [
    {
      name: 'syncTraffic',
      badgeCategory: 'data' as BadgeCategory,
      label: tr(language, { en: 'Sync traffic / CTR', pl: 'Synchronizuj ruch / CTR' }),
      description: tr(language, { en: 'Pulls performance context useful for understanding demand and channel efficiency.', pl: 'Pobiera kontekst performance potrzebny do zrozumienia popytu i efektywności kanału.' }),
      checked: settings.syncTraffic,
    },
    {
      name: 'syncReturns',
      badgeCategory: 'data' as BadgeCategory,
      label: tr(language, { en: 'Sync returns', pl: 'Synchronizuj zwroty' }),
      description: tr(language, { en: 'Helps admin monitor post-sale quality risk and operational friction.', pl: 'Pomaga adminowi monitorować ryzyko jakości po sprzedaży i tarcie operacyjne.' }),
      checked: settings.syncReturns,
    },
  ];

  const safetyOptions = [
    {
      name: 'syncInventory',
      badgeCategory: 'safety' as BadgeCategory,
      label: tr(language, { en: 'Sync inventory', pl: 'Synchronizuj stany magazynowe' }),
      description: tr(language, { en: 'Keeps stock aligned across active channels to reduce overselling risk.', pl: 'Utrzymuje zgodność stanów między aktywnymi kanałami i zmniejsza ryzyko oversellingu.' }),
      checked: settings.syncInventory,
    },
    {
      name: 'syncOrders',
      badgeCategory: 'safety' as BadgeCategory,
      label: tr(language, { en: 'Sync orders', pl: 'Synchronizuj zamówienia' }),
      description: tr(language, { en: 'Allows admin to keep order flow consistent between platforms and storefronts.', pl: 'Pozwala adminowi utrzymać spójny przepływ zamówień między platformami i sklepami.' }),
      checked: settings.syncOrders,
    },
    {
      name: 'syncPricing',
      badgeCategory: 'safety' as BadgeCategory,
      label: tr(language, { en: 'Sync pricing', pl: 'Synchronizuj ceny' }),
      description: tr(language, { en: 'Pushes pricing changes across channels, subject to your safety limits.', pl: 'Przenosi zmiany cen między kanałami z uwzględnieniem ustawionych limitów bezpieczeństwa.' }),
      checked: settings.syncPricing,
    },
    {
      name: 'syncListings',
      badgeCategory: 'safety' as BadgeCategory,
      label: tr(language, { en: 'Sync listings', pl: 'Synchronizuj oferty' }),
      description: tr(language, { en: 'Lets admin publish or refresh listings across selected marketplaces.', pl: 'Pozwala adminowi publikować lub odświeżać oferty na wybranych marketplace.' }),
      checked: settings.syncListings,
    },
    {
      name: 'dryRunMode',
      badgeCategory: 'safety' as BadgeCategory,
      label: tr(language, { en: 'Dry-run mode only', pl: 'Tylko tryb testowy' }),
      description: tr(language, { en: 'Simulates actions without full live publishing, ideal for first rollout checks.', pl: 'Symuluje działania bez pełnej publikacji live, idealne do pierwszych testów rolloutu.' }),
      checked: settings.dryRunMode,
    },
    {
      name: 'requireManualApproval',
      badgeCategory: 'safety' as BadgeCategory,
      label: tr(language, { en: 'Require manual approval', pl: 'Wymagaj ręcznej akceptacji' }),
      description: tr(language, { en: 'Every important sync step waits for admin confirmation before it goes live.', pl: 'Każdy ważny krok synchronizacji czeka na potwierdzenie admina przed wejściem na żywo.' }),
      checked: settings.requireManualApproval,
    },
    {
      name: 'autoPublishDisabled',
      badgeCategory: 'safety' as BadgeCategory,
      label: tr(language, { en: 'Disable auto-publish', pl: 'Wyłącz auto-publikację' }),
      description: tr(language, { en: 'Blocks automatic publishing so new offers cannot go live without tighter control.', pl: 'Blokuje automatyczną publikację, żeby nowe oferty nie pojawiały się bez ściślejszej kontroli.' }),
      checked: settings.autoPublishDisabled,
    },
  ];

  const settingsFields = [
    {
      name: 'shopifyStoreDomain',
      badgeCategory: 'validation' as BadgeCategory,
      label: tr(language, { en: 'Shopify store domain', pl: 'Domena sklepu Shopify' }),
      description: tr(language, { en: 'Used for real storefront validation and basic Shopify reachability checks.', pl: 'Używane do realnej walidacji storefrontu i podstawowych testów dostępności Shopify.' }),
      defaultValue: settings.shopifyStoreDomain,
      placeholder: 'your-store.myshopify.com',
    },
    {
      name: 'woocommerceStoreUrl',
      badgeCategory: 'validation' as BadgeCategory,
      label: tr(language, { en: 'WooCommerce store URL', pl: 'URL sklepu WooCommerce' }),
      description: tr(language, { en: 'The system checks WooCommerce REST endpoints from this address.', pl: 'System sprawdza endpointy REST WooCommerce pod tym adresem.' }),
      defaultValue: settings.woocommerceStoreUrl,
      placeholder: 'https://store.example.com',
    },
    {
      name: 'amazonMarketplaceId',
      badgeCategory: 'channel' as BadgeCategory,
      label: tr(language, { en: 'Amazon marketplace ID', pl: 'ID marketplace Amazon' }),
      description: tr(language, { en: 'Defines which Amazon region or marketplace context the rollout should target.', pl: 'Określa, jaki region lub kontekst marketplace Amazon ma objąć rollout.' }),
      defaultValue: settings.amazonMarketplaceId,
      placeholder: 'ATVPDKIKX0DER',
    },
    {
      name: 'ebaySiteId',
      badgeCategory: 'channel' as BadgeCategory,
      label: tr(language, { en: 'eBay site ID', pl: 'ID serwisu eBay' }),
      description: tr(language, { en: 'Points sync and listing context to the correct eBay market.', pl: 'Kieruje synchronizację i kontekst ofert na właściwy rynek eBay.' }),
      defaultValue: settings.ebaySiteId,
      placeholder: 'EBAY_US',
    },
    {
      name: 'alibabaRegion',
      badgeCategory: 'region' as BadgeCategory,
      label: tr(language, { en: 'Alibaba region', pl: 'Region Alibaba' }),
      description: tr(language, { en: 'Helps admin separate sourcing or wholesale scope by operating region.', pl: 'Pomaga adminowi rozdzielić zakres sourcingu lub hurtu według regionu działania.' }),
      defaultValue: settings.alibabaRegion,
      placeholder: 'GLOBAL / CN / US',
    },
    {
      name: 'allegroRegion',
      badgeCategory: 'region' as BadgeCategory,
      label: tr(language, { en: 'Allegro region', pl: 'Region Allegro' }),
      description: tr(language, { en: 'Useful when rollout or reporting should stay tied to a specific Allegro market.', pl: 'Przydatne, gdy rollout lub raportowanie ma pozostać przypięte do konkretnego rynku Allegro.' }),
      defaultValue: settings.allegroRegion,
      placeholder: 'PL',
    },
    {
      name: 'maxSyncPriceChangePercent',
      badgeCategory: 'limit' as BadgeCategory,
      label: tr(language, { en: 'Max sync price change (%)', pl: 'Maks. zmiana ceny sync (%)' }),
      description: tr(language, { en: 'Hard limit that blocks overly aggressive automatic price changes.', pl: 'Twardy limit, który blokuje zbyt agresywne automatyczne zmiany ceny.' }),
      defaultValue: settings.maxSyncPriceChangePercent,
      type: 'number',
      min: 1,
      max: 80,
    },
    {
      name: 'minimumStockBufferUnits',
      badgeCategory: 'limit' as BadgeCategory,
      label: tr(language, { en: 'Minimum stock buffer (units)', pl: 'Minimalny bufor stanów (szt.)' }),
      description: tr(language, { en: 'Keeps a protected stock reserve so channels do not sell the last units too aggressively.', pl: 'Utrzymuje chronioną rezerwę stanów, aby kanały nie sprzedawały ostatnich sztuk zbyt agresywnie.' }),
      defaultValue: settings.minimumStockBufferUnits,
      type: 'number',
      min: 0,
      max: 10000,
    },
    {
      name: 'maxListingsPerHour',
      badgeCategory: 'limit' as BadgeCategory,
      label: tr(language, { en: 'Max listings per hour', pl: 'Maks. ofert na godzinę' }),
      description: tr(language, { en: 'Rate limit for publishing so rollout speed does not get out of control.', pl: 'Limit tempa publikacji, żeby szybkość rolloutu nie wymknęła się spod kontroli.' }),
      defaultValue: settings.maxListingsPerHour,
      type: 'number',
      min: 1,
      max: 10000,
    },
  ];

  return (
    <main className="mx-auto max-w-[1550px] px-4 py-14 text-white sm:px-6">
      <section className="mesh-panel relative p-8 shadow-[0_30px_140px_rgba(2,6,23,0.65)]">
        <div className="spotlight-sweep" />
        <div className="noise-overlay" />
        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Admin / integrations', pl: 'Admin / integracje' })}</div>
          <h1 className="mt-4 text-5xl font-black tracking-tight">{tr(language, { en: 'Marketplace and storefront sync command center', pl: 'Centrum synchronizacji marketplace i storefrontów' })}</h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">{tr(language, { en: 'This control room is now centered on the channels that still matter in the current product: marketplaces, storefronts, and safe sync settings.', pl: 'To centrum kontroli skupia się teraz na kanałach, które nadal mają znaczenie w obecnym produkcie: marketplace, sklepach i bezpiecznych ustawieniach synchronizacji.' })}</p>
        </div>
      </section>

      {(params.updated || params.error || tested) && <div className={`mt-6 rounded-2xl border p-4 ${params.error ? 'border-rose-300/30 bg-rose-300/10 text-rose-200' : 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200'}`}>{params.error ? tr(language, { en: 'Could not save integration settings.', pl: 'Nie udało się zapisać ustawień integracji.' }) : tested ? tr(language, { en: `Validation refreshed for ${testedLabel}. Check the results below.`, pl: `Odświeżono walidację dla ${testedLabel}. Sprawdź wyniki poniżej.` }) : tr(language, { en: 'Integration settings saved.', pl: 'Ustawienia integracji zapisane.' })}</div>}

      <div className="mt-6 flex flex-wrap gap-3">
        <a href="#admin-connection-validation" className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15">
          {tr(language, { en: 'Quick admin help', pl: 'Szybka pomoc admina' })}
        </a>
        <a href="#admin-advanced-settings" className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
          {tr(language, { en: 'Jump to advanced settings', pl: 'Przejdź do ustawień zaawansowanych' })}
        </a>
      </div>
      <CategoryBadgeLegend
        language={language}
        categories={['store', 'validation', 'channel', 'marketplace', 'region', 'data', 'safety', 'limit']}
        title={tr(language, { en: 'Badge legend', pl: 'Legenda oznaczeń' })}
        description={tr(language, { en: 'Every integration block now uses one global category system, so new admins understand immediately which option is a store, channel, data scope, safety rule, or hard limit.', pl: 'Każdy blok integracji używa teraz jednego globalnego systemu kategorii, więc nowy admin od razu widzi co jest sklepem, kanałem, zakresem danych, zabezpieczeniem albo twardym limitem.' })}
        className="mt-6"
      />
      <TutorialMode
        language={language}
        title={tr(language, { en: 'Need help using admin integrations?', pl: 'Potrzebujesz pomocy w obsłudze integracji admina?' })}
        intro={tr(language, { en: 'This walkthrough teaches the admin what each sync section does, how to enable platforms correctly, and what business effect each option has.', pl: 'Ten samouczek uczy admina co robi każda sekcja synchronizacji, jak poprawnie włączać platformy i jaki efekt biznesowy daje każda opcja.' })}
        steps={adminTutorialSteps}
        storageKey="ufrev-admin-integrations-tutorial"
      >
        <TutorialStep
          step="01"
          title={tr(language, { en: 'Start from the overview cards', pl: 'Zacznij od kart przeglądu' })}
          description={tr(language, { en: 'Before changing anything, check how many marketplaces, storefronts, validated connections, and limits are currently active.', pl: 'Zanim cokolwiek zmienisz, sprawdź ile marketplace, storefrontów, zweryfikowanych połączeń i limitów jest obecnie aktywnych.' })}
        >
          <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-12">
            {metricCards.map((card, index) => (
              <div key={card.label} className={index < 4 ? 'xl:col-span-3' : index < 7 ? 'xl:col-span-4' : 'xl:col-span-3'}>
                <MetricCard language={language} label={card.label} value={card.value} delta={card.delta} tone={card.tone} />
              </div>
            ))}
          </section>
        </TutorialStep>

        <TutorialStep
          step="02"
          title={tr(language, { en: 'Validate Shopify and WooCommerce first', pl: 'Najpierw zweryfikuj Shopify i WooCommerce' })}
          description={tr(language, { en: 'These are the only real user-facing validated storefronts in the current MVP, so admin should test them before trusting sync status.', pl: 'To jedyne realnie walidowane storefronty widoczne dla użytkownika w obecnym MVP, więc admin powinien je przetestować zanim zaufa statusom synchronizacji.' })}
        >
          <section id="admin-connection-validation" className="mt-8 scroll-mt-24 rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
            <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Connection validation', pl: 'Walidacja połączeń' })}</div>
            <h2 className="mt-2 text-3xl font-black text-white">{tr(language, { en: 'Real validation results', pl: 'Wyniki realnej walidacji' })}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{tr(language, { en: 'Connected badges on the user page depend on these checks. In the current free MVP flow only Shopify and WooCommerce are exposed as real user-facing validated connections.', pl: 'Oznaczenia połączenia na stronie użytkownika zależą od tych kontroli. W obecnym darmowym MVP tylko Shopify i WooCommerce są pokazywane jako realne, zweryfikowane połączenia dla użytkownika.' })}</p>
            <TutorialHint
              className="mt-5"
              title={tr(language, { en: 'How to get a validated status here', pl: 'Jak uzyskać tutaj status zweryfikowany' })}
              description={tr(language, { en: 'The admin flow is simple: enter store data, save settings, run a dedicated test, and only then expect a validated badge.', pl: 'Flow admina jest prosty: wpisz dane sklepu, zapisz ustawienia, uruchom dedykowany test i dopiero wtedy oczekuj oznaczenia zweryfikowania.' })}
              items={[
                tr(language, { en: 'Enter Shopify domain or WooCommerce URL in advanced settings.', pl: 'Wpisz domenę Shopify albo URL WooCommerce w ustawieniach zaawansowanych.' }),
                tr(language, { en: 'Save integration settings so the backend has current values.', pl: 'Zapisz ustawienia integracji, aby backend miał aktualne wartości.' }),
                tr(language, { en: 'Run Test Shopify or Test WooCommerce and read the returned validation details.', pl: 'Uruchom Testuj Shopify albo Testuj WooCommerce i przeczytaj zwrócone szczegóły walidacji.' }),
              ]}
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-2">
              {([
                ['Shopify', settings.connectionChecks.shopify],
                ['WooCommerce', settings.connectionChecks.woocommerce],
              ] as Array<[string, IntegrationConnectionCheck]>).map(([label, check]) => (
                <div key={String(label)} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-white">{String(label)}</div>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${check.state === 'validated' ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : check.state === 'invalid' ? 'border-amber-300/30 bg-amber-300/10 text-amber-100' : check.state === 'unavailable' ? 'border-sky-300/30 bg-sky-300/10 text-sky-100' : 'border-white/10 bg-white/5 text-slate-300'}`}>{checkStateLabel(check.state)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{check.message}</p>
                  {check.evidence && <div className="mt-2 text-xs text-slate-400">{check.evidence}</div>}
                </div>
              ))}
            </div>
          </section>
        </TutorialStep>

        <TutorialStep
          step="03"
          title={tr(language, { en: 'Use channel groups and presets intentionally', pl: 'Używaj grup kanałów i presetów świadomie' })}
          description={tr(language, { en: 'The layer cards tell you what each platform group is for, and presets let you switch on a ready rollout pattern instead of building everything manually.', pl: 'Karty warstw pokazują do czego służy każda grupa platform, a presety pozwalają włączyć gotowy wzór rolloutu zamiast budować wszystko ręcznie.' })}
        >
          <section className="mt-8 grid gap-4 md:grid-cols-3">
            {channelGroups.map((group) => (
              <div key={group.title} className="hover-lift rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
                <div className={`text-[11px] uppercase tracking-[0.22em] ${group.accent}`}>{group.eyebrow}</div>
                <div className="mt-2 text-xl font-bold text-white">{group.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{group.copy}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.chips.map((chip) => (
                    <span key={chip} className="glass-chip border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-100">{chip}</span>
                  ))}
                </div>
                <div className="mt-4 text-sm font-semibold text-cyan-100">{group.status}</div>
              </div>
            ))}
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
              <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Global channel presets', pl: 'Globalne presety kanałów' })}</div>
              <h2 className="mt-2 text-3xl font-black">{tr(language, { en: 'One-click sync modes', pl: 'Tryby synchronizacji jednym kliknięciem' })}</h2>
              <div className="mt-5 grid gap-4">
            <form action="/api/admin/integrations/settings" method="post" className="hover-lift rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <input type="hidden" name="shopifyEnabled" value="on" />
              <input type="hidden" name="amazonEnabled" value="on" />
              <input type="hidden" name="ebayEnabled" value="on" />
              <input type="hidden" name="alibabaEnabled" value="on" />
              <input type="hidden" name="aliexpressEnabled" value="on" />
              <input type="hidden" name="walmartEnabled" value="on" />
              <input type="hidden" name="etsyEnabled" value="on" />
              <input type="hidden" name="rakutenEnabled" value="on" />
              <input type="hidden" name="woocommerceEnabled" value="on" />
              <input type="hidden" name="syncInventory" value="on" />
              <input type="hidden" name="syncOrders" value="on" />
              <input type="hidden" name="syncPricing" value="on" />
              <input type="hidden" name="syncListings" value="on" />
              <input type="hidden" name="syncReturns" value="on" />
              <input type="hidden" name="syncTraffic" value="on" />
              <input type="hidden" name="dryRunMode" value="on" />
              <input type="hidden" name="requireManualApproval" value="on" />
              <input type="hidden" name="autoPublishDisabled" value="on" />
              <input type="hidden" name="maxSyncPriceChangePercent" value="15" />
              <input type="hidden" name="minimumStockBufferUnits" value="5" />
              <input type="hidden" name="maxListingsPerHour" value="25" />
              <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">{tr(language, { en: 'Preset 01', pl: 'Preset 01' })}</div>
              <div className="mt-2 text-xl font-bold text-white">{tr(language, { en: 'Global expansion mesh', pl: 'Siatka globalnej ekspansji' })}</div>
              <p className="mt-2 text-sm text-slate-300">{tr(language, { en: 'Alibaba + Amazon + Walmart + storefront layers visible, but publishing still stays protected.', pl: 'Widoczne są warstwy Alibaba + Amazon + Walmart + storefronty, ale publikowanie nadal pozostaje chronione.' })}</p>
              <button className="mt-4 rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">{tr(language, { en: 'Apply preset', pl: 'Zastosuj preset' })}</button>
            </form>

            <form action="/api/admin/integrations/settings" method="post" className="hover-lift rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <input type="hidden" name="shopifyEnabled" value="on" />
              <input type="hidden" name="woocommerceEnabled" value="on" />
              <input type="hidden" name="amazonEnabled" value="on" />
              <input type="hidden" name="ebayEnabled" value="on" />
              <input type="hidden" name="allegroEnabled" value="on" />
              <input type="hidden" name="cdiscountEnabled" value="on" />
              <input type="hidden" name="emagEnabled" value="on" />
              <input type="hidden" name="ottoEnabled" value="on" />
              <input type="hidden" name="zalandoEnabled" value="on" />
              <input type="hidden" name="syncInventory" value="on" />
              <input type="hidden" name="syncOrders" value="on" />
              <input type="hidden" name="syncPricing" value="on" />
              <input type="hidden" name="syncListings" value="on" />
              <input type="hidden" name="syncReturns" value="on" />
              <input type="hidden" name="requireManualApproval" value="on" />
              <input type="hidden" name="maxSyncPriceChangePercent" value="12" />
              <input type="hidden" name="minimumStockBufferUnits" value="8" />
              <input type="hidden" name="maxListingsPerHour" value="40" />
              <div className="text-[11px] uppercase tracking-[0.22em] text-emerald-200">{tr(language, { en: 'Preset 02', pl: 'Preset 02' })}</div>
              <div className="mt-2 text-xl font-bold text-white">{tr(language, { en: 'Europe / regional hybrid rollout', pl: 'Europejski / regionalny rollout hybrydowy' })}</div>
              <p className="mt-2 text-sm text-slate-300">{tr(language, { en: 'Strong EU/local presence for Allegro, Zalando, OTTO, and Cdiscount with safer rollout controls.', pl: 'Mocna obecność europejska i lokalna dla Allegro, Zalando, OTTO i Cdiscount z bezpieczniejszymi ograniczeniami wdrożenia.' })}</p>
              <button className="mt-4 rounded-2xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950">{tr(language, { en: 'Apply preset', pl: 'Zastosuj preset' })}</button>
            </form>
              </div>
            </div>
            <InsightPanel language={language} title={tr(language, { en: 'Global architecture notes', pl: 'Notatki architektury globalnej' })} items={[
              tr(language, { en: 'Global marketplaces give you volume and competitive data, but require stronger price and margin discipline.', pl: 'Globalne marketplace dają wolumen i dane konkurencyjne, ale wymagają mocniejszej dyscypliny ceny i marży.' }),
              tr(language, { en: 'Allegro, Cdiscount, eMAG, OTTO, and Zalando make the expansion story real for Europe and regional operators.', pl: 'Allegro, Cdiscount, eMAG, OTTO i Zalando czynią scenariusz ekspansji realnym dla Europy i operatorów regionalnych.' }),
              tr(language, { en: 'Shopify and WooCommerce stay visible because they are the only truly user-facing validated storefront connections in the lean MVP.', pl: 'Shopify i WooCommerce zostają widoczne, bo to jedyne naprawdę zweryfikowane połączenia sklepów dostępne dla użytkownika w uproszczonym MVP.' }),
              tr(language, { en: 'Dry-run and manual approval stay available so the wider sync map does not weaken anti-loss discipline.', pl: 'Tryb testowy i ręczna akceptacja pozostają dostępne, żeby szersza mapa synchronizacji nie osłabiała dyscypliny ochrony przed stratą.' }),
            ]} />
          </section>
        </TutorialStep>

        <TutorialStep
          step="04"
          title={tr(language, { en: 'Use advanced settings as the main admin control room', pl: 'Traktuj ustawienia zaawansowane jako główne centrum kontroli admina' })}
          description={tr(language, { en: 'This section decides what data is synced, what channels are active, and what safety rules block risky publishing.', pl: 'Ta sekcja decyduje jakie dane są synchronizowane, które kanały są aktywne i jakie zabezpieczenia blokują ryzykowną publikację.' })}
        >
          <details id="admin-advanced-settings" className="mt-8 scroll-mt-24 rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]" open>
            <summary className="cursor-pointer list-none text-2xl font-bold text-white">{tr(language, { en: 'Open advanced connection settings', pl: 'Otwórz zaawansowane ustawienia połączeń' })}</summary>

            <div className="mt-6 grid gap-4 xl:grid-cols-4">
              {adminGuideCards.map((card, index) => (
                <div key={`${card.title}-${index}`} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">{card.eyebrow}</div>
                  <div className="mt-2 text-lg font-bold text-white">{card.title}</div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{card.copy}</p>
                </div>
              ))}
            </div>

            <TutorialHint
              className="mt-6"
              title={tr(language, { en: 'Recommended admin order inside this section', pl: 'Rekomendowana kolejność działań admina w tej sekcji' })}
              description={tr(language, { en: 'Follow this order to reduce mistakes: access data first, channel scope second, synced data third, and safety rules last.', pl: 'Trzymaj się tej kolejności, aby ograniczyć błędy: najpierw dane dostępowe, potem zakres kanałów, następnie dane synchronizacji, a na końcu zabezpieczenia.' })}
              items={[
                tr(language, { en: 'Set store domains, IDs, and regional values.', pl: 'Ustaw domeny sklepów, ID i wartości regionalne.' }),
                tr(language, { en: 'Enable only channels you actually want to operate.', pl: 'Włącz tylko kanały, na których naprawdę chcesz operować.' }),
                tr(language, { en: 'Turn on only the data surfaces you need.', pl: 'Włącz tylko te warstwy danych, których naprawdę potrzebujesz.' }),
                tr(language, { en: 'Finish with dry run, approval, price cap, stock buffer, and listing rate.', pl: 'Na końcu ustaw tryb testowy, akceptację, limit ceny, bufor stanów i tempo ofert.' }),
              ]}
            />

            <form action="/api/admin/integrations/settings" method="post" className="mt-6">
          <div className="grid gap-6 xl:grid-cols-4">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">{tr(language, { en: 'Core storefronts', pl: 'Główne storefronty' })}</div>
              <div className="mt-4 space-y-3">
                {coreStorefrontOptions.map((option) => (
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
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-emerald-200">{tr(language, { en: 'Regional marketplaces', pl: 'Regionalne marketplace' })}</div>
              <div className="mt-4 space-y-3">
                {regionalMarketplaceOptions.map((option) => (
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
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-violet-200">{tr(language, { en: 'Traffic and operational data', pl: 'Ruch i dane operacyjne' })}</div>
              <div className="mt-4 space-y-3">
                {dataOptions.map((option) => (
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
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-amber-200">{tr(language, { en: 'Ops + safety', pl: 'Operacje + bezpieczeństwo' })}</div>
              <div className="mt-4 space-y-3">
                {safetyOptions.map((option) => (
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
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {settingsFields.map((field) => (
              <div key={field.name}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <CategoryBadge category={field.badgeCategory} language={language} />
                  <label className="text-sm font-medium text-slate-200">{field.label}</label>
                </div>
                <p className="mb-2 text-xs leading-5 text-slate-400">{field.description}</p>
                <input
                  name={field.name}
                  defaultValue={field.defaultValue}
                  placeholder={field.placeholder}
                  type={field.type}
                  min={field.min}
                  max={field.max}
                  className="input"
                />
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button formAction="/api/admin/integrations/test" formMethod="post" name="testTarget" value="shopify" className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 font-semibold text-cyan-100">{tr(language, { en: 'Test Shopify', pl: 'Testuj Shopify' })}</button>
            <button formAction="/api/admin/integrations/test" formMethod="post" name="testTarget" value="woocommerce" className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-5 py-3 font-semibold text-emerald-100">{tr(language, { en: 'Test WooCommerce', pl: 'Testuj WooCommerce' })}</button>
            <button className="rounded-2xl bg-cyan-300 px-6 py-3 font-semibold text-slate-950">{tr(language, { en: 'Save integrations', pl: 'Zapisz integracje' })}</button>
          </div>
            </form>
          </details>
        </TutorialStep>
      </TutorialMode>
    </main>
  );
}
