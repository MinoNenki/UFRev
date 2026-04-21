import { describe, expect, it } from 'vitest';
import {
  convertCurrency,
  convertToUsd,
  currencyHint,
  formatMoney,
  getCurrencyForCountry,
  getCurrencyForLanguage,
  normalizeCurrencyCode,
} from '@/lib/currency';

describe('currency helpers', () => {
  it('maps language and country to expected currencies', () => {
    expect(getCurrencyForLanguage('pl')).toBe('PLN');
    expect(getCurrencyForLanguage('ru')).toBe('RUB');
    expect(getCurrencyForCountry('PT')).toBe('EUR');
    expect(getCurrencyForCountry('xx', 'USD')).toBe('USD');
  });

  it('normalizes symbols and localized codes safely', () => {
    expect(normalizeCurrencyCode('zł')).toBe('PLN');
    expect(normalizeCurrencyCode('₽')).toBe('RUB');
    expect(normalizeCurrencyCode('rmb')).toBe('CNY');
    expect(normalizeCurrencyCode('unknown', 'EUR')).toBe('EUR');
  });

  it('converts values between currencies with stable rounding', () => {
    expect(convertCurrency(100, 'USD', 'PLN')).toBe(400);
    expect(convertToUsd(400, 'PLN')).toBe(100);
    expect(convertCurrency(59, 'EUR', 'EUR')).toBe(59);
  });

  it('formats money using the resolved locale and symbol', () => {
    expect(formatMoney(149.99, 'pl', 'PLN')).toMatch(/zł/);
    expect(formatMoney(149.99, 'ru', 'RUB')).toMatch(/₽|RUB/);
    expect(formatMoney(null, 'en', 'USD')).toBe('—');
  });

  it('returns a simple currency hint for the current language', () => {
    expect(currencyHint('ja')).toBe('JPY');
    expect(currencyHint('pt')).toBe('EUR');
  });
});
