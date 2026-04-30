import { formatMoney } from '@/lib/currency';
import type { Language } from '@/lib/i18n';

export type SmartIntent =
  | 'validate_product'
  | 'calculate_profit'
  | 'competitor_analysis'
  | 'extract_data'
  | 'general_analysis';

export type AnalysisProfileSnapshot = {
  credits_balance: number;
  analyses_used_this_month: number;
  monthly_analysis_limit: number;
  role: string | null;
  plan_key: string | null;
};

export function looksLikeSupplierMarketplaceUrl(url: string) {
  return /alibaba\.com|aliexpress\.com|1688\.com|made-in-china\.com|globalsources\.com/i.test(url || '');
}

export function isServiceBusinessPrompt(input: string) {
  const text = (input || '').toLowerCase();
  const serviceSignals = [
    'myjni', 'mycie', 'czyszczenie', 'elewac', 'kostki brukowej', 'kostka brukowa',
    'tir', 'truck wash', 'detailing', 'mobiln', 'mobile wash', 'parow', 'steam cleaning',
    'usług', 'uslug', 'service business', 'lokaln', 'regional', 'woj.', 'województ', 'wojewodzt',
  ];
  const requestSignals = [
    'jaki sprzęt', 'jaki sprzet', 'sprzęt', 'sprzet', 'equipment', 'maszyn',
    'ile to będzie kosztowa', 'ile to bedzie kosztowa', 'startup cost', 'budżet start', 'budzet start',
    'czy warto', 'opłaca', 'oplaca', 'opłacaln', 'oplacaln', 'otworzyć', 'otworzyc', 'założyć', 'zalozyc',
    'pricing', 'cennik', 'pakiet', 'w jaki kierunek', 'co wybrać', 'co wybrac', 'pionier rynku',
  ];

  const serviceScore = serviceSignals.reduce((total, signal) => total + (text.includes(signal) ? 1 : 0), 0);
  const requestScore = requestSignals.reduce((total, signal) => total + (text.includes(signal) ? 1 : 0), 0);
  const hasLinks = /https?:\/\//.test(text);

  const startupSignal = /otworzyć|otworzyc|założyć|zalozyc|start|uruchomi/i.test(text);
  return serviceScore >= 2 && (requestScore >= 1 || hasLinks || startupSignal);
}

