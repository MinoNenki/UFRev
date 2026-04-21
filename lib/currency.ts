import type { Language } from '@/lib/i18n';

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'PLN', 'GBP', 'JPY', 'CNY', 'IDR', 'RUB', 'CAD', 'AUD', 'BRL', 'MXN', 'INR', 'AED'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

type CurrencyConfig = {
  locale: string;
  rateFromUsd: number;
  symbol: string;
};

const currencyMap: Record<SupportedCurrency, CurrencyConfig> = {
  USD: { locale: 'en-US', rateFromUsd: 1, symbol: '$' },
  EUR: { locale: 'de-DE', rateFromUsd: 0.92, symbol: '€' },
  PLN: { locale: 'pl-PL', rateFromUsd: 4.0, symbol: 'zł' },
  GBP: { locale: 'en-GB', rateFromUsd: 0.79, symbol: '£' },
  JPY: { locale: 'ja-JP', rateFromUsd: 155, symbol: '¥' },
  CNY: { locale: 'zh-CN', rateFromUsd: 7.2, symbol: '¥' },
  IDR: { locale: 'id-ID', rateFromUsd: 16200, symbol: 'Rp' },
  RUB: { locale: 'ru-RU', rateFromUsd: 92, symbol: '₽' },
  CAD: { locale: 'en-CA', rateFromUsd: 1.36, symbol: 'C$' },
  AUD: { locale: 'en-AU', rateFromUsd: 1.52, symbol: 'A$' },
  BRL: { locale: 'pt-BR', rateFromUsd: 5.1, symbol: 'R$' },
  MXN: { locale: 'es-MX', rateFromUsd: 16.8, symbol: '$' },
  INR: { locale: 'en-IN', rateFromUsd: 83.4, symbol: '₹' },
  AED: { locale: 'ar-AE', rateFromUsd: 3.67, symbol: 'د.إ' },
};

const languageCurrencyMap: Record<Language, SupportedCurrency> = {
  en: 'USD',
  pl: 'PLN',
  de: 'EUR',
  es: 'EUR',
  pt: 'EUR',
  ja: 'JPY',
  zh: 'CNY',
  id: 'IDR',
  ru: 'RUB',
};

const countryCurrencyMap: Record<string, SupportedCurrency> = {
  US: 'USD',
  GB: 'GBP',
  PL: 'PLN',
  DE: 'EUR',
  ES: 'EUR',
  PT: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  IE: 'EUR',
  JP: 'JPY',
  CN: 'CNY',
  ID: 'IDR',
  RU: 'RUB',
  CA: 'CAD',
  AU: 'AUD',
  BR: 'BRL',
  MX: 'MXN',
  IN: 'INR',
  AE: 'AED',
};

export function isSupportedCurrency(value: string | null | undefined): value is SupportedCurrency {
  return !!value && SUPPORTED_CURRENCIES.includes(value as SupportedCurrency);
}

export function getCurrencyForLanguage(language: Language): SupportedCurrency {
  return languageCurrencyMap[language] || 'USD';
}

export function getCurrencyForCountry(countryCode: string | null | undefined, fallback: SupportedCurrency = 'USD'): SupportedCurrency {
  const normalized = String(countryCode || '').trim().toUpperCase();
  return countryCurrencyMap[normalized] || fallback;
}

export function normalizeCurrencyCode(value: string | null | undefined, fallback: SupportedCurrency = 'USD'): SupportedCurrency {
  const upper = String(value || '').trim().toUpperCase();
  if (upper === '$') return 'USD';
  if (upper === '€') return 'EUR';
  if (upper === '£') return 'GBP';
  if (upper === '¥' || upper === '￥' || upper === 'JPY') return 'JPY';
  if (upper === 'CNY' || upper === 'RMB') return 'CNY';
  if (upper === 'RP' || upper === 'IDR') return 'IDR';
  if (upper === '₽' || upper === 'RUB' || upper === 'РУБ') return 'RUB';
  if (upper === 'C$' || upper === 'CAD') return 'CAD';
  if (upper === 'A$' || upper === 'AUD') return 'AUD';
  if (upper === 'R$' || upper === 'BRL') return 'BRL';
  if (upper === 'MXN') return 'MXN';
  if (upper === '₹' || upper === 'INR') return 'INR';
  if (upper === 'AED' || upper === 'د.إ') return 'AED';
  if (upper === 'ZŁ' || upper === 'PLN') return 'PLN';
  return isSupportedCurrency(upper) ? upper : fallback;
}

export function convertCurrency(value: number, from: SupportedCurrency, to: SupportedCurrency) {
  if (!Number.isFinite(value)) return 0;
  if (from === to) return Number(value.toFixed(2));
  const usdValue = value / currencyMap[from].rateFromUsd;
  return Number((usdValue * currencyMap[to].rateFromUsd).toFixed(2));
}

export function convertToUsd(value: number, from: SupportedCurrency) {
  return convertCurrency(value, from, 'USD');
}

export function convertFromUsd(value: number, to: SupportedCurrency) {
  return convertCurrency(value, 'USD', to);
}

export function formatMoney(value: number | null | undefined, language: Language, currency?: SupportedCurrency | null) {
  if (value == null || !Number.isFinite(value)) return '—';
  const resolvedCurrency = currency || getCurrencyForLanguage(language);
  const config = currencyMap[resolvedCurrency] || currencyMap.USD;
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: resolvedCurrency,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(Number(value.toFixed(2)));
}

export function currencyHint(language: Language) {
  return getCurrencyForLanguage(language);
}
