import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectBlockedMarketplacePage, fetchPublicPageData, isWholesaleSupplierUrl } from '@/lib/market-data';

describe('market-data supplier safeguards', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('detects wholesale supplier marketplace urls', () => {
    expect(isWholesaleSupplierUrl('https://www.alibaba.com/product-detail/example.html')).toBe(true);
    expect(isWholesaleSupplierUrl('https://www.aliexpress.com/item/100500.html')).toBe(true);
    expect(isWholesaleSupplierUrl('https://example.com/products/widget')).toBe(false);
  });

  it('flags captcha or unusual-traffic supplier pages as blocked', () => {
    const blockedHtml = `
      <html>
        <body>
          <div id="nocaptcha">Sorry, we detected unusual traffic from your network.</div>
        </body>
      </html>
    `;

    expect(detectBlockedMarketplacePage(blockedHtml, 'https://www.alibaba.com/product-detail/example.html')).toBe(true);
  });

  it('does not flag a normal product page as blocked', () => {
    const normalHtml = `
      <html>
        <head><title>Example product</title></head>
        <body>
          <div class="price">$29.99</div>
          <div>In stock</div>
        </body>
      </html>
    `;

    expect(detectBlockedMarketplacePage(normalHtml, 'https://example.com/products/widget')).toBe(false);
  });

  it('prefers structured product sale prices over tiny coupon snippets', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `
        <html>
          <head><title>SHEIN example</title></head>
          <body>
            <div>New user coupon: 4.25 USD off</div>
            <script>
              window.__DATA__ = {
                "sale_price": {"amount": "34.00", "amountWithSymbol": "34,00zł"},
                "retail_price": {"amount": "58.00", "amountWithSymbol": "58,00zł"}
              };
            </script>
          </body>
        </html>
      `,
    } as Response));

    const result = await fetchPublicPageData('https://pl.shein.com/example-product');

    expect(result.price).toBe(34);
    expect(result.currency).toBe('PLN');
    expect(result.priceUsd).toBeGreaterThan(8);
  });

  it('derives Poland demand and competition from live resale and rental search signals', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '<html><title>Inflatable bounce castle</title><div>US$899.00</div></html>',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => `
          <html>
            <body>
              <h2 class="result__title"><a class="result__a" href="https://allegro.pl/oferta/zamek-dmuchany-1">Allegro oferta</a></h2>
              <h2 class="result__title"><a class="result__a" href="https://www.olx.pl/oferta/zamek-dmuchany-2">OLX oferta</a></h2>
              <h2 class="result__title"><a class="result__a" href="https://sprzedajemy.pl/oferta/zamek-dmuchany-3">Sprzedajemy oferta</a></h2>
            </body>
          </html>
        `,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => `
          <html>
            <body>
              <h2 class="result__title"><a class="result__a" href="https://wynajem-dmuchanca.pl">Wynajem dmuchańca</a></h2>
              <h2 class="result__title"><a class="result__a" href="https://foton-events.pl/katalog-dmuchancow-na-wynajem">Foton Events</a></h2>
              <h2 class="result__title"><a class="result__a" href="https://www.olx.pl/wypozyczalnia/imprezy-i-wydarzenia/dmuchance-zamki/">OLX wypożyczalnia</a></h2>
            </body>
          </html>
        `,
      } as Response);

    vi.stubGlobal('fetch', fetchMock);

    const result = await (await import('@/lib/market-data')).collectMarketData({
      websiteUrl: 'https://www.alibaba.com/product-detail/example.html',
      queryText: 'dmuchaniec zamek dmuchany dla dzieci',
      selectedCountry: 'PL',
      includeRentalResearch: true,
    });

    expect(result.competitionScore).toBeGreaterThan(40);
    expect(result.demandScore).toBeGreaterThan(40);
    expect(result.resaleSignalCount).toBeGreaterThanOrEqual(3);
    expect(result.rentalSignalCount).toBeGreaterThanOrEqual(2);
    expect(result.resaleResearchUrls[0]).toContain('allegro.pl');
    expect(result.rentalResearchUrls[0]).toContain('wynajem-dmuchanca.pl');
  });
});