export function buildDirectQuestionLead(params: {
  content: string;
  currentLanguage: Language;
  displayCurrency: string;
  websiteUrl: string;
  salesChannel: string;
  price: number;
  cost: number;
}) {
  const combined = `${params.content} ${params.salesChannel}`.toLowerCase();
  const asksUnits = /ile sztuk|how many units|order quantity|test batch|moq|min(?:imum)? order/.test(combined);
  const asksPrice = /po ile|wystawia[cć]|selling price|listing price|sell price|jak[aą] cen[aę]/.test(combined);
  const asksDemand = /popyt|demand|czy się sprzeda|czy sie sprzeda|will it sell|czy będzie|czy bedzie/.test(combined);
  const asksRental = /wynajem|wypożycz|wypozycz|rental|rent out|lease/.test(combined);
  const asksEquipment = /jaki sprzęt|jaki sprzet|sprzęt|sprzet|equipment|maszyn|generator|odkurzacz|parownic|myjk/i.test(combined);
  const asksStartupCost = /ile to będzie kosztowa|ile to bedzie kosztowa|startup cost|budżet start|budzet start|koszt start/i.test(combined);
  const asksDirection = /w jaki kierunek|co wybrać|co wybrac|pionier rynku|which direction|what niche|which lane/i.test(combined);
  const serviceBusinessCase = isServiceBusinessPrompt(`${params.content} ${params.salesChannel}`);

  if (!asksUnits && !asksPrice && !asksDemand && !asksRental && !asksEquipment && !asksStartupCost && !asksDirection) return '';

  const supplierSource = looksLikeSupplierMarketplaceUrl(params.websiteUrl);
  const hasHardCost = params.cost > 0 || params.price > 0 || /unit price|price per unit|cena|cost|koszt|shipping|dostaw/i.test(combined);
  const targetSellFloor = params.cost > 0 ? params.cost / 0.65 : null;
  const quickPaybackRentLow = params.cost > 0 ? params.cost / 12 : null;
  const quickPaybackRentHigh = params.cost > 0 ? params.cost / 8 : null;
  const weekendPackage = params.cost > 0 ? params.cost / 5 : null;

  if (serviceBusinessCase && params.currentLanguage === 'pl') {
    const parts: string[] = [];

    if (asksDirection) {
      parts.push('Najbezpieczniej wejść najpierw w jedną niszę premium z dojazdem, a dopiero potem rozszerzać ofertę na TIR-y albo cięższe mycie elewacji.');
    }

    if (asksEquipment) {
      parts.push('Starter usługowy zwykle wymaga auta roboczego, wydajnej myjki lub parownicy, zbiornika / dostępu do wody, chemii, osprzętu do piany i szczotek oraz zabezpieczeń BHP.');
    }

    if (asksStartupCost) {
      parts.push('Nie podawaj jednej sztywnej kwoty bez wybranego modelu pracy, ale policz osobno: auto, maszynę główną, osprzęt, chemię, branding, dojazdy i bufor serwisowy.');
    }

    if (asksDemand || params.websiteUrl) {
      parts.push('Linki konkurencji traktuj tu jako benchmark usług i cenników lokalnych, a nie jak listing produktu pod klasyczny e-commerce verdict.');
    }

    return parts.join(' ');
  }

  if (params.currentLanguage === 'pl') {
    const parts: string[] = [];

    if (asksUnits) {
      parts.push(hasHardCost
        ? 'Zakup zacznij od małej partii testowej i skaluj dopiero po potwierdzeniu konwersji oraz zwrotów.'
        : 'Bez pełnego kosztu zakupu, dostawy i prowizji zacząłbym od testu 20–50 sztuk, a nie większego zatowarowania.');
    }

    if (asksPrice) {
      parts.push(targetSellFloor != null
        ? `Przy tym koszcie sensowny floor ceny to około ${formatMoney(targetSellFloor, params.currentLanguage, params.displayCurrency as any)}, żeby zostawić miejsce na prowizję, dostawę i reklamę.`
        : `Nie podawaj jednej sztywnej ceny bez kosztu lądowania — na Allegro celuj w minimum 30–40% marży po wszystkich opłatach w ${params.displayCurrency}.`);
    }

    if (asksDemand) {
      parts.push(supplierSource
        ? 'Sam link z Alibaba pokazuje źródło zakupu, ale nie potwierdza popytu — popyt trzeba sprawdzić na Allegro po liczbie ofert, opinii i poziomie cen.'
        : 'Popyt trzeba potwierdzić realną konkurencją, ceną i wynikami małego testu, a nie samym opisem produktu.');
    }

    if (asksRental) {
      parts.push(quickPaybackRentLow != null && quickPaybackRentHigh != null && weekendPackage != null
        ? `Jeśli chcesz szybki zwrot przy modelu wynajem, licz odzyskanie kosztu w około 8–12 rezerwacji: stawka dzienna około ${formatMoney(quickPaybackRentLow, params.currentLanguage, params.displayCurrency as any)}–${formatMoney(quickPaybackRentHigh, params.currentLanguage, params.displayCurrency as any)}, a pakiet weekendowy około ${formatMoney(weekendPackage, params.currentLanguage, params.displayCurrency as any)}.`
        : 'Przy wynajmie ustaw stawkę tak, aby cały koszt zwrócił się w około 8–12 rezerwacji, a dopiero potem skaluj park maszyn.');
    }

    return parts.join(' ');
  }

  const parts: string[] = [];
  if (asksUnits) {
    parts.push(hasHardCost
      ? 'Start with a small test batch and scale only after conversion and return data confirm the demand.'
      : 'Without full landed cost, shipping, and fees, start with a small 20–50 unit test batch instead of deeper inventory.');
  }
  if (asksPrice) {
    parts.push(targetSellFloor != null
      ? `A sensible sell-price floor is about ${formatMoney(targetSellFloor, params.currentLanguage, params.displayCurrency as any)} so there is still room for marketplace fees and ad spend.`
      : `Do not force one exact resale price without landed cost data — aim for at least a 30–40% margin after marketplace fees in ${params.displayCurrency}.`);
  }
  if (asksDemand) {
    parts.push(supplierSource
      ? 'A supplier link like Alibaba shows sourcing context, not proof of retail demand, so demand must still be validated on the target marketplace.'
      : 'Demand still needs to be validated with competitor pricing, listing volume, and a controlled test.');
  }
  if (asksRental) {
    parts.push(quickPaybackRentLow != null && quickPaybackRentHigh != null && weekendPackage != null
      ? `For a fast rental payback, aim to recover the cost in roughly 8–12 bookings: about ${formatMoney(quickPaybackRentLow, params.currentLanguage, params.displayCurrency as any)}–${formatMoney(quickPaybackRentHigh, params.currentLanguage, params.displayCurrency as any)} per day, and about ${formatMoney(weekendPackage, params.currentLanguage, params.displayCurrency as any)} for a weekend package.`
      : 'For rentals, set the daily and weekend rate so the full cost returns within roughly 8–12 bookings before scaling further.');
  }

  return parts.join(' ');
}

