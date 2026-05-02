import './globals.css';
import Navbar from '@/components/Navbar';
import BackgroundFX from '@/components/BackgroundFX';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Manrope, Space_Grotesk } from 'next/font/google';
import { SITE } from '@/lib/site';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const headingFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.shortName} - Product Review, Ecommerce Validation and Dropshipping Analysis`,
    template: `%s | ${SITE.shortName}`,
  },
  description: SITE.researchDescription,
  keywords: [
    'ufrev.com',
    'product review',
    'ecommerce validation',
    'dropshipping product research',
    'supplier offer analysis',
    'pricing validation',
    'landing page review',
    'AI product analysis',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: `${SITE.shortName} - Product Review, Ecommerce Validation and Dropshipping Analysis`,
    description: SITE.researchDescription,
    url: SITE.url,
    siteName: SITE.shortName,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.shortName} - Product Review, Ecommerce Validation and Dropshipping Analysis`,
    description: SITE.researchDescription,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const language = await getLanguage();

  return (
    <html lang={language}>
      <body className={`${bodyFont.variable} ${headingFont.variable} relative min-h-screen antialiased`}>
        <BackgroundFX />
        <Navbar />

        <main className="px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          {children}
        </main>

        <footer className="mt-20 border-t border-white/10 px-6 py-10 text-sm text-slate-400">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="font-semibold text-white">{SITE.shortName}</div>
              <div>
                {tr(language,{en:'Ultra Future Review helps evaluate products, offers, invoices, and growth moves before you waste budget.',pl:'Ultra Future Review pomaga oceniać produkty, oferty, faktury i ruchy wzrostowe zanim przepalisz budżet.',de:'KI für Umsatzpotenzial, Konversionsbarrieren und Wachstumsempfehlungen.',es:'IA para evaluar potencial de ventas, barreras de conversión y recomendaciones de crecimiento.',pt:'IA para avaliar potencial de vendas, barreiras de conversão e recomendações de crescimento.',ru:'AI для оценки потенциала продаж, барьеров конверсии и рекомендаций по росту.'})}
              </div>
              <div className="mt-2">Support {SITE.supportEmail}</div>
            </div>
            <div className="flex flex-wrap gap-5">
              <Link href="/pricing">{tr(language,{en:'Pricing',pl:'Cennik',de:'Preise',es:'Precios',pt:'Preços',ru:'Тарифы'})}</Link>
              <Link href="/reviews">{tr(language,{en:'Reviews',pl:'Opinie',de:'Bewertungen',es:'Reseñas',pt:'Avaliações',ru:'Отзывы'})}</Link>
              <Link href="/support">{tr(language,{en:'Support',pl:'Wsparcie',de:'Support',es:'Soporte',pt:'Suporte',ru:'Поддержка'})}</Link>
              <Link href="/privacy">{tr(language,{en:'Privacy',pl:'Prywatność',de:'Datenschutz',es:'Privacidad',pt:'Privacidade',ru:'Конфиденциальность'})}</Link>
              <Link href="/cookies">{tr(language,{en:'Cookies',pl:'Cookies',de:'Cookies',es:'Cookies',pt:'Cookies',ru:'Cookies'})}</Link>
              <Link href="/terms">{tr(language,{en:'Terms',pl:'Regulamin',de:'AGB',es:'Términos',pt:'Termos',ru:'Условия'})}</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