export function normalizeAnalysisProfile(profile?: Partial<AnalysisProfileSnapshot> | null): AnalysisProfileSnapshot {
  return {
    credits_balance: Math.max(0, Number(profile?.credits_balance ?? 3) || 3),
    analyses_used_this_month: Math.max(0, Number(profile?.analyses_used_this_month ?? 0) || 0),
    monthly_analysis_limit: Math.max(1, Number(profile?.monthly_analysis_limit ?? 3) || 3),
    role: typeof profile?.role === 'string' ? profile.role : 'user',
    plan_key: typeof profile?.plan_key === 'string' ? profile.plan_key : 'free',
  };
}

export function detectIntent(input: string): SmartIntent {
  const text = (input || '').toLowerCase();

  if (
    text.includes('czy warto') ||
    text.includes('czy się sprzeda') ||
    text.includes('czy to sie sprzeda') ||
    text.includes('worth') ||
    text.includes('should i sell')
  ) {
    return 'validate_product';
  }

  if (
    text.includes('marża') ||
    text.includes('marza') ||
    text.includes('profit') ||
    text.includes('zarob') ||
    text.includes('opłaca') ||
    text.includes('oplaca') ||
    text.includes('opłacaln') ||
    text.includes('oplacaln') ||
    text.includes('ile sztuk') ||
    text.includes('po ile') ||
    text.includes('wystawiać') ||
    text.includes('wystawiac') ||
    text.includes('listing price') ||
    text.includes('selling price') ||
    text.includes('allegro') ||
    text.includes('moq')
  ) {
    return 'calculate_profit';
  }

  if (
    text.includes('konkurenc') ||
    text.includes('competition') ||
    text.includes('competitor')
  ) {
    return 'competitor_analysis';
  }

  const extractLikePatterns = [
    'wyciągnij', 'wyciagnij', 'extract', 'co to jest', 'co jest na zdjęciu', 'co jest na zdjeciu',
    'co jest na tym zdjęciu', 'co jest na tym zdjeciu', 'co widać', 'co widac', 'co widzisz',
    'opisz zdjęcie', 'opisz zdjecie', 'opisz obraz', 'describe image', 'describe the screenshot',
    'what is in this image', 'what do you see', 'what is shown', 'summarize file', 'stresc', 'streść',
    'wniosek', 'dotac', 'dofinans', 'pdf', 'jakie ma szanse', 'jakie są szanse', 'jakie sa szanse',
    'screenshot', 'screen', 'panel', 'dashboard', 'błąd', 'blad', 'error on screen'
  ];

  if (extractLikePatterns.some((pattern) => text.includes(pattern))) {
    return 'extract_data';
  }

  return 'general_analysis';
}
